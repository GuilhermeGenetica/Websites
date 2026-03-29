#!/usr/bin/env python3
import argparse
import json
import asyncio
import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.plugin_manager import PluginManager
from core.workflow_engine import WorkflowEngine
from core.models import WorkflowDefinition, NodeStatus


def print_header():
    print("=" * 70)
    print("  SeqNode-OS  |  Bioinformatics Workflow Orchestrator")
    print("=" * 70)


def cmd_list_plugins(args):
    pm = PluginManager(plugins_dir=args.plugins)
    print(f"\nLoaded {len(pm.tools)} plugin(s) from: {args.plugins}\n")
    for cat in pm.list_categories():
        print(f"  [{cat}]")
        for tool in pm.list_tools(category=cat):
            print(f"    - {tool.id:30s} {tool.name} (v{tool.version})")
    print()


def cmd_validate(args):
    pm = PluginManager(plugins_dir=args.plugins)
    engine = WorkflowEngine(plugin_manager=pm, state_dir=args.state_dir)

    with open(args.workflow_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        wf = WorkflowDefinition(nodes=[dict(n) for n in data])
    else:
        wf = WorkflowDefinition(**data)

    errors = engine.validate_workflow(wf)
    if errors:
        print(f"\nValidation FAILED with {len(errors)} error(s):")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nValidation PASSED. Workflow is ready for execution.")
        order = engine.get_execution_order(wf)
        print(f"Execution order: {' -> '.join(order)}")


def cmd_run(args):
    pm = PluginManager(plugins_dir=args.plugins)
    engine = WorkflowEngine(plugin_manager=pm, state_dir=args.state_dir)

    with open(args.workflow_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        wf = WorkflowDefinition(nodes=[dict(n) for n in data])
    else:
        wf = WorkflowDefinition(**data)

    errors = engine.validate_workflow(wf)
    if errors:
        print(f"\nValidation FAILED:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    def sync_log_cb(node_id, level, message):
        ts = time.strftime("%H:%M:%S")
        prefix = f"[{ts}] [{node_id}]"
        if level == "ERROR":
            print(f"{prefix} ERROR: {message}")
        elif level == "WARN":
            print(f"{prefix} WARN: {message}")
        else:
            print(f"{prefix} {message}")

    engine.add_log_callback(sync_log_cb)

    print(f"\nStarting workflow execution...")
    state = asyncio.run(engine.execute_workflow(wf, resume_from=args.resume))

    print(f"\n{'=' * 50}")
    print(f"Workflow Status: {state.status}")
    print(f"Run ID: {state.run_id}")
    if state.started_at and state.finished_at:
        dur = state.finished_at - state.started_at
        print(f"Duration: {dur:.1f}s")
    print(f"\nNode Statuses:")
    for node_id, status in state.node_statuses.items():
        icon = {"COMPLETED": "+", "FAILED": "X", "SKIPPED": "-", "CANCELLED": "!"}
        mark = icon.get(status.value, "?")
        print(f"  [{mark}] {node_id}: {status.value}")


def cmd_runs(args):
    from core.state_manager import StateManager
    sm = StateManager(state_dir=args.state_dir)
    runs = sm.list_runs()
    if not runs:
        print("\nNo execution runs found.")
        return
    print(f"\n{'Run ID':30s} {'Status':12s} {'Workflow ID':20s}")
    print("-" * 65)
    for r in runs:
        print(f"{r['run_id']:30s} {r['status']:12s} {r['workflow_id']:20s}")


def cmd_serve(args):
    import uvicorn
    print(f"\nStarting SeqNode-OS server at http://{args.host}:{args.port}")
    os.environ["SEQNODE_PLUGINS_DIR"] = os.path.abspath(args.plugins)
    os.environ["SEQNODE_STATE_DIR"] = os.path.abspath(args.state_dir)
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    uvicorn.run("api.main:app", host=args.host, port=args.port, reload=False)


def cmd_template(args):
    pm = PluginManager(plugins_dir=args.plugins)
    print(pm.export_plugin_template())


def main():
    print_header()
    parser = argparse.ArgumentParser(description="SeqNode-OS CLI")
    parser.add_argument(
        "--plugins",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "plugins")),
        help="Path to plugins directory",
    )
    parser.add_argument(
        "--state-dir",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".seqnode_state")),
        help="Path to state directory",
    )

    sub = parser.add_subparsers(dest="command", help="Available commands")

    sub_list = sub.add_parser("plugins", help="List available plugins")

    sub_validate = sub.add_parser("validate", help="Validate a workflow file")
    sub_validate.add_argument("workflow_file", type=str)

    sub_run = sub.add_parser("run", help="Execute a workflow")
    sub_run.add_argument("workflow_file", type=str)
    sub_run.add_argument("--resume", type=str, default=None, help="Resume from run ID")

    sub_runs = sub.add_parser("runs", help="List execution history")

    sub_serve = sub.add_parser("serve", help="Start the API/GUI server")
    sub_serve.add_argument("--host", type=str, default="127.0.0.1")
    sub_serve.add_argument("--port", type=int, default=8000)

    sub_tpl = sub.add_parser("template", help="Print a plugin YAML template")

    args = parser.parse_args()

    if args.command == "plugins":
        cmd_list_plugins(args)
    elif args.command == "validate":
        cmd_validate(args)
    elif args.command == "run":
        cmd_run(args)
    elif args.command == "runs":
        cmd_runs(args)
    elif args.command == "serve":
        cmd_serve(args)
    elif args.command == "template":
        cmd_template(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
