#!/usr/bin/env python3
"""
cli_main.py — SeqNode-OS CLI entry point.

Usage:
    python -m core.cli_main --help
    seqnode run workflow.json
    seqnode validate workflow.json
    seqnode plugins list
    seqnode status
"""

import argparse
import asyncio
import sys

from core.cli_commands import (
    cmd_logs,
    cmd_plugins_list,
    cmd_plugins_show,
    cmd_run,
    cmd_status,
    cmd_validate,
)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="seqnode",
        description="SeqNode-OS — Bioinformatics Workflow Orchestrator",
    )
    parser.add_argument(
        "--settings",
        default="_seqnode_settings.json",
        metavar="FILE",
        help="Path to settings JSON file (default: _seqnode_settings.json)",
    )
    parser.add_argument(
        "--state-dir",
        default=".seqnode_state",
        metavar="DIR",
        help="Directory for state files (default: .seqnode_state)",
    )
    parser.add_argument(
        "--plugins-dir",
        default=".",
        metavar="DIR",
        help="Plugins directory (default: current directory)",
    )

    sub = parser.add_subparsers(dest="command", metavar="COMMAND")

    p_run = sub.add_parser("run", help="Execute a workflow")
    p_run.add_argument("workflow", metavar="WORKFLOW_FILE", help="Path to workflow JSON")
    p_run.add_argument("--resume", metavar="RUN_ID", default=None, help="Resume from existing run ID")
    p_run.add_argument("--dry-run", action="store_true", help="Validate only; do not execute")
    p_run.add_argument("--runner", choices=["local", "slurm"], default=None, help="Override runner type")

    p_val = sub.add_parser("validate", help="Validate a workflow definition")
    p_val.add_argument("workflow", metavar="WORKFLOW_FILE", help="Path to workflow JSON")

    p_pl = sub.add_parser("plugins", help="Manage plugins")
    pl_sub = p_pl.add_subparsers(dest="plugins_cmd", metavar="ACTION")

    p_pl_list = pl_sub.add_parser("list", help="List available plugins")
    p_pl_list.add_argument("--category", default=None, help="Filter by category")

    p_pl_show = pl_sub.add_parser("show", help="Show plugin details")
    p_pl_show.add_argument("plugin_id", metavar="PLUGIN_ID")

    p_status = sub.add_parser("status", help="Show run status")
    p_status.add_argument("run_id", metavar="RUN_ID", nargs="?", default=None,
                          help="Run ID to inspect (omit to list all runs)")

    p_logs = sub.add_parser("logs", help="Show logs for a run")
    p_logs.add_argument("run_id", metavar="RUN_ID")
    p_logs.add_argument("--tail", type=int, default=50, help="Number of lines to show (default: 50)")
    p_logs.add_argument("--follow", action="store_true", help="Follow log output")

    return parser


def main(argv=None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command is None:
        parser.print_help()
        return 0

    settings_path = args.settings
    state_dir     = args.state_dir
    plugins_dir   = args.plugins_dir

    if args.command == "run":
        return asyncio.run(cmd_run(
            workflow_file=args.workflow,
            resume=args.resume,
            dry_run=args.dry_run,
            plugins_dir=plugins_dir,
            state_dir=state_dir,
            settings_path=settings_path,
            runner_override=getattr(args, "runner", None),
        ))

    elif args.command == "validate":
        return cmd_validate(
            workflow_file=args.workflow,
            plugins_dir=plugins_dir,
        )

    elif args.command == "plugins":
        if args.plugins_cmd == "list":
            return cmd_plugins_list(category=args.category, plugins_dir=plugins_dir)
        elif args.plugins_cmd == "show":
            return cmd_plugins_show(plugin_id=args.plugin_id, plugins_dir=plugins_dir)
        else:
            print("Usage: seqnode plugins [list|show]")
            return 1

    elif args.command == "status":
        return asyncio.run(cmd_status(
            run_id=args.run_id,
            state_dir=state_dir,
            settings_path=settings_path,
        ))

    elif args.command == "logs":
        return asyncio.run(cmd_logs(
            run_id=args.run_id,
            state_dir=state_dir,
            follow=args.follow,
            tail=args.tail,
            settings_path=settings_path,
        ))

    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
