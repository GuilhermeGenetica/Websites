"""
core/agent_manager.py — SeqNode Agent Registry & Dispatch

Manages connected SeqNode Agent WebSocket connections.
Agents authenticate via token → PHP/MySQL → HMAC session secret.

Public API used by runner_agent.py:
  get_agent_by_user(user_id)                  → agent_id or None
  dispatch(agent_id, payload)                 → bool
  subscribe(agent_id, run_id, node_id)        → (asyncio.Queue, asyncio.Future)
  unsubscribe(agent_id, run_id, node_id)      → None
  list_agents()                               → list[dict]

Public API used by server.py WebSocket handler:
  handle_agent_ws(websocket, on_log_fn, on_status_fn)

Public API for user plugins (used by server.py):
  scan_plugins_request(agent_id, plugins_dir)  → dict | None
  write_plugin_request(agent_id, plugins_dir, filename, content) → dict | None
  get_user_plugins(agent_id)                  → dict[str, Any]
  set_user_plugins(agent_id, plugins_dict)    → None
  read_file_request(agent_id, path)           → dict | None
  get_agent_info(agent_id)                    → dict | None
"""

import asyncio
import hashlib
import hmac as _hmac_mod
import json
import logging
import os
import secrets
import time
import uuid
from dataclasses import dataclass, field
from typing import Callable

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("seqnode.agent_manager")

PHP_API_URL = os.environ.get("PHP_API_URL", "https://seqnode.onnetweb.com/api").rstrip("/")


# ── Agent session ─────────────────────────────────────────────────────────────

@dataclass
class AgentSession:
    agent_id:     str
    ws:           WebSocket
    token:        str
    hmac_secret:  str
    user_id:      int   = 0
    label:        str   = ""
    info:         dict  = field(default_factory=dict)
    last_seen:    float = field(default_factory=time.time)
    run_id:       str   = ""
    # User plugins loaded from local machine (in-memory only, never written to VPS disk)
    # Keyed by plugin id → raw plugin dict (caller parses into PluginManifest)
    user_plugins: dict  = field(default_factory=dict)


# ── Registry ──────────────────────────────────────────────────────────────────

_agents:      dict[str, AgentSession]           = {}   # agent_id → AgentSession
_user_agents: dict[int, str]                    = {}   # user_id  → agent_id  (latest)

# Per-execution log queues and completion futures
# Key:  "{agent_id}:{run_id}:{node_id}"
_log_queues:    dict[str, asyncio.Queue]  = {}
_completions:   dict[str, asyncio.Future] = {}

# Browse request futures: request_id → Future[dict]
_browse_futures: dict[str, asyncio.Future] = {}

# Depcheck request futures: request_id → Future[dict]
_depcheck_futures: dict[str, asyncio.Future] = {}

# User plugin scan futures: request_id → Future[dict]
_scan_plugins_futures: dict[str, asyncio.Future] = {}

# User plugin write futures: request_id → Future[dict]
_write_plugin_futures: dict[str, asyncio.Future] = {}

# Read-file futures: request_id → Future[dict]
_read_file_futures: dict[str, asyncio.Future] = {}

# Mkdir futures: request_id → Future[dict]
_mkdir_futures: dict[str, asyncio.Future] = {}

# Rename-file futures: request_id → Future[dict]
_rename_file_futures: dict[str, asyncio.Future] = {}

# Delete-file futures: request_id → Future[dict]
_delete_file_futures: dict[str, asyncio.Future] = {}


def get_agent_by_user(user_id: int) -> str | None:
    """Return the agent_id for the given user, or None if not connected."""
    agent_id = _user_agents.get(user_id)
    if agent_id and agent_id in _agents:
        return agent_id
    _user_agents.pop(user_id, None)
    return None


def list_agents() -> list[dict]:
    now = time.time()
    return [
        {
            "agent_id":       s.agent_id,
            "user_id":        s.user_id,
            "label":          s.label,
            "last_seen_secs": int(now - s.last_seen),
            "info":           s.info,
            "run_id":         s.run_id,
        }
        for s in _agents.values()
    ]


# ── Dispatch ──────────────────────────────────────────────────────────────────

async def dispatch(agent_id: str, payload: dict) -> bool:
    session = _agents.get(agent_id)
    if not session:
        return False
    try:
        await session.ws.send_text(json.dumps(payload))
        return True
    except Exception as e:
        logger.warning(f"dispatch to {agent_id} failed: {e}")
        _cleanup_agent(agent_id)
        return False


