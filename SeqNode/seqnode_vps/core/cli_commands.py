from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from typing import Any, Dict, List, Optional


def _format_duration(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.1f}s"
    m, s = divmod(int(seconds), 60)
    if m < 60:
        return f"{m}m {s}s"
    h, m = divmod(m, 60)
    return f"{h}h {m}m {s}s"


def _status_icon(status: str) -> str:
    _icons = {
        "COMPLETED": "\u2713",
        "FAILED":    "\u2717",
        "RUNNING":   "\u27f3",
        "PENDING":   "\u25cb",
        "SKIPPED":   "\u2298",
        "CANCELLED": "\u2205",
        "QUEUED":    "\u25cb",
    }
    return _icons.get(status.upper(), "?")


def _print_table(headers: List[str], rows: List[List[str]], max_col_width: int = 40) -> None:
    if not rows and not headers:
        return
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            if i < len(col_widths):
                col_widths[i] = min(max_col_width, max(col_widths[i], len(str(cell))))
    fmt_parts = [f"{{:<{w}}}" for w in col_widths]
    fmt = "  ".join(fmt_parts)
    sep = "  ".join("-" * w for w in col_widths)

    print(fmt.format(*headers))
    print(sep)
    for row in rows:
        padded = [str(row[i])[:max_col_width] if i < len(row) else "" for i in range(len(headers))]
        print(fmt.format(*padded))


def _use_rich() -> bool:
    try:
        import rich  # noqa: F401
        return True
    except ImportError:
        return False


