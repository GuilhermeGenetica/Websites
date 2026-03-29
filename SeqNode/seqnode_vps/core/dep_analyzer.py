"""
dep_analyzer.py — SeqNode-OS Dependency Analyzer
AI-driven dependency analysis, verification and installation for workflow plugins.

This module is fully self-contained. It exposes:
  - POST /api/depcheck/analyze       — scan workflow nodes → identify dependencies
  - POST /api/depcheck/install        — install one dependency (AI-guided)
  - GET  /api/depcheck/install-logs/{job_id}  — stream install logs
  - DELETE /api/depcheck/install/{job_id}     — cancel install
  - POST /api/depcheck/set-path       — user manually sets binary/lib/conda path
  - POST /api/depcheck/recheck        — re-verify one dep after manual path set

Integration in main.py (two lines):
    from dep_analyzer import register_depcheck_routes
    register_depcheck_routes(app, pm, _get_settings, _save_settings)
"""

from __future__ import annotations

import os
import re
import json
import shutil
import asyncio
import logging
import subprocess
import threading
import textwrap
import uuid
import time
from typing import Any, Dict, List, Optional, Callable

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger("seqnode.depcheck")

# ─────────────────────────────────────────────────────────────────────────────
# In-memory store for active install jobs
# ─────────────────────────────────────────────────────────────────────────────
_depcheck_jobs: Dict[str, Dict[str, Any]] = {}

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _which(name: str, extra_paths: List[str] = None) -> Optional[str]:
    """Find binary on PATH or in extra_paths."""
    found = shutil.which(name)
    if found:
        return found
    for p in (extra_paths or []):
        candidate = os.path.join(os.path.expanduser(p), name)
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return None


def _run_version_cmd(cmd: str, timeout: int = 10) -> Optional[str]:
    """Run a shell command and return stdout+stderr truncated."""
    try:
        out = subprocess.check_output(
            cmd, shell=True, text=True, stderr=subprocess.STDOUT,
            timeout=timeout, executable="/bin/bash"
        ).strip()
        return (out[:300] if out else "installed") or "installed"
    except subprocess.TimeoutExpired:
        return "timeout"
    except Exception:
        return None


def _detect_conda_or_mamba() -> Optional[str]:
    """Return 'mamba', 'conda', or None."""
    for mgr in ("mamba", "conda"):
        if shutil.which(mgr):
            return mgr
    return None


def _conda_envs() -> List[str]:
    """List conda environments."""
    mgr = _detect_conda_or_mamba() or "conda"
    try:
        out = subprocess.check_output(
            f"{mgr} env list --json", shell=True, text=True,
            stderr=subprocess.DEVNULL, timeout=15, executable="/bin/bash"
        )
        data = json.loads(out)
        return [os.path.basename(e) for e in data.get("envs", [])]
    except Exception:
        return []


def _conda_env_path(env_name: str) -> Optional[str]:
    """Return the full path to a conda environment."""
    mgr = _detect_conda_or_mamba() or "conda"
    try:
        out = subprocess.check_output(
            f"{mgr} env list --json", shell=True, text=True,
            stderr=subprocess.DEVNULL, timeout=15, executable="/bin/bash"
        )
        data = json.loads(out)
        for ep in data.get("envs", []):
            if os.path.basename(ep) == env_name or ep == env_name:
                return ep
        return None
    except Exception:
        return None


def _r_package_check(pkg: str, r_binary: str = "Rscript") -> bool:
    """Check if an R package is installed."""
    r_binary = r_binary or "Rscript"
    script = f"suppressWarnings(if (!requireNamespace('{pkg}', quietly=TRUE)) quit(status=1))"
    try:
        ret = subprocess.call(
            [r_binary, "-e", script],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20
        )
        return ret == 0
    except Exception:
        return False


