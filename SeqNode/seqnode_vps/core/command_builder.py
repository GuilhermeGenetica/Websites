"""
core/command_builder.py
───────────────────────
Runtime-override application, pre-flight tool verification, and
final shell-command assembly for workflow nodes.

Functions that previously lived as methods on WorkflowEngine are exposed
here as plain functions that accept an `executor` argument where needed.
This keeps the Executor instance owned by WorkflowEngine while allowing
these concerns to be maintained and extended independently.

Extracted from workflow_engine.py — function bodies are 100% identical to the originals.
"""

import os
import shutil
from typing import Dict, Any, Optional

from core.models import (
    WorkflowNodeDef,
    PluginManifest,
)


# ─────────────────────────────────────────────────────────────────────────────
#  Runtime-override application
# ─────────────────────────────────────────────────────────────────────────────

def apply_runtime_override(
    command: str,
    runtime_override: dict,
    node_def: WorkflowNodeDef,
    plugin: PluginManifest,
) -> str:
    """
    Wrap or rewrite `command` according to the runtime_override dict.
    Supported modes: system | conda | mamba | shell_source | direct | auto.
    'auto' and unrecognised modes return the command unchanged.
    """
    mode = runtime_override.get("mode", "auto")

    if mode == "system":
        bin_path = runtime_override.get("bin_path", "") or node_def.plugin_paths.get("bin_path", "")
        if bin_path:
            bin_path = os.path.expanduser(bin_path)
            tokens = command.split(" ", 1)
            binary_name = os.path.basename(tokens[0])
            full_binary = os.path.join(bin_path, binary_name)
            command = full_binary + (" " + tokens[1] if len(tokens) > 1 else "")
        return command

    elif mode in ("conda", "mamba"):
        conda_bin = runtime_override.get("conda_bin", "").strip()
        if not conda_bin:
            conda_bin = mode
        conda_bin = os.path.expanduser(conda_bin)
        conda_env = (
            runtime_override.get("conda_env", "").strip()
            or (plugin.runtime.conda_env if plugin.runtime else "")
            or "base"
        )
        return f"{conda_bin} run -n {conda_env} {command}"

    elif mode == "shell_source":
        source_script = runtime_override.get("source_script", "").strip()
        conda_env     = runtime_override.get("conda_env", "").strip()
        parts = []
        if source_script:
            parts.append(f". {os.path.expanduser(source_script)}")
        if conda_env:
            parts.append(f"conda activate {conda_env}")
        parts.append(command)
        full_cmd = " && ".join(parts)
        escaped = full_cmd.replace("'", "'\\''")
        return f"/bin/bash -c '{escaped}'"

    elif mode == "direct":
        return command

    return command


# ─────────────────────────────────────────────────────────────────────────────
#  Pre-flight tool verification
# ─────────────────────────────────────────────────────────────────────────────

def preflight_with_override(
    node_def: WorkflowNodeDef,
    plugin: PluginManifest,
    executor,                       # core.executor.Executor — avoids circular import
) -> Optional[Dict]:
    """
    Verify that the tool required by `node_def` is reachable given any
    runtime_override settings. Returns None on success, or a dict describing
    the problem (node_id, plugin_id, plugin_name, binary, message) on failure.
    """
    runtime_override = getattr(node_def, "runtime_override", {}) or {}
    mode = runtime_override.get("mode", "auto")

    if mode == "direct" or mode == "shell_source":
        return None

    if mode == "system":
        bin_path = runtime_override.get("bin_path", "") or node_def.plugin_paths.get("bin_path", "")
        if bin_path:
            cmd_str = plugin.command if isinstance(plugin.command, str) else plugin.command.template
            binary_name = cmd_str.strip().split()[0] if cmd_str.strip() else ""
            if binary_name:
                full = os.path.join(os.path.expanduser(bin_path), binary_name)
                if os.path.isfile(full) and os.access(full, os.X_OK):
                    return None
                return {
                    "node_id":     node_def.id,
                    "plugin_id":   plugin.id,
                    "plugin_name": plugin.name,
                    "binary":      binary_name,
                    "message":     f"Binary not found at override path: {full}",
                }

    if mode in ("conda", "mamba"):
        conda_bin = runtime_override.get("conda_bin", "").strip() or mode
        conda_bin_expanded = os.path.expanduser(conda_bin)
        if os.path.isabs(conda_bin_expanded) or conda_bin_expanded.startswith("~"):
            if os.path.isfile(conda_bin_expanded):
                return None
            return {
                "node_id":     node_def.id,
                "plugin_id":   plugin.id,
                "plugin_name": plugin.name,
                "binary":      conda_bin,
                "message":     f"Conda/Mamba binary not found at: {conda_bin_expanded}",
            }
        if shutil.which(conda_bin_expanded):
            return None
        return {
            "node_id":     node_def.id,
            "plugin_id":   plugin.id,
            "plugin_name": plugin.name,
            "binary":      conda_bin,
            "message":     f"'{conda_bin}' not found in PATH. Provide the full path in Runtime Override.",
        }

    check = executor.check_plugin_tool(plugin)
    if not check["available"]:
        return {
            "node_id":     node_def.id,
            "plugin_id":   plugin.id,
            "plugin_name": plugin.name,
            "binary":      check.get("binary", ""),
            "message":     check["message"],
        }
    return None


