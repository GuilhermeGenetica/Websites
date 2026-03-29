import os
import sys
import json
import asyncio
import logging
import subprocess
import threading
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.plugin_manager import PluginManager
from core.workflow_engine import WorkflowEngine
from core.models import WorkflowDefinition, WorkflowNodeDef, WorkflowState
from core.system_info import get_system_info
from core.filesystem_service import (
    list_directory,
    list_directory_with_files,
    path_exists,
    path_stat,
    create_directory,
    create_directories,
)
from core.runner_agent import RunnerAgent
from core.runner_local import LocalRunner
from core.plugin_service import get_yaml_snippets, list_snippet_types
from core.tool_verifier import verify_plugin, verify_all_plugins, verify_plugin_with_install_cfg
from core.reference_manager import (
    REFERENCE_CATALOG,
    get_merged_catalog,
    get_all_download_progress,
    get_download_progress,
    start_download,
    cancel_download,
    add_custom_reference,
    remove_custom_reference,
    configure_reference,
    verify_index_files,
    set_event_loop as ref_mgr_set_event_loop,
    load_custom_refs,
    save_custom_refs,
)

from core.agent_manager import (
    handle_agent_ws, list_agents, get_agent_by_user,
    dispatch as agent_dispatch,
    browse_request as agent_browse_request,
    scan_plugins_request, write_plugin_request,
    get_user_plugins, set_user_plugins,
    get_agent_info, read_file_request,
    mkdir_request as agent_mkdir_request,
    rename_file_request as agent_rename_file_request,
    delete_file_request as agent_delete_file_request,
)

from core.settings_service import (
    build_default_settings,
    load_settings,
    save_settings,
    reset_to_defaults,
    validate_settings,
    validate_directories_access,
    create_configured_dirs,
    merge_plugin_paths,
)

from core.dep_analyzer import register_depcheck_routes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - [%(name)s] %(message)s",
    handlers=[
        logging.FileHandler("seqnode_engine.log"),
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger("seqnode.api")

PLUGINS_DIR = os.getenv(
    "SEQNODE_PLUGINS_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "plugins")),
)
STATE_DIR = os.getenv(
    "SEQNODE_STATE_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".seqnode_state")),
)
WORKFLOWS_DIR = os.getenv(
    "SEQNODE_WORKFLOWS_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "workflows")),
)
SETTINGS_FILE = os.getenv(
    "SEQNODE_SETTINGS_FILE",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".seqnode_settings.json")),
)
CUSTOM_REFS_FILE = os.path.join(os.path.dirname(SETTINGS_FILE), ".seqnode_custom_refs.json")

DEFAULT_SETTINGS = build_default_settings(plugins_dir=PLUGINS_DIR, workflows_dir=WORKFLOWS_DIR)

pm     = PluginManager(plugins_dir=PLUGINS_DIR)
engine = WorkflowEngine(plugin_manager=pm, state_dir=STATE_DIR)

connected_websockets: List[WebSocket] = []

_install_jobs: Dict[str, Any] = {}


async def broadcast_log(node_id: str, level: str, message: str):
    payload = json.dumps({"type": "log", "node_id": node_id, "level": level, "message": message})
    await _broadcast_raw(payload)


async def broadcast_event(data: dict):
    payload = json.dumps(data)
    await _broadcast_raw(payload)