def _python_module_check(module: str, python_bin: str = "python3") -> bool:
    """Check if a Python module/package is importable."""
    python_bin = python_bin or "python3"
    try:
        ret = subprocess.call(
            [python_bin, "-c", f"import {module}"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15
        )
        return ret == 0
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Plugin dependency extraction from YAML manifest
# ─────────────────────────────────────────────────────────────────────────────

def _extract_deps_from_plugin(plugin_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract all dependency information from a PluginManifest dict.
    Returns a structured dict describing what needs to be checked.
    """
    install_cfg = plugin_data.get("install") or {}
    runtime_cfg = plugin_data.get("runtime") or {}

    binary       = install_cfg.get("binary", "")
    method       = install_cfg.get("method", "conda")
    conda_env    = install_cfg.get("conda_env", "") or runtime_cfg.get("conda_env", "")
    conda_pkg    = install_cfg.get("conda_package", "")
    pip_pkg      = install_cfg.get("pip_package", "")
    version_cmd  = install_cfg.get("version_check", "")
    channels     = install_cfg.get("conda_channels", ["bioconda", "conda-forge", "defaults"])
    default_paths = install_cfg.get("default_paths", {})
    notes        = install_cfg.get("notes", "")

    r_packages    = _infer_r_packages(plugin_data)
    py_modules    = _infer_py_modules(plugin_data)
    sub_binaries  = _infer_sub_binaries(plugin_data)

    return {
        "plugin_id":     plugin_data.get("id", ""),
        "plugin_name":   plugin_data.get("name", ""),
        "binary":        binary,
        "method":        method,
        "conda_env":     conda_env,
        "conda_package": conda_pkg,
        "pip_package":   pip_pkg,
        "version_cmd":   version_cmd,
        "channels":      channels,
        "default_paths": default_paths,
        "notes":         notes,
        "r_packages":    r_packages,
        "py_modules":    py_modules,
        "sub_binaries":  sub_binaries,
    }


def _infer_r_packages(plugin_data: Dict[str, Any]) -> List[str]:
    """Infer required R packages from YAML tags, notes, command, version_check."""
    known_r_pkgs = {
        "ExomeDepth": "ExomeDepth",
        "exomedepth": "ExomeDepth",
        "DNAcopy": "DNAcopy",
        "GenomicRanges": "GenomicRanges",
        "Rsamtools": "Rsamtools",
        "IRanges": "IRanges",
        "BiocGenerics": "BiocGenerics",
        "DESeq2": "DESeq2",
        "edgeR": "edgeR",
        "limma": "limma",
        "VariantAnnotation": "VariantAnnotation",
        "BSgenome": "BSgenome",
        "TxDb": "TxDb.Hsapiens.UCSC.hg38.knownGene",
    }
    found = set()
    searchable = json.dumps(plugin_data).lower()
    for key, pkg in known_r_pkgs.items():
        if key.lower() in searchable:
            found.add(pkg)

    notes = (plugin_data.get("install") or {}).get("notes", "") or ""
    matches = re.findall(r"R\s+packages?[:\s]+([A-Za-z0-9,\s\(\)>=.]+)", notes, re.IGNORECASE)
    for m in matches:
        for pkg in re.split(r"[,\s]+", m):
            pkg = pkg.strip("()")
            if pkg and len(pkg) > 2:
                found.add(pkg)

    tags = plugin_data.get("tags") or []
    if "r" in [t.lower() for t in tags]:
        pass  

    return sorted(found)


def _infer_py_modules(plugin_data: Dict[str, Any]) -> List[str]:
    """Infer required Python modules from plugin data."""
    known_modules = {
        "qiskit": "qiskit",
        "pennylane": "pennylane",
        "tensorflow": "tensorflow",
        "torch": "torch",
        "numpy": "numpy",
        "pandas": "pandas",
        "scipy": "scipy",
        "sklearn": "sklearn",
        "biopython": "Bio",
        "cyvcf2": "cyvcf2",
        "pysam": "pysam",
        "pyvcf": "vcf",
    }
    found = set()
    searchable = json.dumps(plugin_data).lower()
    for key, mod in known_modules.items():
        if key in searchable:
            found.add(mod)
    return sorted(found)


def _infer_sub_binaries(plugin_data: Dict[str, Any]) -> List[str]:
    """Infer secondary binaries required (e.g. samtools alongside bwa)."""
    known_pairs = {
        "bwa":     ["samtools"],
        "bwa-mem": ["samtools"],
        "gatk":    ["samtools", "java"],
        "cnvkit.py": ["samtools", "python3"],
        "picard":  ["java"],
        "sambamba": [],
        "mosdepth": [],
        "fastp":   [],
        "snpeff":  ["java"],
        "vep":     ["perl"],
    }
    binary = (plugin_data.get("install") or {}).get("binary", "")
    return known_pairs.get(binary, [])


# ─────────────────────────────────────────────────────────────────────────────
# Deep verification of one dependency
# ─────────────────────────────────────────────────────────────────────────────

def _env_name_from_path(binary_path: str) -> str:
    """Extract conda env name from a binary path like /home/user/miniforge3/envs/myenv/bin/tool."""
    if not binary_path or "/envs/" not in binary_path:
        return ""
    try:
        after = binary_path.split("/envs/", 1)[1]
        return after.split("/")[0]
    except Exception:
        return ""


def _search_all_conda_envs(binary: str) -> Optional[str]:
    """Search every conda environment for a given binary. Returns the path if found."""
    if not binary:
        return None
    mgr = _detect_conda_or_mamba() or "conda"
    try:
        out = subprocess.check_output(
            f"{mgr} env list --json", shell=True, text=True,
            stderr=subprocess.DEVNULL, timeout=15, executable="/bin/bash"
        )
        data = json.loads(out)
        for ep in data.get("envs", []):
            candidate = os.path.join(ep, "bin", binary)
            if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                return candidate
    except Exception:
        pass
    # Also try whereis as a last resort
    try:
        out = subprocess.check_output(
            f"whereis -b {binary}", shell=True, text=True,
            stderr=subprocess.DEVNULL, timeout=8, executable="/bin/bash"
        )
        # Output: "binary: /path/to/binary ..."
        parts = out.strip().split(":", 1)
        if len(parts) == 2:
            for p in parts[1].strip().split():
                if os.path.isfile(p) and os.access(p, os.X_OK):
                    return p
    except Exception:
        pass
    return None


def _verify_dep(dep: Dict[str, Any], user_paths: Dict[str, Any]) -> Dict[str, Any]:
    """
    Given a dep spec and any user-supplied paths, run a comprehensive check.
    Returns a result dict with status, details, and suggestions.

    Detection strategy (in order):
    1. User-saved bin_path (from settings, set via manual path config)
    2. System PATH  (shutil.which) — covers active conda envs, system installs
    3. YAML's conda_env hint  (searches that env's bin/)
    4. All conda envs  (scans every env known to conda/mamba)
    5. whereis  (system-wide binary search)
    """
    plugin_id     = dep["plugin_id"]
    binary        = dep["binary"]
    version_cmd   = dep["version_cmd"]
    conda_env     = dep["conda_env"]   # hint from YAML — not authoritative
    default_paths = dep["default_paths"]

    # Only use user-explicitly-saved paths (not hardcoded YAML defaults)
    user_bin_path = user_paths.get("bin_path", "")
    extra_paths   = []
    if user_bin_path:
        extra_paths.append(os.path.expanduser(user_bin_path))
    # Add YAML's conda_env hint as an extra search path (not mandatory)
    if conda_env:
        env_path = _conda_env_path(conda_env)
        if env_path:
            extra_paths.append(os.path.join(env_path, "bin"))

    binary_path = _which(binary, extra_paths) if binary else None
    binary_ok   = binary_path is not None

    # Fallback: search all conda envs + whereis
    if not binary_ok and binary:
        binary_path = _search_all_conda_envs(binary)
        binary_ok   = binary_path is not None

    version_str = ""
    if binary_ok and version_cmd:
        effective_cmd = version_cmd
        if binary and binary_path:
            effective_cmd = version_cmd.replace(binary, binary_path, 1)
        version_str = _run_version_cmd(effective_cmd) or ""

    install_mode = "not_found"
    if binary_ok:
        if binary_path and "/envs/" in binary_path:
            install_mode = "conda"
        elif binary_path:
            install_mode = "system"

    # Determine the ACTUAL conda env where the binary lives (auto-detected)
    detected_env_name = _env_name_from_path(binary_path or "")
    display_conda_env = detected_env_name or conda_env  # prefer actual over YAML hint

    conda_env_exists = False
    conda_env_path   = ""
    if display_conda_env:
        ep = _conda_env_path(display_conda_env)
        if ep:
            conda_env_exists = True
            conda_env_path   = ep
        elif detected_env_name and binary_path:
            # We found the binary there, so the env definitely exists
            conda_env_exists = True
            prefix = binary_path.split("/envs/" + detected_env_name)[0]
            conda_env_path   = prefix + "/envs/" + detected_env_name

    r_pkg_results = {}
    r_binary = binary_path if binary and "Rscript" in binary else _which("Rscript", extra_paths)
    for rpkg in dep.get("r_packages", []):
        r_pkg_results[rpkg] = _r_package_check(rpkg, r_binary or "Rscript")

    py_mod_results = {}
    py_binary = binary_path if binary and "python" in binary else _which("python3", extra_paths)
    for mod in dep.get("py_modules", []):
        py_mod_results[mod] = _python_module_check(mod, py_binary or "python3")

    sub_binary_results = {}
    for sb in dep.get("sub_binaries", []):
        sub_binary_results[sb] = {
            "found": _which(sb, extra_paths) is not None,
            "path":  _which(sb, extra_paths) or "",
        }

    r_all_ok  = all(r_pkg_results.values()) if r_pkg_results else True
    py_all_ok = all(py_mod_results.values()) if py_mod_results else True
    sub_all_ok = all(v["found"] for v in sub_binary_results.values()) if sub_binary_results else True

    if binary_ok and r_all_ok and py_all_ok and sub_all_ok:
        overall = "ok"
    elif binary_ok:
        overall = "partial"
    else:
        overall = "missing"

    issues = []
    if not binary_ok and binary:
        issues.append(f"Binary '{binary}' not found in PATH or configured paths")
    for rpkg, ok in r_pkg_results.items():
        if not ok:
            issues.append(f"R package '{rpkg}' not installed")
    for mod, ok in py_mod_results.items():
        if not ok:
            issues.append(f"Python module '{mod}' not importable")
    for sb, info in sub_binary_results.items():
        if not info["found"]:
            issues.append(f"Required binary '{sb}' not found")

    return {
        "plugin_id":         plugin_id,
        "plugin_name":       dep["plugin_name"],
        "status":            overall,
        "binary":            binary,
        "binary_found":      binary_ok,
        "binary_path":       binary_path or "",
        "version":           version_str,
        "install_mode":      install_mode,
        "conda_env":         display_conda_env,
        "conda_env_exists":  conda_env_exists,
        "conda_env_path":    conda_env_path,
        "r_packages":        r_pkg_results,
        "py_modules":        py_mod_results,
        "sub_binaries":      sub_binary_results,
        "issues":            issues,
        "install_info": {
            "method":          dep["method"],
            "conda_package":   dep["conda_package"],
            "pip_package":     dep["pip_package"],
            "channels":        dep["channels"],
            "default_paths":   dep["default_paths"],
            "notes":           dep.get("notes", ""),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# AI-guided installation via API
# ─────────────────────────────────────────────────────────────────────────────

async def _ai_install_plan(dep_result: Dict[str, Any], conda_mgr: str, target_env: str, llm_config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Call AI API to get an intelligent installation plan.
    Returns {"commands": [...], "notes": "...", "post_check": "..."}
    """
    if llm_config is None:
        llm_config = {}

    try:
        import httpx

        plugin_name  = dep_result["plugin_name"]
        install_info = dep_result["install_info"]
        issues       = dep_result["issues"]
        r_pkgs       = [k for k, v in dep_result.get("r_packages", {}).items() if not v]
        py_mods      = [k for k, v in dep_result.get("py_modules", {}).items() if not v]
        sub_bins     = [k for k, v in dep_result.get("sub_binaries", {}).items() if not v["found"]]

        system_prompt = textwrap.dedent("""
            You are an expert bioinformatics system administrator.
            You produce shell installation commands for genomics tools on Linux.
            Rules:
            1. Respond ONLY with a JSON object — no markdown, no prose outside the JSON.
            2. Schema: {"commands": ["cmd1", "cmd2", ...], "notes": "brief note", "post_check": "cmd to verify install"}
            3. Commands must be executable in bash, safe, non-interactive.
            4. Prefer conda/mamba when conda_manager is available.
            5. If the tool needs conda env activation, use: conda run -n ENV CMD  (do NOT use source activate).
            6. For R packages: Rscript -e 'if (!requireNamespace("BiocManager")) install.packages("BiocManager", repos="https://cloud.r-project.org"); BiocManager::install("PKG")'
            7. Keep commands focused — do not install unrelated tools.
            8. For pip: pip install PKG --quiet
        """).strip()

        user_msg = textwrap.dedent(f"""
            Install the following for bioinformatics tool "{plugin_name}":
            - conda_manager: {conda_mgr}
            - target conda environment: {target_env}
            - main package (conda): {install_info.get("conda_package", "N/A")}
            - main package (pip): {install_info.get("pip_package", "N/A")}
            - conda channels: {", ".join(install_info.get("channels", []))}
            - missing R packages: {r_pkgs}
            - missing Python modules: {py_mods}
            - missing sub-binaries: {sub_bins}
            - issues detected: {issues}
            - install notes from plugin: {install_info.get("notes", "none")[:500]}

            Produce the minimal set of commands to resolve all issues.
            Return ONLY the JSON object.
        """).strip()

        provider = llm_config.get("provider", "openai")
        api_key  = llm_config.get("api_key", "")
        model    = llm_config.get("model", "")
        api_base = llm_config.get("api_base", "")

        raw_text = ""

        if provider == "anthropic":
            if not api_key: raise ValueError("Anthropic API key missing")
            if not model: model = "claude-3-7-sonnet-20250219"
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"Content-Type": "application/json", "x-api-key": api_key, "anthropic-version": "2023-06-01"},
                    json={
                        "model":      model,
                        "max_tokens": 1024,
                        "system":     system_prompt,
                        "messages":   [{"role": "user", "content": user_msg}],
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                for block in data.get("content", []):
                    if block.get("type") == "text":
                        raw_text += block["text"]
                        
        elif provider == "gemini":
            if not api_key: raise ValueError("Gemini API key missing")
            if not model: model = "gemini-2.0-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "systemInstruction": {"parts": [{"text": system_prompt}]},
                        "contents": [{"parts": [{"text": user_msg}]}]
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                try:
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    raw_text = ""

        else: # OpenAI, Grok, Ollama, Custom (API compatível com a OpenAI)
            if provider == "grok":
                base_url = "https://api.x.ai/v1"
                if not model: model = "grok-2-latest"
            else:
                base_url = api_base.rstrip('/') if api_base else "https://api.openai.com/v1"
                if provider == "openai" and not model: model = "gpt-4o"
            
            url = f"{base_url}/chat/completions"
            headers = {"Content-Type": "application/json"}
            if api_key: headers["Authorization"] = f"Bearer {api_key}"
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    url,
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_msg}
                        ]
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                if "choices" in data and len(data["choices"]) > 0:
                    raw_text = data["choices"][0].get("message", {}).get("content", "")

        raw_text = re.sub(r"```json|```", "", raw_text).strip()
        plan = json.loads(raw_text)
        return plan

    except Exception as e:
        logger.warning(f"AI install plan failed ({e}), using fallback")
        return _fallback_install_plan(dep_result, conda_mgr, target_env)


