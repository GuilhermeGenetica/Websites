import os
import shutil
import subprocess
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("seqnode.tool_verifier")


def verify_binary(
    binary_name: str,
    custom_path: Optional[str] = None,
    fallback_name: Optional[str] = None,
    version_cmd: Optional[str] = None,
) -> Dict[str, Any]:
    bin_found = False
    bin_resolved = ""
    version_str = ""

    if binary_name and custom_path:
        candidate = os.path.join(os.path.expanduser(custom_path), binary_name)
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            bin_found = True
            bin_resolved = candidate

    if not bin_found and binary_name:
        found = shutil.which(binary_name)
        if found:
            bin_found = True
            bin_resolved = found

    if not bin_found and fallback_name:
        found = shutil.which(fallback_name)
        if found:
            bin_found = True
            bin_resolved = found

    if bin_found and version_cmd:
        try:
            cmd = version_cmd.replace(binary_name, bin_resolved, 1) if bin_resolved else version_cmd
            out = subprocess.check_output(
                cmd, shell=True, text=True, stderr=subprocess.STDOUT,
                timeout=10, executable="/bin/bash"
            ).strip()
            version_str = out[:120] if out else "installed"
        except Exception:
            version_str = "installed"

    return {
        "binary":       binary_name,
        "installed":    bin_found,
        "binary_path":  bin_resolved,
        "version":      version_str,
    }


def verify_refs_path(path: str) -> Optional[bool]:
    if not path:
        return None
    return os.path.isdir(os.path.expanduser(path))


def verify_lib_path(path: str) -> Optional[bool]:
    if not path:
        return None
    return os.path.isdir(os.path.expanduser(path))


def verify_plugin(
    plugin: Any,
    plugin_cfg: Optional[Dict[str, Any]] = None,
    custom_path: Optional[str] = None,
    custom_refs_path: Optional[str] = None,
) -> Dict[str, Any]:
    plugin_cfg = plugin_cfg or {}
    effective_path     = custom_path      or (plugin_cfg.get("path", "")      if isinstance(plugin_cfg, dict) else "")
    effective_refs     = custom_refs_path or (plugin_cfg.get("refs_path", "") if isinstance(plugin_cfg, dict) else "")

    cmd_str = plugin.command if isinstance(plugin.command, str) else plugin.command.template
    binary_name = cmd_str.split()[0] if cmd_str else ""

    binary_result = verify_binary(binary_name, effective_path or None)
    refs_ok = verify_refs_path(effective_refs)

    return {
        "plugin_id":    plugin.id,
        "plugin_name":  plugin.name,
        "binary":       binary_name,
        "binary_found": binary_result["installed"],
        "binary_path":  binary_result["binary_path"],
        "version":      binary_result["version"],
        "custom_path":  effective_path,
        "refs_path":    effective_refs,
        "refs_ok":      refs_ok,
        "status":       "ok" if binary_result["installed"] else "missing",
    }


def verify_plugin_with_install_cfg(
    plugin: Any,
    plugin_paths: Optional[Dict[str, str]] = None,
    install_jobs: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    plugin_paths = plugin_paths or {}
    install_jobs = install_jobs or {}

    tool_data   = plugin.model_dump()
    install_cfg = tool_data.get("install") or {}
    binary      = install_cfg.get("binary", "")
    version_cmd = install_cfg.get("version_check", "")
    default_paths = install_cfg.get("default_paths", {})

    current_paths = plugin_paths.get(plugin.id, {})
    bin_override  = current_paths.get("bin_path", "")
    refs_path     = current_paths.get("refs_path", "") or default_paths.get("refs_path", "")
    lib_path      = current_paths.get("lib_path",  "") or default_paths.get("lib_path",  "")

    binary_result = {"installed": False, "binary_path": "", "version": ""}
    if binary:
        binary_result = verify_binary(
            binary_name=binary,
            custom_path=bin_override or default_paths.get("bin_path", "") or None,
            version_cmd=version_cmd or None,
        )

    job        = install_jobs.get(plugin.id, {})
    job_status = job.get("status", "idle")
    refs_ok    = verify_refs_path(refs_path)

    return {
        "tool_id":       plugin.id,
        "binary":        binary,
        "installed":     binary_result["installed"],
        "binary_path":   binary_result["binary_path"],
        "version":       binary_result["version"],
        "default_paths": default_paths,
        "current_paths": {
            "bin_path":  bin_override  or default_paths.get("bin_path",  ""),
            "refs_path": refs_path,
            "lib_path":  lib_path,
        },
        "refs_ok":    refs_ok,
        "job_status": job_status,
        "install_cfg": install_cfg,
    }


def verify_all_plugins(
    plugins: List[Any],
    plugin_defaults: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    plugin_defaults = plugin_defaults or {}
    results = {}
    for plugin in plugins:
        if not plugin:
            continue
        plugin_cfg = plugin_defaults.get(plugin.id, {})
        results[plugin.id] = verify_plugin(plugin, plugin_cfg)
    return results