async def _broadcast_raw(payload: str):
    dead = []
    for ws in connected_websockets:
        try:
            await ws.send_text(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in connected_websockets:
            connected_websockets.remove(ws)


async def broadcast_status_change(status: str, run_id: str):
    await broadcast_event({"type": "status_change", "status": status, "run_id": run_id})


engine.add_log_callback(broadcast_log)
engine.add_status_callback(broadcast_status_change)


def _get_settings() -> Dict[str, Any]:
    return load_settings(SETTINGS_FILE, DEFAULT_SETTINGS)


def _save_settings(settings: Dict[str, Any]):
    save_settings(SETTINGS_FILE, settings)


# ── Segurança: campos sensíveis que nunca devem sair do servidor em claro ─────
_SENSITIVE_FIELDS = {"api_key", "jwt_secret", "oauth_token"}
_MASKED_SENTINEL  = "__MASKED__"


def _strip_sensitive(settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Devolve uma cópia profunda das settings com campos sensíveis substituídos
    pelo sentinel __MASKED__. Utilizado em todos os endpoints GET que devolvem
    settings ao browser, impedindo que chaves de API viajem pela rede
    desnecessariamente.
    """
    import copy
    s = copy.deepcopy(settings)
    for section_val in s.values():
        if isinstance(section_val, dict):
            for k in list(section_val.keys()):
                if k in _SENSITIVE_FIELDS and section_val[k]:
                    section_val[k] = _MASKED_SENTINEL
    return s


def _restore_sensitive(incoming: Dict[str, Any], current: Dict[str, Any]) -> Dict[str, Any]:
    """
    Antes de gravar em disco, percorre o payload incoming e, para cada campo
    sensível cujo valor seja o sentinel (utilizador não alterou o campo),
    restitui o valor real guardado em disco.
    Garante que um save normal não apaga acidentalmente as chaves reais.
    """
    for section_key, section_val in incoming.items():
        if isinstance(section_val, dict):
            for k in list(section_val.keys()):
                if k in _SENSITIVE_FIELDS and section_val[k] == _MASKED_SENTINEL:
                    section_val[k] = current.get(section_key, {}).get(k, "")
    return incoming


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(WORKFLOWS_DIR, exist_ok=True)
    loop = asyncio.get_event_loop()
    ref_mgr_set_event_loop(loop)
    logger.info(f"SeqNode-OS API started. Plugins: {len(pm.tools)}")
    yield
    logger.info("SeqNode-OS API shutting down.")


app = FastAPI(
    title="SeqNode-OS API",
    description="Modular Bioinformatics Workflow Orchestration System",
    version="0.3.0",
    lifespan=lifespan,
)

# CORS — permite que o frontend React (dev: localhost:5173, prod: seqnode.onnetweb.com)
# comunique com o backend incluindo backends em VPS remota.
#
# IMPORTANTE: allow_credentials=True + allow_origins=["*"] é combinação inválida pelo
# spec CORS — o Starlette passa a reflectir a origem real em vez de "*", o que duplica
# o header se um proxy (Nginx) já o adicionou. Por isso usamos origens explícitas.
# allow_headers=["*"] com credentials também é rejeitado por browsers modernos —
# é necessário listar os headers customizados explicitamente.
_CORS_ORIGINS = [
    "https://seqnode.onnetweb.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "X-Seqnode-User-Id",   # header customizado para roteamento de agente
    ],
    expose_headers=["Content-Type"],
)

STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── Dependency Analyzer routes (modular, self-contained) ──────────────────
register_depcheck_routes(app, pm, _get_settings, _save_settings)

# ── Fase 1 — MCP Server ───────────────────────────────────────────────────
import os as _os
_MCP_ENABLED = _os.getenv("SEQNODE_MCP_ENABLED", "true").lower() != "false"
if _MCP_ENABLED:
    try:
        from api.mcp_server import create_mcp_router
        _mcp_available = True
    except ImportError:
        _mcp_available = False
        logger.warning("MCP package not installed. Run: pip install mcp>=1.0.0")
else:
    _mcp_available = False

if _mcp_available:
    try:
        _mcp_router = create_mcp_router(pm, engine, _get_settings)
        app.include_router(_mcp_router)
        logger.info("MCP Server active at /mcp/sse and /mcp/manifest")
    except ImportError as _mcp_err:
        _mcp_available = False
        logger.warning(f"MCP package not installed. Run: pip install mcp>=1.0.0 ({_mcp_err})")
# ── FIM Fase 1 — MCP Server ───────────────────────────────────────────────

# ── Fase 5 — Auth middleware setup ────────────────────────────────────────
from api.auth_middleware import make_get_current_user
from core.auth_service import (
    authenticate_user, create_user, create_token,
    list_users as list_auth_users, delete_user as delete_auth_user,
    has_users, has_permission
)
get_current_user = make_get_current_user(_get_settings)
# ── FIM Fase 5 setup ──────────────────────────────────────────────────────


@app.get("/", response_class=HTMLResponse)
async def serve_gui():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>SeqNode-OS</h1><p>GUI not found. Place index.html in gui/static/</p>")


# ── LLM Models ─────────────────────────────────────────────────────────────
# SEGURANÇA (BUG 2 corrigido): endpoint alterado de GET para POST de modo a que
# a api_key seja transmitida no body JSON e nunca fique exposta na URL
# (logs do servidor, historial do browser, proxies reversos).
class LLMModelsRequest(BaseModel):
    provider: str
    api_key:  Optional[str] = None
    api_base: Optional[str] = None


@app.post("/api/llm/models")
async def get_llm_models(payload: LLMModelsRequest):
    import httpx

    provider = payload.provider
    api_base = payload.api_base or ""

    # Se o browser enviou o sentinel ou nada, usa a chave guardada em disco
    if payload.api_key and payload.api_key != _MASKED_SENTINEL:
        api_key = payload.api_key
    else:
        stored  = _get_settings().get("llm_config", {})
        api_key = stored.get("api_key", "") if stored.get("provider") == provider else ""

    models = []
    # This suffix is appended to embedded offline model names so users can distinguish
    # them from real API-fetched names. Must NEVER be sent to any external LLM API.
    suffix = " (Embedded OffLine List)"
    try:
        if provider == "openai":
            if api_key:
                headers = {"Authorization": f"Bearer {api_key}"}
                async with httpx.AsyncClient() as client:
                    resp = await client.get("https://api.openai.com/v1/models", headers=headers, timeout=15)
                    resp.raise_for_status()
                    data = resp.json().get("data", [])
                    models = [m["id"] for m in data if "gpt" in m["id"] or "o1" in m["id"] or "o3" in m["id"]]
                    models.sort(reverse=True)
            else:
                models = [f"gpt-4o{suffix}", f"gpt-4o-mini{suffix}", f"o1-preview{suffix}", f"o3-mini{suffix}"]

        elif provider == "anthropic":
            if api_key:
                headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
                async with httpx.AsyncClient() as client:
                    resp = await client.get("https://api.anthropic.com/v1/models", headers=headers, timeout=15)
                    try:
                        resp.raise_for_status()
                        models = [m["id"] for m in resp.json().get("data", [])]
                        models.sort(reverse=True)
                    except Exception:
                        models = [f"claude-3-7-sonnet-20250219{suffix}", f"claude-3-5-sonnet-20241022{suffix}", f"claude-3-5-haiku-20241022{suffix}"]
            else:
                models = [f"claude-3-7-sonnet-20250219{suffix}", f"claude-3-5-sonnet-20241022{suffix}", f"claude-3-5-haiku-20241022{suffix}", f"claude-3-opus-20240229{suffix}"]

        elif provider == "gemini":
            if api_key:
                url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, timeout=15)
                    resp.raise_for_status()
                    models = [m["name"].replace("models/", "") for m in resp.json().get("models", []) if "gemini" in m["name"]]
                    models.sort(reverse=True)
            else:
                models = [f"gemini-2.5-flash{suffix}", f"gemini-2.0-flash{suffix}", f"gemini-2.0-pro-exp{suffix}", f"gemini-1.5-pro{suffix}"]

        elif provider == "grok":
            if api_key:
                headers = {"Authorization": f"Bearer {api_key}"}
                async with httpx.AsyncClient() as client:
                    resp = await client.get("https://api.x.ai/v1/models", headers=headers, timeout=15)
                    resp.raise_for_status()
                    models = [m["id"] for m in resp.json().get("data", [])]
                    models.sort(reverse=True)
            else:
                models = [f"grok-3-latest{suffix}", f"grok-2-latest{suffix}", f"grok-2-vision-latest{suffix}"]

        elif provider == "azure":
            models = [f"gpt-4o (Azure){suffix}", f"gpt-4o-mini (Azure){suffix}"]

        elif provider in ["ollama", "custom"]:
            base = api_base.rstrip("/") if api_base else "http://localhost:11434/v1"
            url  = f"{base}/models"
            headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=headers, timeout=15)
                resp.raise_for_status()
                data = resp.json()
                if "data" in data:
                    models = [m["id"] for m in data["data"]]
                elif "models" in data:
                    models = [m["name"] for m in data["models"]]

    except Exception as e:
        logger.warning(f"Failed to fetch real models for {provider}, using offline embedded list. Error: {e}")
        if provider == "openai":    models = [f"gpt-4o{suffix}", f"gpt-4o-mini{suffix}"]
        elif provider == "anthropic": models = [f"claude-3-7-sonnet-20250219{suffix}"]
        elif provider == "gemini":  models = [f"gemini-2.5-flash{suffix}"]
        elif provider == "grok":    models = [f"grok-2-latest{suffix}"]
        elif provider == "azure":   models = [f"gpt-4o (Azure){suffix}"]

    return {"models": models}

# ── FIM do LLM Models ──────────────────────────────────────────────────────────

# ── Fase 2 — AI Workflow Builder ─────────────────────────────────────────────
# Lazy import — prevents a syntax/dependency error in ai_workflow_builder.py
# from crashing the server and breaking CORS for ALL routes.
try:
    from api.ai_workflow_builder import (
        BuildWorkflowRequest     as _AWBRequest,
        BuildWorkflowResponse    as _AWBResponse,
        build_workflow_from_prompt as _build_workflow,
        GeneratePluginYamlRequest  as _GenYamlRequest,
        GeneratePluginYamlResponse as _GenYamlResponse,
        generate_plugin_yaml       as _generate_yaml,
    )
    _AI_BUILDER_OK = True
except Exception as _ai_err:
    logger.error(f"AI builder module failed to import: {_ai_err}")
    _AI_BUILDER_OK = False

@app.post("/api/ai/build-workflow")
async def ai_build_workflow(payload: Dict[str, Any]):
    """
    Generates a SeqNode-OS workflow from natural language.
    Uses the provider/model configured in settings (or override in payload).
    """
    if not _AI_BUILDER_OK:
        raise HTTPException(status_code=503, detail="AI builder module unavailable — check server logs")
    settings = _get_settings()
    req = _AWBRequest(**payload)
    return await _build_workflow(req, pm, engine, settings)


class LLMTestRequest(BaseModel):
    provider: str
    api_key:  Optional[str] = None
    api_base: Optional[str] = None

@app.post("/api/ai/test-connection")
async def ai_test_connection(payload: LLMTestRequest):
    """
    Tests LLM connectivity using the stored or provided credentials.
    Returns {ok: bool, message: str, models_count: int}.
    """
    import httpx

    provider = payload.provider
    api_base = payload.api_base or ""

    if payload.api_key and payload.api_key != _MASKED_SENTINEL:
        api_key = payload.api_key
    else:
        stored  = _get_settings().get("llm_config", {})
        api_key = stored.get("api_key", "") if stored.get("provider") == provider else ""

    try:
        if provider == "anthropic":
            headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
            async with httpx.AsyncClient() as client:
                resp = await client.get("https://api.anthropic.com/v1/models", headers=headers, timeout=15)
                resp.raise_for_status()
                models = resp.json().get("data", [])
                return {"ok": True, "message": f"Connected — {len(models)} models available.", "models_count": len(models)}

        elif provider == "openai":
            headers = {"Authorization": f"Bearer {api_key}"}
            async with httpx.AsyncClient() as client:
                resp = await client.get("https://api.openai.com/v1/models", headers=headers, timeout=15)
                resp.raise_for_status()
                models = [m for m in resp.json().get("data", []) if "gpt" in m["id"] or "o1" in m["id"] or "o3" in m["id"]]
                return {"ok": True, "message": f"Connected — {len(models)} models available.", "models_count": len(models)}

        elif provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=15)
                resp.raise_for_status()
                models = [m for m in resp.json().get("models", []) if "gemini" in m.get("name", "")]
                return {"ok": True, "message": f"Connected — {len(models)} Gemini models available.", "models_count": len(models)}

        elif provider == "grok":
            headers = {"Authorization": f"Bearer {api_key}"}
            async with httpx.AsyncClient() as client:
                resp = await client.get("https://api.x.ai/v1/models", headers=headers, timeout=15)
                resp.raise_for_status()
                models = resp.json().get("data", [])
                return {"ok": True, "message": f"Connected — {len(models)} models available.", "models_count": len(models)}

        elif provider in ["ollama", "custom"]:
            base = api_base.rstrip("/") if api_base else "http://localhost:11434/v1"
            headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{base}/models", headers=headers, timeout=15)
                resp.raise_for_status()
                data = resp.json()
                count = len(data.get("data") or data.get("models") or [])
                return {"ok": True, "message": f"Connected — {count} models available.", "models_count": count}

        elif provider == "azure":
            return {"ok": False, "message": "Azure connection test requires deployment URL and API key.", "models_count": 0}

        else:
            return {"ok": False, "message": f"Unknown provider: {provider}", "models_count": 0}

    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status == 401:
            return {"ok": False, "message": "Authentication failed — check your API key.", "models_count": 0}
        elif status == 403:
            return {"ok": False, "message": "Access forbidden — key may lack required permissions.", "models_count": 0}
        else:
            return {"ok": False, "message": f"HTTP {status} from provider.", "models_count": 0}
    except Exception as e:
        return {"ok": False, "message": f"Connection error: {str(e)}", "models_count": 0}

# ── FIM AI Test Connection ─────────────────────────────────────────────────────

@app.post("/api/ai/refine-workflow")
async def ai_refine_workflow(payload: Dict[str, Any]):
    """
    Refines an existing workflow based on textual feedback.
    payload: {workflow: {...}, feedback: "...", provider, model, api_key}
    """
    if not _AI_BUILDER_OK:
        raise HTTPException(status_code=503, detail="AI builder module unavailable — check server logs")
    settings = _get_settings()
    req = _AWBRequest(
        prompt=payload.get("feedback", ""),
        provider=payload.get("provider"),
        model=payload.get("model"),
        api_key=payload.get("api_key"),
        api_base=payload.get("api_base"),
        existing_workflow=payload.get("workflow"),
    )
    return await _build_workflow(req, pm, engine, settings)


@app.post("/api/ai/generate-plugin-yaml")
async def ai_generate_plugin_yaml(payload: Dict[str, Any]):
    """
    Uses the configured LLM to generate a SeqNode-OS plugin YAML for a missing tool.
    Returns yaml_content (string) that can be written to the agent filesystem.
    """
    if not _AI_BUILDER_OK:
        raise HTTPException(status_code=503, detail="AI builder module unavailable — check server logs")
    settings = _get_settings()
    req = _GenYamlRequest(**payload)
    return await _generate_yaml(req, settings)

# ── FIM AI Workflow Builder ────────────────────────────────────────────────────

# ── Fase 3 — Audit Service ────────────────────────────────────────────────────
from core.audit_service import build_audit_document, export_audit_json, export_audit_json_ld, export_audit_pdf
from fastapi.responses import Response as _Response

@app.get("/api/runs/{run_id}/audit")
async def get_run_audit(run_id: str, format: str = "json"):
    """
    Exports audit document for a run.
    format: 'json' | 'jsonld' | 'pdf' | 'html'
    """
    run_state = engine.state_manager.load_state(run_id)
    if not run_state:
        raise HTTPException(status_code=404, detail="Run not found")

    # Try to load the original workflow
    wf_def = None
    wf_path = os.path.join(WORKFLOWS_DIR, f"{run_id}.json")
    if not os.path.exists(wf_path):
        try:
            state_dict = run_state.model_dump()
            wf_name = state_dict.get("workflow_name", "")
            if wf_name:
                wf_path2 = os.path.join(WORKFLOWS_DIR, f"{wf_name}.json")
                if os.path.exists(wf_path2):
                    with open(wf_path2) as f:
                        import json as _json
                        wf_def = _json.load(f)
        except Exception:
            pass
    else:
        with open(wf_path) as f:
            import json as _json
            wf_def = _json.load(f)

    sys_info = get_system_info(
        plugins_loaded=len(pm.tools),
        plugins_dir=pm.plugins_dir,
        workflows_dir=WORKFLOWS_DIR,
        settings_file=SETTINGS_FILE,
        settings_dirs=_get_settings().get("dirs", {}),
    )
    doc = build_audit_document(run_state, wf_def, sys_info)

    if format == "pdf":
        pdf_bytes = export_audit_pdf(doc)
        ct = "application/pdf" if pdf_bytes[:4] == b'%PDF' else "text/html"
        ext = "pdf" if ct == "application/pdf" else "html"
        return _Response(
            content=pdf_bytes,
            media_type=ct,
            headers={"Content-Disposition": f"attachment; filename=audit_{run_id}.{ext}"}
        )
    elif format == "jsonld":
        return export_audit_json_ld(doc)
    else:
        return export_audit_json(doc)


@app.get("/api/runs/{run_id}/audit/verify")
async def verify_run_audit(run_id: str):
    """Verifies integrity of the audit document. Returns {valid: bool, checksum}."""
    run_state = engine.state_manager.load_state(run_id)
    if not run_state:
        raise HTTPException(status_code=404, detail="Run not found")
    import hashlib as _hashlib
    import json as _json
    from dataclasses import asdict as _asdict
    sys_info = get_system_info(
        plugins_loaded=len(pm.tools),
        plugins_dir=pm.plugins_dir,
        workflows_dir=WORKFLOWS_DIR,
        settings_file=SETTINGS_FILE,
        settings_dirs=_get_settings().get("dirs", {}),
    )
    doc = build_audit_document(run_state, None, sys_info)
    stored_checksum = doc.integrity_checksum
    doc_dict = _asdict(doc)
    doc_dict.pop("integrity_checksum")
    recalculated = _hashlib.sha256(_json.dumps(doc_dict, sort_keys=True).encode()).hexdigest()
    return {"valid": stored_checksum == recalculated, "checksum": stored_checksum}
# ── FIM Audit Service ──────────────────────────────────────────────────────────

# ── Fase 4 — Plugin Hub ────────────────────────────────────────────────────────
_HUB_ENABLED = os.getenv("SEQNODE_HUB_ENABLED", "true").lower() != "false"

if _HUB_ENABLED:
    try:
        from api.plugin_hub import (
            fetch_hub_index, install_hub_plugin, search_plugins,
            mark_installed, invalidate_hub_cache
        )
        _hub_available = True
    except ImportError as e:
        _hub_available = False
        logger.warning(f"Plugin Hub unavailable: {e}")
else:
    _hub_available = False


@app.get("/api/plugins/hub")
async def get_hub_plugins(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    verified_only: bool = False,
):
    if not _hub_available:
        raise HTTPException(status_code=503, detail="Plugin Hub is disabled (SEQNODE_HUB_ENABLED=false)")
    plugins = await fetch_hub_index()
    if search:
        plugins = search_plugins(plugins, search)
    if tag:
        plugins = [p for p in plugins if tag in p.get("tags", [])]
    if verified_only:
        plugins = [p for p in plugins if p.get("verified", False)]
    local_ids = {t.id for t in pm.list_tools()}
    plugins = mark_installed(plugins, local_ids)
    return {"plugins": plugins, "total": len(plugins), "source": "hub"}


@app.post("/api/plugins/hub/install")
async def install_from_hub(payload: Dict[str, Any]):
    if not _hub_available:
        raise HTTPException(status_code=503, detail="Plugin Hub is disabled")
    yaml_url = payload.get("yaml_url", "").strip()
    if not yaml_url:
        raise HTTPException(status_code=400, detail="'yaml_url' is required")
    # Basic URL validation (only HTTPS from known domains)
    allowed_domains = ["raw.githubusercontent.com", "gist.githubusercontent.com"]
    if not any(d in yaml_url for d in allowed_domains):
        if os.getenv("SEQNODE_HUB_ALLOW_ANY_URL", "false").lower() != "true":
            raise HTTPException(status_code=400, detail=f"URL must be from: {allowed_domains}")
    result = await install_hub_plugin(yaml_url, pm.plugins_dir)
    pm.reload_plugins()
    await broadcast_event({"type": "plugin_installed", "plugin_id": result["plugin_id"], "source": "hub"})
    return result


@app.get("/api/plugins/hub/tags")
async def get_hub_tags():
    if not _hub_available:
        raise HTTPException(status_code=503, detail="Plugin Hub is disabled")
    plugins = await fetch_hub_index()
    tags: set = set()
    for p in plugins:
        tags.update(str(t) for t in p.get("tags", []))
    return {"tags": sorted(tags)}


@app.post("/api/plugins/hub/refresh")
async def refresh_hub_cache():
    """Forces hub cache refresh."""
    if not _hub_available:
        raise HTTPException(status_code=503, detail="Plugin Hub is disabled")
    invalidate_hub_cache()
    plugins = await fetch_hub_index()
    return {"status": "refreshed", "total": len(plugins)}
# ── FIM Plugin Hub ─────────────────────────────────────────────────────────────

# ── Fase 5 — Auth endpoints ────────────────────────────────────────────────────

@app.post("/api/auth/login")
async def auth_login(payload: Dict[str, Any]):
    username = payload.get("username", "").strip()
    password = payload.get("password", "")
    if not username or not password:
        raise HTTPException(status_code=400, detail="username and password required")
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    settings = _get_settings()
    expires_hours = settings.get("auth", {}).get("token_ttl_h", 24)
    token = create_token(user["username"], user["role"], expires_hours)
    logger.info(f"Auth: user '{username}' logged in")
    return {"access_token": token, "token_type": "bearer", "username": username, "role": user["role"]}


@app.post("/api/auth/setup")
async def auth_setup(payload: Dict[str, Any]):
    """Creates the first admin user. Only works if no users exist yet."""
    if has_users():
        raise HTTPException(status_code=403, detail="Setup already completed. Use admin account to manage users.")
    username = payload.get("username", "").strip()
    password = payload.get("password", "")
    if not username or len(password) < 8:
        raise HTTPException(status_code=400, detail="username required and password must be >= 8 chars")
    user = create_user(username, password, "admin")
    logger.info(f"Auth: first admin user '{username}' created via /api/auth/setup")
    return user


@app.get("/api/auth/me")
async def auth_me(current_user: dict = Depends(get_current_user)):
    return current_user


@app.get("/api/auth/users")
async def auth_list_users(current_user: dict = Depends(get_current_user)):
    if not has_permission(current_user["role"], "users_manage"):
        raise HTTPException(status_code=403, detail="Admin role required")
    return list_auth_users()


@app.post("/api/auth/users")
async def auth_create_user(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    if not has_permission(current_user["role"], "users_manage"):
        raise HTTPException(status_code=403, detail="Admin role required")
    username = payload.get("username", "").strip()
    password = payload.get("password", "")
    role = payload.get("role", "analyst")
    if not username or len(password) < 8:
        raise HTTPException(status_code=400, detail="username required and password must be >= 8 chars")
    try:
        return create_user(username, password, role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/auth/users/{username}")
async def auth_delete_user(username: str, current_user: dict = Depends(get_current_user)):
    if not has_permission(current_user["role"], "users_manage"):
        raise HTTPException(status_code=403, detail="Admin role required")
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    if not delete_auth_user(username):
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted", "username": username}
# ── FIM Auth ───────────────────────────────────────────────────────────────────


@app.get("/static/help.html", response_class=HTMLResponse)
async def serve_help():
    help_path = os.path.join(STATIC_DIR, "help.html")
    if os.path.exists(help_path):
        with open(help_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Help page not found</h1><p>Place help.html in gui/static/</p>")


@app.get("/api/system/info")
def system_info():
    current_settings = _get_settings()
    info = get_system_info(
        plugins_loaded=len(pm.tools),
        plugins_dir=pm.plugins_dir,
        workflows_dir=WORKFLOWS_DIR,
        settings_file=SETTINGS_FILE,
        settings_dirs=current_settings.get("dirs", {}),
    )
    # Fase 5 — Auth info (always exposed, even when auth is disabled)
    info["auth_enabled"] = current_settings.get("auth", {}).get("enabled", False)
    info["has_users"] = has_users()
    return info


@app.get("/api/plugins")
async def list_plugins(request: Request, category: Optional[str] = None, search: Optional[str] = None):
    if search:
        tools = pm.search_tools(search)
    elif category:
        tools = pm.list_tools(category=category)
    else:
        tools = pm.list_tools()

    # Collect global plugin IDs for source tagging
    global_ids = {t.id for t in tools}

    # Merge user plugins for the requesting user
    user_id_hdr = request.headers.get("X-Seqnode-User-Id", "")
    user_plugin_manifests: dict = {}
    if user_id_hdr:
        try:
            agent_id = get_agent_by_user(int(user_id_hdr))
            if agent_id:
                user_plugin_manifests = get_user_plugins(agent_id)
        except (ValueError, TypeError):
            pass

    if user_plugin_manifests:
        # Build merged dict: global first, user overrides same id
        merged: dict = {t.id: t for t in tools}
        for uid, uplugin in user_plugin_manifests.items():
            if category and getattr(uplugin, "category", "") != category:
                continue
            if search:
                haystack = f"{getattr(uplugin,'name','')} {getattr(uplugin,'description','')} {getattr(uplugin,'category','')}".lower()
                if search.lower() not in haystack:
                    continue
            merged[uid] = uplugin
        tools = list(merged.values())

    result = []
    for t in tools:
        d = t.model_dump()
        d["source"] = "global" if t.id in global_ids else "user"
        result.append(d)
    return result


@app.get("/api/plugins/categories")
def list_categories():
    return pm.list_categories()


@app.get("/api/plugins/template/yaml")
def get_plugin_template():
    return {"template": pm.export_plugin_template()}


@app.get("/api/plugins/snippets")
def get_plugin_snippets():
    return get_yaml_snippets()


@app.get("/api/plugins/snippets/types")
def get_plugin_snippet_types():
    return {"types": list_snippet_types()}


@app.post("/api/plugins/reload")
def reload_plugins():
    changes = pm.reload_plugins()
    return {"status": "reloaded", "count": len(pm.tools), "changes": changes}


@app.get("/api/plugins/raw/{tool_id}")
def get_plugin_raw(tool_id: str):
    data = pm.get_plugin_raw(tool_id)
    if not data:
        raise HTTPException(status_code=404, detail="Plugin not found.")
    return data


class PluginRawPayload(BaseModel):
    tool_id: Optional[str] = None
    filename: str
    content: str


@app.post("/api/plugins/raw")
def save_plugin_raw(payload: PluginRawPayload):
    try:
        success = pm.save_plugin_raw(payload.tool_id, payload.filename, payload.content)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to save plugin.")
        return {"status": "saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/plugins/{tool_id}")
def delete_plugin(tool_id: str):
    success = pm.delete_plugin(tool_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plugin not found.")
    return {"status": "deleted"}


# ── User plugin endpoints (agent-side storage) ─────────────────────────────────

class UserPluginScanPayload(BaseModel):
    plugins_dir: str

class UserPluginWritePayload(BaseModel):
    plugins_dir: str
    filename:    str
    content:     str


def _get_agent_for_request(request: Request) -> str:
    """Resolve agent_id from X-Seqnode-User-Id header, fallback to first connected agent."""
    user_id_hdr = request.headers.get("X-Seqnode-User-Id", "")
    agent_id = None
    if user_id_hdr:
        try:
            agent_id = get_agent_by_user(int(user_id_hdr))
        except (ValueError, TypeError):
            pass
    if not agent_id:
        connected = list_agents()
        if connected:
            agent_id = connected[0]["agent_id"]
    return agent_id


@app.post("/api/plugins/user/scan")
async def user_plugin_scan(request: Request, payload: UserPluginScanPayload):
    """
    Ask the user's agent to scan a local directory for plugin YAML files.
    Parses the returned YAML content into PluginManifest objects and stores
    them in-memory on the agent session (never written to VPS disk).
    """
    if not payload.plugins_dir or not payload.plugins_dir.strip():
        raise HTTPException(status_code=400, detail="plugins_dir is required")

    agent_id = _get_agent_for_request(request)
    if not agent_id:
        raise HTTPException(status_code=503, detail="No agent connected")

    plugins_dir = payload.plugins_dir.strip()
    result = await scan_plugins_request(agent_id, plugins_dir)
    if result is None:
        raise HTTPException(status_code=504, detail="Agent scan timed out or failed")

    if result.get("error"):
        err_msg = result["error"]
        # Directory does not exist yet — create it automatically on the agent, then retry.
        if "not found" in err_msg.lower() or "no such file" in err_msg.lower() or "does not exist" in err_msg.lower():
            from core.agent_manager import mkdir_request
            mkdir_ok = await mkdir_request(agent_id, plugins_dir)
            if mkdir_ok and mkdir_ok.get("ok"):
                # Retry scan after creation
                result = await scan_plugins_request(agent_id, plugins_dir)
                if result is None or result.get("error"):
                    return {"status": "ok", "loaded": 0, "plugins": [], "errors": [], "note": f"Directory created but scan returned no results: {plugins_dir}"}
            else:
                return {"status": "ok", "loaded": 0, "plugins": [], "errors": [], "note": f"Directory not yet created: {plugins_dir}"}
        else:
            raise HTTPException(status_code=422, detail=f"Agent error: {err_msg}")

    # Parse YAML → PluginManifest, store on session
    if not get_agent_info(agent_id):
        raise HTTPException(status_code=503, detail="Agent disconnected during scan")

    try:
        import yaml as _yaml
    except ImportError:
        raise HTTPException(status_code=500, detail="PyYAML not installed on VPS (pip install pyyaml)")

    from pydantic import ValidationError as _VE
    from core.models import PluginManifest

    loaded: dict = {}
    errors: list = []
    for entry in result.get("plugins", []):
        fname   = entry.get("filename", "?")
        content = entry.get("content",  "")
        try:
            docs = [d for d in _yaml.safe_load_all(content) if isinstance(d, dict)]
            if not docs:
                errors.append(f"{fname}: no valid YAML document")
                continue
            plugin = PluginManifest(**docs[0])
            loaded[plugin.id] = plugin
        except _VE as ve:
            errors.append(f"{fname}: validation — {ve.error_count()} error(s)")
        except Exception as e:
            errors.append(f"{fname}: parse error — {e}")

    set_user_plugins(agent_id, loaded)
    logger.info(f"Agent {agent_id} plugin scan: {len(loaded)} loaded, {len(errors)} errors")

    return {
        "status":  "ok",
        "loaded":  len(loaded),
        "plugins": [p.model_dump() for p in loaded.values()],
        "errors":  errors,
    }


@app.post("/api/plugins/user/write")
async def user_plugin_write(request: Request, payload: UserPluginWritePayload):
    """
    Write a plugin YAML file to the user's local plugins directory via the agent.
    Used for both Create New Plugin and Import Plugin flows.
    After writing, the caller should trigger /api/plugins/user/scan to reload.
    """
    if not payload.plugins_dir or not payload.filename:
        raise HTTPException(status_code=400, detail="plugins_dir and filename are required")

    agent_id = _get_agent_for_request(request)
    if not agent_id:
        raise HTTPException(status_code=503, detail="No agent connected")

    # Sanitize filename server-side as well
    filename = os.path.basename(payload.filename.strip())
    if not filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    if not filename.endswith((".yaml", ".yml")):
        filename += ".yaml"

    result = await write_plugin_request(agent_id, payload.plugins_dir.strip(), filename, payload.content)
    if result is None:
        raise HTTPException(status_code=504, detail="Agent write timed out or failed")

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Agent write failed: {result.get('error', 'unknown')}")

    return {"status": "ok", "filename": filename}


@app.get("/api/plugins/{tool_id}")
def get_plugin(tool_id: str):
    tool = pm.get_tool(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Plugin '{tool_id}' not found.")
    return tool.model_dump()


@app.get("/api/plugins/{tool_id}/install-status")
def plugin_install_status(tool_id: str):
    tool = pm.get_tool(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Plugin '{tool_id}' not found.")
    settings     = _get_settings()
    plugin_paths = settings.get("plugin_paths", {})
    return verify_plugin_with_install_cfg(tool, plugin_paths, _install_jobs)


class PluginInstallPayload(BaseModel):
    tool_id:    str
    conda_env:  Optional[str] = None
    extra_args: Optional[str] = None


@app.post("/api/plugins/{tool_id}/install")
def plugin_install(tool_id: str, payload: PluginInstallPayload):
    tool = pm.get_tool(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Plugin '{tool_id}' not found.")
    if _install_jobs.get(tool_id, {}).get("status") == "running":
        return {"status": "already_running", "tool_id": tool_id}

    tool_data   = tool.model_dump()
    install_cfg = tool_data.get("install") or {}
    method      = install_cfg.get("method", "conda")
    conda_env   = payload.conda_env or install_cfg.get("conda_env", "base")
    pkg         = install_cfg.get("conda_package", "") or install_cfg.get("pip_package", "")
    channels    = install_cfg.get("conda_channels", ["bioconda", "conda-forge", "defaults"])

    if not pkg:
        raise HTTPException(status_code=400, detail="No conda_package/pip_package defined in plugin YAML.")

    if method == "pip":
        cmd = f"pip install '{pkg}' {payload.extra_args or ''} 2>&1"
    else:
        ch_flags = " ".join(f"-c {c}" for c in channels)
        cmd = f"conda install -y -n {conda_env} {ch_flags} '{pkg}' 2>&1"

    job = {"status": "running", "log": [], "cmd": cmd, "tool_id": tool_id, "proc": None, "returncode": None}
    _install_jobs[tool_id] = job

    def _run():
        try:
            proc = subprocess.Popen(
                cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, executable="/bin/bash", bufsize=1
            )
            job["proc"] = proc
            for line in proc.stdout:
                job["log"].append(line.rstrip())
            proc.wait()
            job["returncode"] = proc.returncode
            job["status"]     = "success" if proc.returncode == 0 else "error"
            if proc.returncode == 0:
                _autofill_paths_after_install(tool_id, install_cfg)
        except Exception as e:
            job["log"].append(f"FATAL: {e}")
            job["status"] = "error"

    threading.Thread(target=_run, daemon=True).start()
    return {"status": "started", "tool_id": tool_id, "cmd": cmd}


@app.get("/api/plugins/{tool_id}/install-logs")
def plugin_install_logs(tool_id: str, offset: int = 0):
    job = _install_jobs.get(tool_id)
    if not job:
        return {"status": "idle", "lines": [], "offset": 0, "total": 0}
    lines     = job["log"]
    new_lines = lines[offset:]
    return {"status": job["status"], "lines": new_lines, "offset": offset + len(new_lines), "total": len(lines)}


@app.delete("/api/plugins/{tool_id}/install")
def plugin_install_cancel(tool_id: str):
    job = _install_jobs.get(tool_id)
    if job:
        proc = job.get("proc")
        if proc:
            try:
                proc.terminate()
            except Exception:
                pass
        job["status"] = "cancelled"
    return {"status": "cancelled"}


def _autofill_paths_after_install(tool_id: str, install_cfg: dict):
    default_paths = install_cfg.get("default_paths", {})
    if not default_paths:
        return
    try:
        settings     = _get_settings()
        plugin_paths = settings.setdefault("plugin_paths", {})
        existing     = plugin_paths.get(tool_id, {})
        for k in ("bin_path", "refs_path", "lib_path"):
            if not existing.get(k) and default_paths.get(k):
                existing[k] = default_paths[k]
        plugin_paths[tool_id] = existing
        _save_settings(settings)
        logger.info(f"[install] Auto-filled paths for {tool_id}: {existing}")
    except Exception as e:
        logger.warning(f"[install] Could not auto-fill paths for {tool_id}: {e}")


@app.post("/api/workflow/validate")
def validate_workflow_endpoint(payload: Dict[str, Any]):
    try:
        wf = WorkflowDefinition(**payload.get("workflow", payload))
        errors = engine.validate_workflow(wf)
        return {"valid": len(errors) == 0, "errors": errors}
    except Exception as e:
        return {"valid": False, "errors": [str(e)]}


@app.post("/api/workflow/validate/basic")
def validate_workflow_basic_endpoint(payload: Dict[str, Any]):
    workflow_dict = payload.get("workflow", payload)
    return WorkflowEngine.validate_workflow_basic(workflow_dict)


@app.get("/api/workflow/schema")
def get_workflow_schema():
    return WorkflowEngine.get_workflow_schema()


@app.post("/api/workflow/preflight")
def preflight_check(payload: Dict[str, Any]):
    try:
        wf = WorkflowDefinition(**payload.get("workflow", payload))
        issues = engine.preflight_check(wf)
        return {
            "ok":      len(issues) == 0,
            "issues":  issues,
            "message": f"{len(issues)} tool(s) not found" if issues else "All tools available",
        }
    except Exception as e:
        return {"ok": False, "issues": [], "message": str(e)}


@app.post("/api/workflow/save")
def save_workflow_endpoint(payload: Dict[str, Any]):
    try:
        wf_data = payload.get("workflow", payload)
        wf = WorkflowDefinition(**wf_data)
        path = os.path.join(WORKFLOWS_DIR, f"{wf.id}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(wf.model_dump(), f, indent=2, default=str)
        return {"status": "saved", "path": path, "workflow_id": wf.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/workflow/list")
def list_workflows():
    results = []
    if os.path.isdir(WORKFLOWS_DIR):
        for fn in sorted(os.listdir(WORKFLOWS_DIR)):
            if fn.endswith(".json"):
                path = os.path.join(WORKFLOWS_DIR, fn)
                try:
                    with open(path, "r") as f:
                        data = json.load(f)
                    results.append({
                        "id":          data.get("id", fn),
                        "name":        data.get("name", "Untitled"),
                        "description": data.get("description", ""),
                        "nodes_count": len(data.get("nodes", [])),
                        "filename":    fn,
                    })
                except Exception:
                    pass
    return results


@app.get("/api/workflow/load/{workflow_id}")
def load_workflow(workflow_id: str):
    path = os.path.join(WORKFLOWS_DIR, f"{workflow_id}.json")
    if not os.path.exists(path):
        for fn in os.listdir(WORKFLOWS_DIR):
            if fn.endswith(".json"):
                fp = os.path.join(WORKFLOWS_DIR, fn)
                try:
                    with open(fp) as f:
                        data = json.load(f)
                    if data.get("id") == workflow_id:
                        return data
                except Exception:
                    pass
        raise HTTPException(status_code=404, detail="Workflow not found.")
    with open(path, "r") as f:
        return json.load(f)


@app.delete("/api/workflow/{workflow_id}")
def delete_workflow(workflow_id: str):
    path = os.path.join(WORKFLOWS_DIR, f"{workflow_id}.json")
    if os.path.exists(path):
        os.remove(path)
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Workflow not found.")

@app.post("/api/execute")
async def execute_workflow_endpoint(request: Request, payload: Dict[str, Any]):
    try:
        wf_data = payload.get("workflow", payload)
        wf = WorkflowDefinition(**wf_data)
        errors = engine.validate_workflow(wf)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        current_settings = _get_settings()

        # ── Route to user-specific agent via X-Seqnode-User-Id header ──
        user_id_hdr = request.headers.get("X-Seqnode-User-Id", "")
        agent_id = None
        if user_id_hdr:
            try:
                agent_id = get_agent_by_user(int(user_id_hdr))
            except (ValueError, TypeError):
                pass

        # Fallback: use first connected agent if no user-specific agent found
        if not agent_id:
            connected = list_agents()
            if connected:
                agent_id = connected[0]["agent_id"]

        if agent_id:
            engine.set_runner(RunnerAgent(agent_id, engine))
            logger.info(f"Execution routed to agent {agent_id} (user={user_id_hdr or 'any'})")
        else:
            engine.set_runner(LocalRunner())
            logger.info("No agent connected — executing on VPS.")
        # ───────────────────────────────────────────────────────────────

        # Temporarily inject user plugins into the global PluginManager.
        # Safe: asyncio is single-threaded; no await between inject and execute start.
        _user_manifests = get_user_plugins(agent_id) if agent_id else {}
        _original_tools = dict(pm.tools)
        if _user_manifests:
            pm.tools = {**_original_tools, **_user_manifests}
            logger.info(f"Injected {len(_user_manifests)} user plugin(s) for execution")

        async def run_bg():
            try:
                await engine.execute_workflow(wf, settings=current_settings)
            except Exception as e:
                import traceback
                err_detail = traceback.format_exc()
                logger.error(f"Background execution error: {e}\n{err_detail}")
                try:
                    await broadcast_log("engine", "ERROR", f"[engine] Execution error: {e}")
                    await broadcast_status_change("FAILED", engine.current_state.run_id if engine.current_state else "unknown")
                except Exception:
                    pass
            finally:
                engine.set_runner(LocalRunner())
                pm.tools = _original_tools  # restore global-only plugin set

        asyncio.create_task(run_bg())
        await asyncio.sleep(0)

        run_id = engine.current_state.run_id if engine.current_state else "unknown"
        return {"status": "started", "run_id": run_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/execute/cancel")
def cancel_execution():
    engine.cancel()
    return {"status": "cancel_requested"}


@app.get("/api/execute/status")
def get_execution_status():
    if engine.current_state:
        return engine.current_state.model_dump()
    return {"status": "idle"}


@app.get("/api/runs")
def list_runs():
    return engine.state_manager.list_runs()


@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    run_state = engine.state_manager.load_state(run_id)
    if not run_state:
        raise HTTPException(status_code=404, detail="Run not found.")
    return run_state.model_dump()


@app.get("/api/runs/{run_id}/logs")
def get_run_logs(run_id: str, node_id: Optional[str] = None, level: Optional[str] = None):
    run_state = engine.state_manager.load_state(run_id)
    if not run_state:
        raise HTTPException(status_code=404, detail="Run not found.")
    logs = run_state.logs
    if node_id:
        logs = [l for l in logs if l.node_id == node_id]
    if level:
        logs = [l for l in logs if l.level == level]
    return [l.model_dump() for l in logs]


@app.delete("/api/runs/{run_id}")
def delete_run(run_id: str):
    deleted = engine.state_manager.delete_run(run_id)
    if deleted:
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Run not found.")


# ── Settings ───────────────────────────────────────────────────────────────────
# SEGURANÇA (BUG 4 corrigido): GET /api/settings devolve as settings com os
# campos sensíveis mascarados. A chave real fica sempre em disco e nunca
# viaja de volta ao browser desnecessariamente.
@app.get("/api/settings")
def get_settings():
    return _strip_sensitive(_get_settings())


# SEGURANÇA (BUG 3 corrigido): POST /api/settings restaura os valores reais
# para campos sensíveis que venham com o sentinel (não foram alterados pelo
# utilizador), evitando apagar chaves guardadas em disco.
@app.post("/api/settings")
def update_settings(payload: Dict[str, Any]):
    try:
        current = _get_settings()   # lê do disco — contém os valores reais

        # Repõe valores reais em campos com sentinel antes de qualquer merge
        payload = _restore_sensitive(payload, current)

        for section_key, section_val in payload.items():
            if isinstance(section_val, dict) and section_key in current and isinstance(current[section_key], dict):
                current[section_key].update(section_val)
            else:
                current[section_key] = section_val

        if "plugin_paths" in payload:
            current = merge_plugin_paths(current, payload["plugin_paths"])

        validation_errors = validate_settings(current)
        if validation_errors:
            raise HTTPException(status_code=422, detail={"validation_errors": validation_errors})

        # ── Validar permissões dos directórios ANTES de guardar ──
        dir_check = validate_directories_access(current)
        if dir_check["warnings"]:
            logger.warning(f"Directory access warnings: {dir_check['warnings']}")

        # Grava em disco com os valores REAIS (nunca o sentinel)
        _save_settings(current)

        if "dirs" in payload and "plugins" in payload["dirs"]:
            new_plugins_dir = payload["dirs"]["plugins"]
            if os.path.isdir(new_plugins_dir) and os.path.abspath(new_plugins_dir) != os.path.abspath(pm.plugins_dir):
                pm.plugins_dir = os.path.abspath(new_plugins_dir)
                pm.load_plugins()
                logger.info(f"Plugins directory changed to: {pm.plugins_dir}")

        return {
            "status":      "saved",
            "settings":    _strip_sensitive(current),   # devolve mascarado
            "dir_warnings": dir_check["warnings"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/settings/validate-dirs")
def validate_settings_dirs(payload: Dict[str, Any]):
    """
    Valida permissões dos directórios ANTES do utilizador gravar.
    O frontend pode chamar isto quando o utilizador altera um campo de directório.
    """
    from core.settings_service import validate_directories_access
    return validate_directories_access(payload)


@app.get("/api/settings/defaults")
def get_default_settings():
    return DEFAULT_SETTINGS


@app.post("/api/settings/reset")
def reset_settings():
    try:
        fresh = reset_to_defaults(SETTINGS_FILE, DEFAULT_SETTINGS)
        return {"status": "reset", "settings": fresh}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/settings/create-dirs")
async def create_settings_dirs(request: Request):
    try:
        settings = _get_settings()
        result   = create_configured_dirs(settings)

        # Also create directories on the user's agent machine
        from core.agent_manager import mkdir_request, get_agent_by_user, list_agents
        user_id_hdr = request.headers.get("X-Seqnode-User-Id", "")
        agent_id    = None
        if user_id_hdr:
            try:
                agent_id = get_agent_by_user(int(user_id_hdr))
            except Exception:
                pass
        if not agent_id:
            agents = list_agents()
            if agents:
                agent_id = agents[0]["agent_id"]

        if agent_id:
            dirs_cfg  = settings.get("dirs", {})
            agent_dirs_created = []
            agent_dirs_errors  = []
            for key, path_val in dirs_cfg.items():
                if path_val and isinstance(path_val, str):
                    mk = await mkdir_request(agent_id, path_val)
                    if mk and mk.get("ok"):
                        agent_dirs_created.append(f"agent:{path_val}")
                    # Silently skip errors (agent may not support all paths)
            result["agent_created"] = agent_dirs_created

        return result
    except Exception as exc:
        logger.error(f"create-dirs error: {exc}")
        return {"created": [], "errors": [str(exc)]}


@app.post("/api/settings/migrate-state")
async def migrate_state_endpoint(payload: Dict[str, Any]):
    """
    Migrate run-state data between JSON and SQLite backends.
    payload: { "direction": "json_to_sqlite" | "sqlite_to_json" }
    """
    direction = payload.get("direction", "json_to_sqlite")
    settings  = _get_settings()
    state_dir = settings.get("dirs", {}).get("state", ".seqnode_state")
    db_path   = os.path.join(state_dir, "seqnode.db")
    flag_path = os.path.join(state_dir, ".migrated")

    if direction == "json_to_sqlite":
        from core.state_db import StateDB
        from core.state_manager import StateManager

        os.makedirs(state_dir, exist_ok=True)
        db = StateDB(db_path=db_path)
        await db.initialize()

        json_sm  = StateManager(state_dir=state_dir)
        runs     = json_sm.list_runs()
        migrated = 0
        errors   = []

        for run_info in runs:
            run_id = run_info.get("run_id")
            if not run_id:
                continue
            state = json_sm.load_state(run_id)
            if state:
                try:
                    await db.save_run(state)
                    for log in state.logs:
                        await db.append_log(
                            run_id, log.node_id, log.level, log.message, log.source
                        )
                    migrated += 1
                except Exception as exc:
                    errors.append(f"{run_id}: {str(exc)}")

        with open(flag_path, "w") as fh:
            fh.write(f"migrated={migrated}\n")

        logger.info(f"[migrate-state] JSON→SQLite: {migrated}/{len(runs)} runs migrated.")
        return {
            "status":    "ok",
            "direction": direction,
            "migrated":  migrated,
            "total":     len(runs),
            "errors":    errors,
        }

    elif direction == "sqlite_to_json":
        from core.state_db import StateDB
        from core.state_manager import StateManager

        if not os.path.exists(db_path):
            raise HTTPException(
                status_code=404,
                detail=f"SQLite database not found at '{db_path}'. Nothing to migrate.",
            )

        db      = StateDB(db_path=db_path)
        json_sm = StateManager(state_dir=state_dir)

        runs     = await db.list_runs(limit=100_000)
        migrated = 0
        errors   = []

        for run_info in runs:
            run_id = run_info.get("run_id")
            if not run_id:
                continue
            state = await db.load_run(run_id)
            if state:
                try:
                    json_sm.save_state(state)
                    migrated += 1
                except Exception as exc:
                    errors.append(f"{run_id}: {str(exc)}")

        if os.path.exists(flag_path):
            os.remove(flag_path)

        logger.info(f"[migrate-state] SQLite→JSON: {migrated}/{len(runs)} runs migrated.")
        return {
            "status":    "ok",
            "direction": direction,
            "migrated":  migrated,
            "total":     len(runs),
            "errors":    errors,
        }

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown direction '{direction}'. Use 'json_to_sqlite' or 'sqlite_to_json'.",
        )


@app.post("/api/settings/init-sqlite")
async def init_sqlite_endpoint():
    """
    Creates the SQLite database file and initialises its schema.
    Must be called before switching the state backend to 'sqlite'
    or running JSON → SQLite migration.
    """
    settings  = _get_settings()
    state_dir = settings.get("dirs", {}).get("state", ".seqnode_state")
    db_path   = os.path.join(state_dir, "seqnode.db")

    try:
        from core.state_db import StateDB
        db = StateDB(db_path)
        await db.initialize()
        return {
            "status":  "ok",
            "message": f"SQLite database initialised at {db_path}",
            "path":    db_path,
        }
    except Exception as exc:
        logger.error(f"init-sqlite error: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to initialise SQLite: {exc}")


@app.post("/api/fs/mkdir")
def mkdir_single(payload: Dict[str, Any]):
    path = payload.get("path", "")
    if not path:
        raise HTTPException(status_code=400, detail="'path' is required.")
    ok, err = create_directory(path)
    if ok:
        return {"status": "created", "path": path}
    raise HTTPException(status_code=400, detail=err)


@app.post("/api/fs/mkdir-batch")
def mkdir_batch(payload: Dict[str, Any]):
    paths = payload.get("paths", [])
    if not isinstance(paths, list):
        raise HTTPException(status_code=400, detail="'paths' must be a list.")
    return create_directories(paths)


@app.get("/api/fs/browse")
def browse_filesystem(path: str = "/"):
    try:
        return list_directory(path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fs/browse-files")
def browse_filesystem_files(path: str = "/", extensions: Optional[str] = None):
    try:
        ext_list = [e.strip().lower() for e in extensions.split(",")] if extensions else []
        return list_directory_with_files(path, ext_list or None)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fs/exists")
def check_path_exists(path: str):
    try:
        return path_exists(path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fs/stat")
def get_path_stat(path: str):
    try:
        return path_stat(path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class BuildCommandPayload(BaseModel):
    tool_id: str
    params: Dict[str, Any] = {}
    inputs_map: Dict[str, str] = {}
    outputs_map: Dict[str, str] = {}
    custom_command: Optional[str] = None


@app.get("/api/fs/list-dir")
def list_dir_files(path: str, extensions: str = ""):
    """
    List files in a directory, filtered by extensions (comma-separated).
    Used by the frontend to preview batch-mode (directory input).
    Returns sorted list of {name, path, size_bytes}.
    """
    if not path:
        raise HTTPException(status_code=400, detail="'path' query parameter is required.")
    clean = path.rstrip("/\\")
    if not os.path.isdir(clean):
        raise HTTPException(status_code=404, detail=f"Directory not found: {path}")

    ext_list = []
    if extensions:
        for e in extensions.split(","):
            e = e.strip().lower().lstrip(".")
            if e:
                ext_list.append(e)

    files = []
    seen: set = set()
    try:
        for fname in sorted(os.listdir(clean)):
            fpath = os.path.join(clean, fname)
            if not os.path.isfile(fpath):
                continue
            abs_path = os.path.abspath(fpath)
            if abs_path in seen:
                continue
            seen.add(abs_path)
            if ext_list:
                fname_lower = fname.lower()
                matched = any(
                    fname_lower.endswith("." + e) or fname_lower.endswith(e)
                    for e in ext_list
                )
                if not matched:
                    continue
            try:
                size = os.path.getsize(fpath)
            except OSError:
                size = 0
            files.append({"name": fname, "path": abs_path, "size_bytes": size})
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    return {"directory": clean, "files": files, "count": len(files)}


@app.post("/api/workflow/execute")
async def execute_workflow_with_settings(request: Request, payload: Dict[str, Any]):
    """Extended execute endpoint that forwards settings to the engine"""
    from core.models import WorkflowDefinition
    workflow_dict = payload.get("workflow", payload)
    settings_dict = payload.get("settings", {})
    resume_from   = payload.get("resume_from")
    try:
        wf = WorkflowDefinition(**workflow_dict)

        # Route to user-specific agent
        user_id_hdr = request.headers.get("X-Seqnode-User-Id", "")
        agent_id = None
        if user_id_hdr:
            try:
                agent_id = get_agent_by_user(int(user_id_hdr))
            except (ValueError, TypeError):
                pass
        if not agent_id:
            connected = list_agents()
            if connected:
                agent_id = connected[0]["agent_id"]

        if agent_id:
            engine.set_runner(RunnerAgent(agent_id, engine))
            logger.info(f"Execution routed to agent {agent_id}")
        else:
            engine.set_runner(LocalRunner())

        # Inject user plugins
        _user_manifests = get_user_plugins(agent_id) if agent_id else {}
        _original_tools = dict(pm.tools)
        if _user_manifests:
            pm.tools = {**_original_tools, **_user_manifests}

        try:
            state = await engine.execute_workflow(wf, resume_from=resume_from, settings=settings_dict)
        finally:
            engine.set_runner(LocalRunner())
            pm.tools = _original_tools

        return {
            "run_id": state.run_id,
            "status": state.status,
            "node_statuses": {k: v.value for k, v in state.node_statuses.items()},
        }
    except Exception as e:
        engine.set_runner(LocalRunner())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/build-command")
def build_command_preview(payload: BuildCommandPayload):
    if payload.custom_command and payload.custom_command.strip():
        return {"command": payload.custom_command.strip(), "source": "custom"}
    plugin = pm.get_tool(payload.tool_id)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{payload.tool_id}' not found.")
    try:
        # _coerce_params preserva bool/int/float — necessário para Jinja2 correctos
        coerced_params = engine._coerce_params(payload.params, plugin)
        cmd = engine.executor.build_command(
            plugin=plugin,
            params=coerced_params,
            inputs_map=payload.inputs_map,
            outputs_map=payload.outputs_map,
        )
        return {"command": cmd, "source": "auto"}
    except Exception as e:
        return {"command": "", "source": "error", "error": str(e)}


class PluginVerifyPayload(BaseModel):
    plugin_id: Optional[str] = None
    path: Optional[str] = None


@app.post("/api/settings/plugins/verify")
async def verify_plugin_installation(request: Request, payload: PluginVerifyPayload):
    settings = _get_settings()
    plugin_paths = settings.get("plugin_paths", {})

    # ── Try agent-side verification first ──────────────────────────────────────
    user_id_hdr = request.headers.get("X-Seqnode-User-Id", "")
    agent_id = None
    if user_id_hdr:
        try:
            agent_id = get_agent_by_user(int(user_id_hdr))
        except (ValueError, TypeError):
            pass
    if not agent_id:
        connected = list_agents()
        if connected:
            agent_id = connected[0]["agent_id"]

    if agent_id:
        from core.agent_manager import depcheck_request as agent_depcheck
        if payload.plugin_id:
            tool_ids = [payload.plugin_id]
        else:
            tool_ids = [p.id for p in pm.list_tools()]

        # Build user_paths from saved plugin_paths settings
        user_paths = {tid: plugin_paths.get(tid, {}) for tid in tool_ids}
        agent_result = await agent_depcheck(agent_id, tool_ids, user_paths, timeout=60.0)
        if agent_result:
            # Convert agent depcheck_result format to settings/verify format
            results = {}
            for tid, r in agent_result.get("results", {}).items():
                results[tid] = {
                    "binary":       r.get("binary", tid),
                    "binary_found": r.get("binary_found", False),
                    "binary_path":  r.get("binary_path", ""),
                    "version":      r.get("version", ""),
                    "refs_ok":      True,
                    "status":       r.get("status", "missing"),
                    "via_agent":    True,
                }
            return results
    # ── Fallback: VPS-side verification ────────────────────────────────────────

    results = {}
    if payload.plugin_id:
        tools_to_check = [pm.get_tool(payload.plugin_id)] if pm.get_tool(payload.plugin_id) else []
    else:
        tools_to_check = pm.list_tools()

    for plugin in tools_to_check:
        if not plugin:
            continue
        result = verify_plugin_with_install_cfg(plugin, plugin_paths=plugin_paths)
        results[plugin.id] = {
            "binary":       result["binary"],
            "binary_found": result["installed"],
            "binary_path":  result["binary_path"],
            "version":      result["version"],
            "refs_ok":      result["refs_ok"],
            "status":       result["job_status"],
            "via_agent":    False,
        }

    return results


@app.get("/api/conda/envs")
def list_conda_envs():
    """Lista os ambientes conda disponíveis no sistema."""
    import subprocess as _sp
    import shutil as _sh
    conda_bin = "mamba" if _sh.which("mamba") else "conda" if _sh.which("conda") else None
    if not conda_bin:
        return {"envs": [], "error": "conda/mamba not found in PATH"}
    try:
        result = _sp.run(
            [conda_bin, "env", "list", "--json"],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            import json as _json
            data = _json.loads(result.stdout)
            envs = []
            for env_path in data.get("envs", []):
                name = os.path.basename(env_path)
                if not name or env_path.endswith("miniforge3") or env_path.endswith("miniconda3") or env_path.endswith("anaconda3"):
                    name = "base"
                envs.append({"name": name, "path": env_path})
            return {"envs": envs, "conda_bin": conda_bin}
        return {"envs": [], "error": result.stderr[:200]}
    except Exception as e:
        return {"envs": [], "error": str(e)}


@app.get("/api/references/catalog")
def get_references_catalog():
    settings  = _get_settings()
    refs_base = settings.get("dirs", {}).get("references", "/data/references")
    return get_merged_catalog(CUSTOM_REFS_FILE, refs_base)


class CustomRefPayload(BaseModel):
    ref_id:      str
    label:       str
    category:    str = "custom"
    url:         str
    filename:    str
    subdir:      str = ""
    build:       str = "unknown"
    index_files: List[str] = []


@app.post("/api/references/custom")
def add_custom_reference_endpoint(payload: CustomRefPayload):
    result = add_custom_reference(
        custom_refs_file=CUSTOM_REFS_FILE,
        ref_id=payload.ref_id,
        label=payload.label,
        category=payload.category,
        url=payload.url,
        filename=payload.filename,
        subdir=payload.subdir,
        build=payload.build,
        index_files=payload.index_files,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.delete("/api/references/custom/{ref_id}")
def remove_custom_reference_endpoint(ref_id: str):
    result = remove_custom_reference(CUSTOM_REFS_FILE, ref_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


class ConfigureRefPayload(BaseModel):
    ref_id:      str
    category:    str
    label:       Optional[str] = None
    url:         Optional[str] = None
    filename:    Optional[str] = None
    subdir:      Optional[str] = None
    build:       Optional[str] = None
    index_files: Optional[List[str]] = None


@app.post("/api/references/configure")
def configure_reference_endpoint(payload: ConfigureRefPayload):
    result = configure_reference(
        custom_refs_file=CUSTOM_REFS_FILE,
        ref_id=payload.ref_id,
        category=payload.category,
        label=payload.label,
        url=payload.url,
        filename=payload.filename,
        subdir=payload.subdir,
        build=payload.build,
        index_files=payload.index_files,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


class RefDownloadPayload(BaseModel):
    ref_id:      str
    target_base: Optional[str] = None


@app.post("/api/references/download")
def start_reference_download(payload: RefDownloadPayload):
    settings  = _get_settings()
    refs_base = payload.target_base or settings.get("dirs", {}).get("references", "/data/references")
    result = start_download(
        ref_id=payload.ref_id,
        custom_refs_file=CUSTOM_REFS_FILE,
        refs_base=refs_base,
        broadcast_fn=broadcast_event,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.delete("/api/references/download/{ref_id}")
def cancel_reference_download(ref_id: str):
    return cancel_download(ref_id)


@app.get("/api/references/download/progress")
def get_reference_download_progress():
    return get_all_download_progress()


@app.get("/api/references/download/progress/{ref_id}")
def get_single_download_progress(ref_id: str):
    return get_download_progress(ref_id)



@app.websocket("/ws/agent")
async def websocket_agent(websocket: WebSocket):
    """Reverse WebSocket endpoint — SeqNode Agents connect here."""
    await handle_agent_ws(
        websocket,
        on_log_fn    = broadcast_log,           # Usa a função nativa do server.py
        on_status_fn = broadcast_status_change, # Usa a função nativa do server.py
    )

@app.get("/api/agent/status")
def get_agent_status():
    """Return list of currently connected SeqNode Agents."""
    return {"agents": list_agents()}

@app.get("/api/agent/browse")
async def agent_browse_dir(path: str = Query("")):
    """Browse a directory via the connected agent, or fall back to VPS filesystem."""
    agents = list_agents()
    if agents:
        result = await agent_browse_request(agents[0]["agent_id"], path, include_files=False)
        if result and not result.get("error"):
            return result
    return list_directory(path or "/")


@app.get("/api/agent/browse-files")
async def agent_browse_dir_files(path: str = Query(""), extensions: str = Query("")):
    """Browse a directory with files via the connected agent, or fall back to VPS filesystem."""
    agents = list_agents()
    if agents:
        result = await agent_browse_request(
            agents[0]["agent_id"], path, include_files=True, extensions=extensions
        )
        if result and not result.get("error"):
            return result
    return list_directory_with_files(path or "/", extensions)


@app.post("/api/agent/mkdir")
async def agent_mkdir(request: Request):
    """Create a directory on the connected agent's local filesystem."""
    body = await request.json()
    path = (body or {}).get("path", "").strip()
    if not path:
        raise HTTPException(status_code=400, detail="path is required")
    agent_id = _get_agent_for_request(request)
    if not agent_id:
        # No agent — try VPS-side mkdir as fallback
        try:
            create_directory(path)
            return {"success": True}
        except Exception as e:
            raise HTTPException(status_code=422, detail=str(e))
    result = await agent_mkdir_request(agent_id, path)
    if result is None:
        raise HTTPException(status_code=504, detail="Agent timed out or disconnected")
    if not result.get("success"):
        raise HTTPException(status_code=422, detail=result.get("error", "mkdir failed"))
    return {"success": True}


@app.get("/api/agent/read-file")
async def agent_read_file(request: Request, path: str = Query(...)):
    """Read a single file from the connected agent's local filesystem."""
    agent_id = _get_agent_for_request(request)
    if not agent_id:
        raise HTTPException(status_code=503, detail="No agent connected for this user")
    result = await read_file_request(agent_id, path)
    if result is None:
        raise HTTPException(status_code=504, detail="Agent timed out or disconnected")
    if result.get("error"):
        raise HTTPException(status_code=422, detail=result["error"])
    return {"content": result["content"]}


@app.post("/api/agent/rename-file")
async def agent_rename_file(request: Request):
    """Rename or move a file/directory on the connected agent's local filesystem."""
    body     = await request.json()
    old_path = (body or {}).get("old_path", "").strip()
    new_path = (body or {}).get("new_path", "").strip()
    if not old_path or not new_path:
        raise HTTPException(status_code=400, detail="old_path and new_path required")
    agent_id = _get_agent_for_request(request)
    if not agent_id:
        raise HTTPException(status_code=503, detail="No agent connected for this user")
    result = await agent_rename_file_request(agent_id, old_path, new_path)
    if result is None:
        raise HTTPException(status_code=504, detail="Agent timed out or disconnected")
    if result.get("error"):
        raise HTTPException(status_code=422, detail=result["error"])
    return {"success": True}


@app.post("/api/agent/delete-file")
async def agent_delete_file(request: Request):
    """Delete a file or directory on the connected agent's local filesystem."""
    body      = await request.json()
    path      = (body or {}).get("path", "").strip()
    recursive = bool((body or {}).get("recursive", False))
    if not path:
        raise HTTPException(status_code=400, detail="path required")
    agent_id = _get_agent_for_request(request)
    if not agent_id:
        raise HTTPException(status_code=503, detail="No agent connected for this user")
    result = await agent_delete_file_request(agent_id, path, recursive=recursive)
    if result is None:
        raise HTTPException(status_code=504, detail="Agent timed out or disconnected")
    if result.get("error"):
        raise HTTPException(status_code=422, detail=result["error"])
    return {"success": True}


@app.get("/api/agent/user/{user_id}")
def get_agent_for_user(user_id: int):
    """Return agent info for a specific user, or null if not connected."""
    agent_id = get_agent_by_user(user_id)
    if not agent_id:
        return {"agent": None}
    info = get_agent_info(agent_id)
    if not info:
        return {"agent": None}
    import time as _time
    return {"agent": {
        "agent_id":       info["agent_id"],
        "label":          info["label"],
        "last_seen_secs": int(_time.time() - info["last_seen"]),
        "info":           info["info"],
    }}


@app.post("/api/agent/dispatch/{agent_id}")
async def post_agent_dispatch(agent_id: str, payload: dict):
    ok = await agent_dispatch(agent_id, payload)
    if not ok:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not connected.")
    return {"dispatched": True}

@app.get("/api/references/verify/{ref_id}")
def verify_reference_index_files(ref_id: str):
    settings  = _get_settings()
    refs_base = settings.get("dirs", {}).get("references", "/data/references")
    return verify_index_files(ref_id, refs_base, CUSTOM_REFS_FILE)


@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)