async def broadcast_agents(payload: dict) -> None:
    for agent_id in list(_agents.keys()):
        await dispatch(agent_id, payload)


# ── HMAC signing (used by runner_agent.py) ────────────────────────────────────

def sign_payload(agent_id: str, payload: dict) -> str:
    """Sign a payload dict with the session HMAC secret. Returns hex digest."""
    session = _agents.get(agent_id)
    if not session or not session.hmac_secret:
        return ""
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return _hmac_mod.new(
        bytes.fromhex(session.hmac_secret), canonical.encode(), hashlib.sha256
    ).hexdigest()


# ── Log subscription (used by runner_agent.py) ───────────────────────────────

def subscribe(agent_id: str, run_id: str, node_id: str) -> tuple[asyncio.Queue, "asyncio.Future[dict]"]:
    """
    Register interest in log/status messages for a specific run+node.
    Returns (log_queue, completion_future).
    completion_future resolves to {"status": "...", "exit_code": N} when done.
    """
    key = f"{agent_id}:{run_id}:{node_id}"
    q   = asyncio.Queue()
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _log_queues[key]  = q
    _completions[key] = fut
    return q, fut


def unsubscribe(agent_id: str, run_id: str, node_id: str) -> None:
    key = f"{agent_id}:{run_id}:{node_id}"
    _log_queues.pop(key, None)
    fut = _completions.pop(key, None)
    if fut and not fut.done():
        fut.cancel()


# ── Token verification via PHP API ────────────────────────────────────────────

async def _verify_token_http(token: str, agent_info: dict) -> dict | None:
    try:
        import httpx
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                f"{PHP_API_URL}/user/agent-token/verify",
                json={"token": token, "agent_info": agent_info},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("valid"):
                    return data
    except Exception as e:
        logger.warning(f"Token verification HTTP error: {e}")
    return None


# ── Cleanup ───────────────────────────────────────────────────────────────────

def _cleanup_agent(agent_id: str) -> None:
    session = _agents.pop(agent_id, None)
    if session:
        _user_agents.pop(session.user_id, None)
    # Cancel any pending futures for this agent
    for key in [k for k in _completions if k.startswith(agent_id + ":")]:
        fut = _completions.pop(key, None)
        if fut and not fut.done():
            fut.set_result({"status": "failed", "exit_code": -1})
        _log_queues.pop(key, None)


# ── Remote browse (used by server.py /api/agent/browse) ──────────────────────

async def browse_request(
    agent_id:      str,
    path:          str,
    include_files: bool = False,
    extensions:    str  = "",
    timeout:       float = 10.0,
) -> dict | None:
    """
    Ask the connected agent to list a directory on the user's local machine.
    Returns {path, parent, entries, files} or None on timeout/error.
    """
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _browse_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":          "browse",
        "request_id":    request_id,
        "path":          path,
        "include_files": include_files,
        "extensions":    extensions,
    })
    if not ok:
        _browse_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _browse_futures.pop(request_id, None)
        logger.warning(f"browse_request timed out for agent={agent_id} path={path!r}")
        return None


# ── Remote depcheck (used by dep_analyzer.py) ────────────────────────────────

async def depcheck_request(
    agent_id:   str,
    tool_ids:   list[str],
    user_paths: dict = None,
    timeout:    float = 30.0,
) -> dict | None:
    """
    Ask the connected agent to verify tool installations on the user's machine.
    Returns depcheck_result payload or None on timeout/error.
    """
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _depcheck_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":       "depcheck",
        "request_id": request_id,
        "tool_ids":   tool_ids,
        "user_paths": user_paths or {},
    })
    if not ok:
        _depcheck_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _depcheck_futures.pop(request_id, None)
        logger.warning(f"depcheck_request timed out for agent={agent_id}")
        return None


# ── User plugin management (used by server.py) ───────────────────────────────

async def scan_plugins_request(
    agent_id:    str,
    plugins_dir: str,
    timeout:     float = 20.0,
) -> dict | None:
    """
    Ask the connected agent to list and return all YAML plugin files from plugins_dir.
    Returns {plugins: [{filename, content}], error} or None on timeout/error.
    """
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _scan_plugins_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":        "scan_plugins",
        "request_id":  request_id,
        "plugins_dir": plugins_dir,
    })
    if not ok:
        _scan_plugins_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _scan_plugins_futures.pop(request_id, None)
        logger.warning(f"scan_plugins_request timed out for agent={agent_id}")
        return None