# ─────────────────────────────────────────────────────────────────────────────
#  Final command assembly
# ─────────────────────────────────────────────────────────────────────────────

def build_command_for_node(
    node_def: WorkflowNodeDef,
    plugin: PluginManifest,
    resolved_params: Dict[str, Any],
    resolved_inputs: Dict[str, str],
    resolved_outputs: Dict[str, str],
    executor,                           # core.executor.Executor — avoids circular import
) -> str:
    """
    Build the final shell command for a node, respecting custom_command and
    runtime_override. Reusable by both the single-file and batch execution paths.
    
    For shell_cmd plugin (and similar): if conda_env or extra_env are in
    resolved_params and non-empty, they are applied as command prefixes here,
    since the simplified YAML template is just '{cmd}'.
    """
    runtime_override = getattr(node_def, "runtime_override", {}) or {}
    override_mode    = runtime_override.get("mode", "auto")
    has_custom_cmd   = bool(node_def.custom_command and node_def.custom_command.strip())

    if has_custom_cmd:
        raw_command = node_def.custom_command.strip()
        if override_mode == "auto":
            runtime = plugin.runtime
            image   = plugin.container or runtime.image
            command = executor.container.wrap_command(
                command=raw_command,
                runtime_type=runtime.type,
                image=image,
                conda_env=runtime.conda_env,
                env_vars=runtime.env_vars or None,
                working_dir=runtime.working_dir,
            )
        else:
            command = apply_runtime_override(raw_command, runtime_override, node_def, plugin)
    else:
        if override_mode == "auto":
            command = executor.build_command(
                plugin=plugin,
                params=resolved_params,
                inputs_map=resolved_inputs,
                outputs_map=resolved_outputs,
            )
        else:
            raw_command = executor.build_raw_command(
                plugin=plugin,
                params=resolved_params,
                inputs_map=resolved_inputs,
                outputs_map=resolved_outputs,
            )
            command = apply_runtime_override(raw_command, runtime_override, node_def, plugin)

    # ── Post-processing: apply conda_env and extra_env from node params ──
    # This handles the case where the YAML template is simply '{cmd}' and
    # conda_env / extra_env are separate params (e.g. shell_pipeline.yaml).
    # Only applied if the command doesn't already contain 'conda run' (to
    # avoid double-wrapping when the container_runtime already handled it).
    param_conda = str(resolved_params.get("conda_env", "")).strip()
    param_extra_env = str(resolved_params.get("extra_env", "")).strip()

    if param_conda and "conda run" not in command and "mamba run" not in command:
        import shutil as _shutil
        conda_bin = "mamba" if _shutil.which("mamba") else "conda"
        safe_cmd = command.replace("'", "'\\''")
        command = f"{conda_bin} run -n {param_conda} bash -c '{safe_cmd}'"

    if param_extra_env and param_extra_env not in command:
        command = f"{param_extra_env} {command}"

    return command