def _fallback_install_plan(dep_result: Dict[str, Any], conda_mgr: str, target_env: str) -> Dict[str, Any]:
    """Static fallback install plan when AI is unavailable."""
    info    = dep_result["install_info"]
    method  = info.get("method", "conda")
    channels_flags = " ".join(f"-c {c}" for c in info.get("channels", ["conda-forge", "bioconda", "defaults"]))
    commands = []

    if method == "pip" and info.get("pip_package"):
        commands.append(f"pip install '{info['pip_package']}' --quiet")
    elif info.get("conda_package"):
        if target_env and target_env != "base":
            commands.append(
                f"{conda_mgr} install -y -n {target_env} {channels_flags} '{info['conda_package']}'"
            )
        else:
            commands.append(
                f"{conda_mgr} install -y {channels_flags} '{info['conda_package']}'"
            )

    r_pkgs = [k for k, v in dep_result.get("r_packages", {}).items() if not v]
    if r_pkgs:
        pkgs_r = '", "'.join(r_pkgs)
        rscript = dep_result.get("binary_path") or "Rscript"
        if "Rscript" not in rscript:
            rscript = "Rscript"
        commands.append(
            f'{rscript} -e \'if (!requireNamespace("BiocManager", quietly=TRUE)) '
            f'install.packages("BiocManager", repos="https://cloud.r-project.org"); '
            f'BiocManager::install(c("{pkgs_r}"), ask=FALSE)\''
        )

    py_mods = [k for k, v in dep_result.get("py_modules", {}).items() if not v]
    for mod in py_mods:
        commands.append(f"pip install '{mod}' --quiet")

    return {
        "commands":   commands,
        "notes":      "Fallback install plan (AI unavailable)",
        "post_check": dep_result["install_info"].get("post_check", ""),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Job runner
# ─────────────────────────────────────────────────────────────────────────────

def _run_install_job(job_id: str, commands: List[str], post_check: str):
    """Execute installation commands in a background thread."""
    job = _depcheck_jobs[job_id]
    job["status"] = "running"

    def _log(line: str):
        job["log"].append(line)

    try:
        for cmd in commands:
            _log(f"\n▶ {cmd}")
            proc = subprocess.Popen(
                cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, executable="/bin/bash", bufsize=1
            )
            job["proc"] = proc
            for line in proc.stdout:
                _log(line.rstrip())
            proc.wait()
            if proc.returncode != 0:
                _log(f"\n✗ Command exited with code {proc.returncode}")
                job["status"] = "error"
                return

        if post_check:
            _log(f"\n🔍 Post-check: {post_check}")
            result = _run_version_cmd(post_check)
            if result:
                _log(f"✓ {result}")
            else:
                _log("⚠ Post-check returned no output")

        job["status"] = "success"
        _log("\n✅ Installation complete.")

    except Exception as e:
        _log(f"\nFATAL: {e}")
        job["status"] = "error"


# ─────────────────────────────────────────────────────────────────────────────
# Request/Response models
# ─────────────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    tool_ids: List[str]      


class InstallRequest(BaseModel):
    plugin_id:  str
    target_env: Optional[str] = None   
    use_ai:     bool = True


class SetPathRequest(BaseModel):
    plugin_id: str
    bin_path:  Optional[str] = None
    lib_path:  Optional[str] = None
    refs_path: Optional[str] = None


class RecheckRequest(BaseModel):
    plugin_id: str


# ─────────────────────────────────────────────────────────────────────────────
# Route registration
# ─────────────────────────────────────────────────────────────────────────────

def register_depcheck_routes(
    app: FastAPI,
    pm: Any,                          
    get_settings: Callable,
    save_settings: Callable,
):
    """Attach all /api/depcheck/* routes to the FastAPI app."""

    # ── Analyze ──────────────────────────────────────────────────────────────

    @app.post("/api/depcheck/analyze")
    async def depcheck_analyze(payload: AnalyzeRequest, request: Request):
        """
        Verify tool installations.
        - If the user has a connected agent: routes to the agent (user's machine).
        - Fallback: runs on VPS (legacy behaviour).
        User identity comes from X-Seqnode-User-Id injected by VpsProxy.php.
        """
        from core.agent_manager import get_agent_by_user, depcheck_request as agent_depcheck

        settings     = get_settings()
        plugin_paths = settings.get("plugin_paths", {})

        # ── Try agent-side verification first ─────────────────────────────────
        user_id_hdr = request.headers.get("X-Seqnode-User-Id", "")
        if user_id_hdr:
            try:
                user_id  = int(user_id_hdr)
                agent_id = get_agent_by_user(user_id)
                if agent_id:
                    # Collect per-user plugin paths for this user (from stored settings)
                    user_paths = {}
                    for tid in payload.tool_ids:
                        paths = plugin_paths.get(tid, {})
                        if paths:
                            user_paths[tid] = paths

                    result = await agent_depcheck(agent_id, payload.tool_ids, user_paths)
                    if result:
                        # Mark results for any unknown plugins (not in agent's basic check)
                        for tool_id in payload.tool_ids:
                            if tool_id not in result.get("results", {}):
                                plugin = pm.get_tool(tool_id)
                                result["results"][tool_id] = {
                                    "plugin_id":   tool_id,
                                    "plugin_name": tool_id,
                                    "status":      "unknown_plugin" if not plugin else "missing",
                                    "issues":      [f"Plugin '{tool_id}' not found on agent machine"],
                                }
                        result["via_agent"] = True
                        return result
            except Exception as e:
                logger.warning(f"Agent depcheck failed, falling back to VPS: {e}")

        # ── Fallback: VPS-side verification ───────────────────────────────────
        results = {}
        for tool_id in payload.tool_ids:
            plugin = pm.get_tool(tool_id)
            if not plugin:
                results[tool_id] = {
                    "plugin_id": tool_id,
                    "plugin_name": tool_id,
                    "status": "unknown_plugin",
                    "issues": [f"Plugin '{tool_id}' not registered — add its YAML to plugins dir"],
                }
                continue

            plugin_data = plugin.model_dump()
            dep         = _extract_deps_from_plugin(plugin_data)
            user_paths  = plugin_paths.get(tool_id, {})
            result      = _verify_dep(dep, user_paths)
            results[tool_id] = result

        total   = len(results)
        ok      = sum(1 for r in results.values() if r.get("status") == "ok")
        partial = sum(1 for r in results.values() if r.get("status") == "partial")
        missing = sum(1 for r in results.values() if r.get("status") == "missing")

        return {
            "results": results,
            "via_agent": False,
            "summary": {
                "total":   total,
                "ok":      ok,
                "partial": partial,
                "missing": missing,
                "conda_manager": _detect_conda_or_mamba(),
                "available_envs": _conda_envs(),
            },
        }

    # ── Install ───────────────────────────────────────────────────────────────

    @app.post("/api/depcheck/install")
    async def depcheck_install(payload: InstallRequest):
        """
        AI-guided (or fallback) installation of a single plugin's dependencies.
        Returns a job_id for polling logs.
        """
        plugin = pm.get_tool(payload.plugin_id)
        if not plugin:
            raise HTTPException(status_code=404, detail=f"Plugin '{payload.plugin_id}' not found.")

        settings     = get_settings()
        plugin_paths = settings.get("plugin_paths", {})
        llm_config   = settings.get("llm_config", {})
        plugin_data  = plugin.model_dump()
        dep          = _extract_deps_from_plugin(plugin_data)
        user_paths   = plugin_paths.get(payload.plugin_id, {})
        dep_result   = _verify_dep(dep, user_paths)

        if dep_result["status"] == "ok":
            return {"status": "already_ok", "plugin_id": payload.plugin_id}

        conda_mgr  = _detect_conda_or_mamba() or "conda"
        target_env = payload.target_env or dep.get("conda_env") or "base"

        if payload.use_ai:
            # plan = await _ai_install_plan(dep_result, conda_mgr, target_env)
            plan = await _ai_install_plan(dep_result, conda_mgr, target_env, llm_config)
        else:
            plan = _fallback_install_plan(dep_result, conda_mgr, target_env)

        commands   = plan.get("commands", [])
        notes      = plan.get("notes", "")
        post_check = plan.get("post_check", "")

        if not commands:
            raise HTTPException(status_code=400, detail="No install commands generated.")

        job_id = f"dcinst_{payload.plugin_id}_{uuid.uuid4().hex[:6]}"
        job    = {
            "job_id":    job_id,
            "plugin_id": payload.plugin_id,
            "status":    "pending",
            "log":       [f"📋 Plan: {notes}", f"Commands to execute: {len(commands)}"],
            "commands":  commands,
            "proc":      None,
        }
        _depcheck_jobs[job_id] = job

        threading.Thread(
            target=_run_install_job,
            args=(job_id, commands, post_check),
            daemon=True,
        ).start()

        return {
            "job_id":    job_id,
            "plugin_id": payload.plugin_id,
            "status":    "started",
            "plan_notes": notes,
            "commands":  commands,
        }

    # ── Install logs ──────────────────────────────────────────────────────────

    @app.get("/api/depcheck/install-logs/{job_id}")
    def depcheck_install_logs(job_id: str, offset: int = 0):
        job = _depcheck_jobs.get(job_id)
        if not job:
            return {"status": "not_found", "lines": [], "offset": 0, "total": 0}
        lines     = job["log"]
        new_lines = lines[offset:]
        return {
            "job_id":   job_id,
            "status":   job["status"],
            "lines":    new_lines,
            "offset":   offset + len(new_lines),
            "total":    len(lines),
        }

    # ── Cancel install ────────────────────────────────────────────────────────

    @app.delete("/api/depcheck/install/{job_id}")
    def depcheck_cancel_install(job_id: str):
        job = _depcheck_jobs.get(job_id)
        if job:
            proc = job.get("proc")
            if proc:
                try:
                    proc.terminate()
                except Exception:
                    pass
            job["status"] = "cancelled"
        return {"status": "cancelled", "job_id": job_id}

    # ── Set path manually ─────────────────────────────────────────────────────

    @app.post("/api/depcheck/set-path")
    def depcheck_set_path(payload: SetPathRequest):
        """
        User manually specifies where a tool is installed.
        Merges into plugin_paths settings and returns updated verification.
        """
        settings     = get_settings()
        plugin_paths = settings.setdefault("plugin_paths", {})
        existing     = plugin_paths.get(payload.plugin_id, {})

        if payload.bin_path  is not None: existing["bin_path"]  = payload.bin_path
        if payload.lib_path  is not None: existing["lib_path"]  = payload.lib_path
        if payload.refs_path is not None: existing["refs_path"] = payload.refs_path

        plugin_paths[payload.plugin_id] = existing
        save_settings(settings)

        return {"status": "saved", "plugin_id": payload.plugin_id, "paths": existing}

    # ── Re-check after manual path ────────────────────────────────────────────

    @app.post("/api/depcheck/recheck")
    def depcheck_recheck(payload: RecheckRequest):
        """Re-run verification for one plugin (after user set custom path)."""
        plugin = pm.get_tool(payload.plugin_id)
        if not plugin:
            raise HTTPException(status_code=404, detail=f"Plugin '{payload.plugin_id}' not found.")

        settings     = get_settings()
        plugin_paths = settings.get("plugin_paths", {})
        plugin_data  = plugin.model_dump()
        dep          = _extract_deps_from_plugin(plugin_data)
        user_paths   = plugin_paths.get(payload.plugin_id, {})
        result       = _verify_dep(dep, user_paths)

        return result

    # ── List active jobs ──────────────────────────────────────────────────────

    @app.get("/api/depcheck/jobs")
    def depcheck_list_jobs():
        return [
            {
                "job_id":    jid,
                "plugin_id": j["plugin_id"],
                "status":    j["status"],
                "log_lines": len(j["log"]),
            }
            for jid, j in _depcheck_jobs.items()
        ]

    logger.info("DepCheck routes registered: /api/depcheck/*")