async def write_plugin_request(
    agent_id:    str,
    plugins_dir: str,
    filename:    str,
    content:     str,
    timeout:     float = 15.0,
) -> dict | None:
    """
    Ask the connected agent to write a plugin YAML file to plugins_dir.
    Returns {success, error} or None on timeout/error.
    """
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _write_plugin_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":        "write_plugin",
        "request_id":  request_id,
        "plugins_dir": plugins_dir,
        "filename":    filename,
        "content":     content,
    })
    if not ok:
        _write_plugin_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _write_plugin_futures.pop(request_id, None)
        logger.warning(f"write_plugin_request timed out for agent={agent_id}")
        return None


def get_user_plugins(agent_id: str) -> dict:
    """Return the stored user plugins dict for an agent session (plugin_id → raw dict)."""
    session = _agents.get(agent_id)
    return dict(session.user_plugins) if session else {}


def set_user_plugins(agent_id: str, plugins_dict: dict) -> None:
    """Store parsed user plugins on the agent session."""
    session = _agents.get(agent_id)
    if session:
        session.user_plugins = plugins_dict


def get_agent_info(agent_id: str) -> dict | None:
    """Return basic info for an agent session, or None if not connected."""
    session = _agents.get(agent_id)
    if not session:
        return None
    return {
        "agent_id":  session.agent_id,
        "label":     session.label,
        "last_seen": session.last_seen,
        "info":      session.info,
    }


async def mkdir_request(
    agent_id: str,
    path:     str,
    timeout:  float = 10.0,
) -> dict | None:
    """Ask the connected agent to create a directory. Returns {success, error} or None."""
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _mkdir_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":       "mkdir",
        "request_id": request_id,
        "path":       path,
    })
    if not ok:
        _mkdir_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _mkdir_futures.pop(request_id, None)
        logger.warning(f"mkdir_request timed out for agent={agent_id} path={path!r}")
        return None


async def read_file_request(
    agent_id: str,
    path:     str,
    timeout:  float = 10.0,
) -> dict | None:
    """
    Ask the connected agent to read a single file and return its content.
    Returns {content, error} or None on timeout/error.
    """
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _read_file_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":       "read_file",
        "request_id": request_id,
        "path":       path,
    })
    if not ok:
        _read_file_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _read_file_futures.pop(request_id, None)
        logger.warning(f"read_file_request timed out for agent={agent_id} path={path!r}")
        return None


async def rename_file_request(
    agent_id: str,
    old_path: str,
    new_path: str,
    timeout:  float = 10.0,
) -> dict | None:
    """Ask the connected agent to rename/move a file or directory."""
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _rename_file_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":       "rename_file",
        "request_id": request_id,
        "old_path":   old_path,
        "new_path":   new_path,
    })
    if not ok:
        _rename_file_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _rename_file_futures.pop(request_id, None)
        logger.warning(f"rename_file_request timed out for agent={agent_id}")
        return None


async def delete_file_request(
    agent_id:  str,
    path:      str,
    recursive: bool = False,
    timeout:   float = 15.0,
) -> dict | None:
    """Ask the connected agent to delete a file or directory."""
    request_id = str(uuid.uuid4())
    loop = asyncio.get_event_loop()
    fut  = loop.create_future()
    _delete_file_futures[request_id] = fut

    ok = await dispatch(agent_id, {
        "type":       "delete_file",
        "request_id": request_id,
        "path":       path,
        "recursive":  recursive,
    })
    if not ok:
        _delete_file_futures.pop(request_id, None)
        return None

    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        _delete_file_futures.pop(request_id, None)
        logger.warning(f"delete_file_request timed out for agent={agent_id}")
        return None


# ── WebSocket handler ─────────────────────────────────────────────────────────