def _load_workflow_file(path: str):
    from core.models import WorkflowDefinition
    if not os.path.exists(path):
        print(f"Error: Workflow file not found: {path}", file=sys.stderr)
        sys.exit(1)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return WorkflowDefinition(**data)
    except json.JSONDecodeError as exc:
        print(f"Error: Invalid JSON in workflow file: {exc}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"Error: Cannot parse workflow definition: {exc}", file=sys.stderr)
        sys.exit(1)


def _load_settings(settings_path: str, plugins_dir: str = ".", state_dir: str = ".seqnode_state") -> Dict[str, Any]:
    from core.settings_service import build_default_settings, load_settings
    defaults = build_default_settings(plugins_dir=plugins_dir, workflows_dir=".")
    defaults["dirs"]["state"] = state_dir
    if os.path.exists(settings_path):
        return load_settings(settings_path, defaults)
    return defaults


def _build_engine(settings: Dict[str, Any], plugins_dir: str, runner_override: Optional[str] = None):
    from core.plugin_manager import PluginManager
    from core.workflow_engine import WorkflowEngine
    from core.settings_service import build_runner_from_settings, build_state_manager_from_settings

    pm = PluginManager(plugins_dir=plugins_dir)

    if runner_override:
        override_settings = dict(settings)
        override_settings["runner_type"] = runner_override
        runner = build_runner_from_settings(override_settings)
    else:
        runner = build_runner_from_settings(settings)

    state_manager = build_state_manager_from_settings(settings)

    engine = WorkflowEngine(
        plugin_manager=pm,
        state_dir=settings.get("dirs", {}).get("state", ".seqnode_state"),
        runner=runner,
        state_manager=state_manager,
    )
    return engine


async def cmd_run(
    workflow_file: str,
    resume: Optional[str],
    dry_run: bool,
    plugins_dir: str,
    state_dir: str,
    settings_path: str,
    runner_override: Optional[str] = None,
) -> int:
    settings = _load_settings(settings_path, plugins_dir=plugins_dir, state_dir=state_dir)
    workflow  = _load_workflow_file(workflow_file)
    engine    = _build_engine(settings, plugins_dir, runner_override)

    errors = engine.validate_workflow(workflow)
    if errors:
        print("\nWorkflow validation errors:")
        for err in errors:
            print(f"  \u2717 {err}")
        return 1

    if dry_run:
        layers = engine.get_execution_layers(workflow)
        print(f"\nWorkflow: {workflow.name} ({workflow.id})")
        print(f"Nodes: {sum(len(l) for l in layers)}")
        print("\nExecution layers (parallel groups):")
        for i, layer in enumerate(layers):
            print(f"  Layer {i + 1}: {' | '.join(layer)}")
        print("\nDry run complete. No execution.")
        return 0

    print(f"\nStarting workflow: {workflow.name}")
    print(f"Runner: {engine._runner.name}")

    def _log_cb(node_id: str, level: str, message: str) -> None:
        prefix = f"[{node_id}]" if node_id else "[engine]"
        print(f"  {prefix} {level}: {message}", flush=True)

    engine.add_log_callback(_log_cb)

    start = time.time()
    state = await engine.execute_workflow(
        workflow=workflow,
        resume_from=resume,
        settings=settings,
    )
    duration = time.time() - start

    print(f"\n{'='*60}")
    print(f"Run ID   : {state.run_id}")
    print(f"Status   : {_status_icon(state.status)} {state.status}")
    print(f"Duration : {_format_duration(duration)}")
    if state.error_message:
        print(f"Error    : {state.error_message[:200]}")

    print("\nNode Summary:")
    rows = []
    for nid, ns in state.node_statuses.items():
        outputs = state.node_outputs.get(nid, {})
        out_str = "; ".join(f"{k}={v}" for k, v in list(outputs.items())[:2])
        rows.append([_status_icon(ns.value) + " " + nid, ns.value, out_str[:60]])
    _print_table(["Node", "Status", "Outputs"], rows)

    return 0 if state.status == "COMPLETED" else 1


def cmd_validate(workflow_file: str, plugins_dir: str) -> int:
    from core.plugin_manager import PluginManager
    from core.workflow_engine import WorkflowEngine
    from core.state_db import UnifiedStateManager

    workflow = _load_workflow_file(workflow_file)
    pm = PluginManager(plugins_dir=plugins_dir)
    engine = WorkflowEngine(
        plugin_manager=pm,
        state_manager=UnifiedStateManager.from_settings({}),
    )

    errors = engine.validate_workflow(workflow)
    if errors:
        print(f"\nWorkflow '{workflow.name}' has {len(errors)} error(s):")
        for err in errors:
            print(f"  \u2717 {err}")
        return 1

    layers = engine.get_execution_layers(workflow)
    print(f"\nWorkflow '{workflow.name}' is valid.")
    print(f"Nodes: {sum(len(l) for l in layers)}")
    print("Execution layers:")
    for i, layer in enumerate(layers):
        print(f"  Layer {i + 1}: {' | '.join(layer)}")
    return 0


def cmd_plugins_list(category: Optional[str], plugins_dir: str) -> int:
    from core.plugin_manager import PluginManager
    pm = PluginManager(plugins_dir=plugins_dir)
    tools = pm.list_tools()
    if not tools:
        print("No plugins found.")
        return 0

    if category:
        tools = [t for t in tools if t.get("category", "").lower() == category.lower()]

    rows = [
        [t.get("id", ""), t.get("name", ""), t.get("category", ""), t.get("version", ""), t.get("runtime", "")]
        for t in tools
    ]
    _print_table(["ID", "Name", "Category", "Version", "Runtime"], rows)
    print(f"\n{len(rows)} plugin(s) found.")
    return 0


def cmd_plugins_show(plugin_id: str, plugins_dir: str) -> int:
    from core.plugin_manager import PluginManager
    pm = PluginManager(plugins_dir=plugins_dir)
    plugin = pm.get_tool(plugin_id)
    if not plugin:
        print(f"Plugin '{plugin_id}' not found.", file=sys.stderr)
        return 1

    print(f"\nPlugin: {plugin.name}")
    print(f"ID     : {plugin.id}")
    print(f"Version: {plugin.version}")
    print(f"Category: {plugin.category}")
    print(f"Description: {plugin.description}")
    print(f"Runtime: {plugin.runtime.type if plugin.runtime else 'system'}")

    if plugin.params:
        print("\nParameters:")
        rows = []
        for name, p in plugin.params.items():
            rows.append([name, p.type, str(p.default), p.label[:40]])
        _print_table(["Name", "Type", "Default", "Label"], rows)

    if plugin.inputs:
        print("\nInputs:")
        for name, inp in plugin.inputs.items():
            req = "required" if inp.required else "optional"
            print(f"  {name} ({req}): {inp.label}")

    if plugin.outputs:
        print("\nOutputs:")
        for name, out in plugin.outputs.items():
            print(f"  {name}: {out.label}")

    cmd = plugin.command if isinstance(plugin.command, str) else getattr(plugin.command, "template", "")
    if cmd:
        print(f"\nCommand template:\n  {cmd[:300]}")

    return 0


async def cmd_status(run_id: Optional[str], state_dir: str, settings_path: str) -> int:
    settings = _load_settings(settings_path, state_dir=state_dir)
    from core.state_db import UnifiedStateManager
    sm = UnifiedStateManager.from_settings(settings)

    if run_id is None:
        runs = await sm.list_runs_async()
        if not runs:
            print("No runs found.")
            return 0
        rows = []
        for r in runs:
            started = r.get("started_at")
            finished = r.get("finished_at")
            dur = ""
            if started and finished:
                dur = _format_duration(float(finished) - float(started))
            elif started:
                dur = _format_duration(time.time() - float(started))
            rows.append([
                r.get("run_id", "")[:20],
                _status_icon(r.get("status", "")) + " " + r.get("status", ""),
                r.get("workflow_id", "")[:20],
                dur,
            ])
        _print_table(["Run ID", "Status", "Workflow", "Duration"], rows)
        return 0

    state = await sm.load_state_async(run_id)
    if not state:
        print(f"Run '{run_id}' not found.", file=sys.stderr)
        return 1

    print(f"\nRun ID   : {state.run_id}")
    print(f"Workflow : {state.workflow_id}")
    print(f"Status   : {_status_icon(state.status)} {state.status}")
    if state.started_at:
        ended = state.finished_at or time.time()
        print(f"Duration : {_format_duration(ended - state.started_at)}")
    if state.error_message:
        print(f"Error    : {state.error_message[:300]}")

    if state.node_statuses:
        print("\nNode statuses:")
        rows = []
        for nid, ns in state.node_statuses.items():
            rows.append([nid, _status_icon(ns.value) + " " + ns.value])
        _print_table(["Node ID", "Status"], rows)

    logs = await sm.get_logs_async(run_id, limit=20)
    if logs:
        print("\nLast 20 log lines:")
        for lg in logs[-20:]:
            ts = lg.get("timestamp", 0)
            t_str = time.strftime("%H:%M:%S", time.localtime(ts)) if ts else ""
            nid = lg.get("node_id", "")
            lvl = lg.get("level", "INFO")
            msg = lg.get("message", "")[:120]
            print(f"  {t_str} [{nid}] {lvl}: {msg}")

    return 0


async def cmd_logs(
    run_id: str,
    state_dir: str,
    follow: bool,
    tail: int,
    settings_path: str,
) -> int:
    settings = _load_settings(settings_path, state_dir=state_dir)
    from core.state_db import UnifiedStateManager
    sm = UnifiedStateManager.from_settings(settings)

    async def _print_logs(offset: int = 0) -> int:
        logs = await sm.get_logs_async(run_id, limit=tail + offset)
        tail_logs = logs[-tail:] if len(logs) > tail else logs
        for lg in tail_logs:
            ts = lg.get("timestamp", 0)
            t_str = time.strftime("%H:%M:%S", time.localtime(ts)) if ts else ""
            nid = lg.get("node_id", "")
            lvl = lg.get("level", "INFO")
            msg = lg.get("message", "")
            print(f"{t_str} [{nid}] {lvl}: {msg}", flush=True)
        return len(logs)

    count = await _print_logs()

    if not follow:
        return 0

    print("\n--- following (Ctrl+C to stop) ---", flush=True)
    try:
        while True:
            await asyncio.sleep(2.0)
            new_count = await _print_logs(offset=count)
            if new_count > count:
                count = new_count
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass

    return 0