async def handle_agent_ws(
    websocket:    WebSocket,
    on_log_fn:    Callable | None = None,
    on_status_fn: Callable | None = None,
):
    await websocket.accept()
    agent_id = ""

    try:
        # ── Step 1: Receive hello ──
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=15)
        pkt = json.loads(raw)

        if pkt.get("type") != "hello":
            await websocket.send_text(json.dumps({"type": "auth_err", "reason": "Expected hello"}))
            return

        token      = pkt.get("token", "").strip()
        agent_info = pkt.get("info",  {})

        if not token:
            await websocket.send_text(json.dumps({"type": "auth_err", "reason": "Token required"}))
            return

        # ── Step 2: Verify with PHP/MySQL ──
        user_info = await _verify_token_http(token, agent_info)
        if not user_info:
            await websocket.send_text(json.dumps({"type": "auth_err", "reason": "Invalid or revoked token"}))
            logger.warning(f"Agent auth failed for token {token[:12]}…")
            return

        # ── Step 3: Register session + issue HMAC secret ──
        agent_id    = str(uuid.uuid4())
        hmac_secret = secrets.token_hex(32)
        user_id     = int(user_info.get("user_id", 0))

        session = AgentSession(
            agent_id    = agent_id,
            ws          = websocket,
            token       = token,
            hmac_secret = hmac_secret,
            user_id     = user_id,
            label       = user_info.get("label", ""),
            info        = agent_info,
        )
        _agents[agent_id]      = session
        _user_agents[user_id]  = agent_id          # latest agent for this user

        await websocket.send_text(json.dumps({
            "type":        "auth_ok",
            "agent_id":    agent_id,
            "hmac_secret": hmac_secret,
        }))

        logger.info(
            f"Agent connected: {agent_id} "
            f"user={user_id} label={session.label!r} "
            f"host={agent_info.get('hostname', '?')}"
        )

        # ── Step 4: Message loop ──
        while True:
            raw = await websocket.receive_text()
            pkt = json.loads(raw)
            t   = pkt.get("type")

            session.last_seen = time.time()

            if t == "log":
                run_id  = pkt.get("run_id",  "")
                node_id = pkt.get("node_id", "")
                level   = pkt.get("level",   "info")
                message = pkt.get("message", "")

                # Forward to runner_agent subscriptions
                key = f"{agent_id}:{run_id}:{node_id}"
                q   = _log_queues.get(key)
                if q:
                    await q.put({"type": "log", "level": level, "message": message})

                # Broadcast to frontend WebSocket
                if on_log_fn:
                    await on_log_fn(node_id, level.upper(), f"[agent] {message}")

            elif t == "status":
                run_id    = pkt.get("run_id",    "")
                node_id   = pkt.get("node_id",   "")
                status    = pkt.get("status",    "")
                exit_code = pkt.get("exit_code", 0)
                session.run_id = run_id if status == "running" else ""

                # Resolve completion future
                key = f"{agent_id}:{run_id}:{node_id}"
                fut = _completions.get(key)
                if fut and not fut.done() and status in ("completed", "failed", "cancelled"):
                    fut.set_result({"status": status, "exit_code": exit_code})

                if on_status_fn and run_id:
                    await on_status_fn(status, run_id)

            elif t == "resource":
                session.info.update({k: v for k, v in pkt.items() if k != "type"})

            elif t == "pong":
                pass

            elif t == "browse_result":
                request_id = pkt.get("request_id", "")
                fut = _browse_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            elif t == "depcheck_result":
                request_id = pkt.get("request_id", "")
                fut = _depcheck_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            elif t == "scan_plugins_result":
                request_id = pkt.get("request_id", "")
                fut = _scan_plugins_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            elif t == "write_plugin_result":
                request_id = pkt.get("request_id", "")
                fut = _write_plugin_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            elif t == "read_file_result":
                request_id = pkt.get("request_id", "")
                fut = _read_file_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            elif t == "mkdir_result":
                request_id = pkt.get("request_id", "")
                fut = _mkdir_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            elif t == "rename_file_result":
                request_id = pkt.get("request_id", "")
                fut = _rename_file_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            elif t == "delete_file_result":
                request_id = pkt.get("request_id", "")
                fut = _delete_file_futures.pop(request_id, None)
                if fut and not fut.done():
                    fut.set_result(pkt)

            else:
                logger.debug(f"Unknown agent packet: {t!r}")

    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    except Exception as e:
        logger.error(f"Agent WS error ({agent_id or 'unauthenticated'}): {e}")
    finally:
        if agent_id:
            _cleanup_agent(agent_id)
            logger.info(f"Agent disconnected: {agent_id}")
