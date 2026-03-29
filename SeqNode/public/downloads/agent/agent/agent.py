#!/usr/bin/env python3
"""
agent.py — SeqNode Agent CLI entry point

Usage:
  seqnode-agent init   --server <url> --token <token> [--workspace <dir>] [--label <name>]
  seqnode-agent start  [--daemon]
  seqnode-agent stop
  seqnode-agent status
  seqnode-agent info

The agent opens a reverse WebSocket connection to the SeqNode server,
receives pipeline commands, executes them locally, and streams logs back.
"""

import argparse
import asyncio
import json
import logging
import os
import platform
import signal
import sys
from pathlib import Path

import config
import monitor
import ws_client

# ── Logging setup ─────────────────────────────────────────────────────────────
def _setup_logging(log_dir: str, verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    fmt   = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    handlers = [logging.StreamHandler(sys.stdout)]

    if log_dir:
        os.makedirs(log_dir, exist_ok=True)
        handlers.append(logging.FileHandler(os.path.join(log_dir, "agent.log")))

    logging.basicConfig(level=level, format=fmt, handlers=handlers)


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_init(args):
    cfg = config.load()
    if args.server:
        cfg["server_url"] = args.server
    if args.token:
        cfg["token"] = args.token
    if args.workspace:
        cfg["workspace"] = str(Path(args.workspace).resolve())
    if args.label:
        cfg["label"] = args.label

    # Create workspace directory
    workspace = cfg.get("workspace", "")
    if workspace:
        Path(workspace).mkdir(parents=True, exist_ok=True)

    config.save(cfg)
    print("✔  Configuration saved.")
    print(f"   Server    : {cfg['server_url']}")
    print(f"   Workspace : {cfg['workspace']}")
    print(f"   Config    : {config.CONFIG_FILE}")
    print()
    print("Run  seqnode-agent start  to connect.")


def cmd_status(args):
    cfg = config.load()
    pid_file = config.CONFIG_DIR / "agent.pid"

    if not config.is_configured():
        print("✘  Not configured. Run:  seqnode-agent init --server <url> --token <token>")
        return

    snap = monitor.snapshot(cfg.get("workspace", ""))
    print(f"Server    : {cfg['server_url']}")
    print(f"Token     : {cfg['token'][:12]}…" if cfg.get("token") else "Token     : (not set)")
    print(f"Workspace : {cfg.get('workspace')}")
    print(f"Hostname  : {snap['hostname']}")
    print(f"OS        : {snap['os']}")
    print(f"CPU cores : {snap['cpu_cores']}")
    print(f"RAM avail : {snap.get('ram_avail_gb', '?')} GB")
    print(f"Disk free : {snap.get('disk_free_gb', '?')} GB")

    if pid_file.exists():
        pid = pid_file.read_text().strip()
        try:
            os.kill(int(pid), 0)
            print(f"\n● Agent is RUNNING  (PID {pid})")
        except (ProcessLookupError, ValueError):
            print("\n○ Agent is NOT running (stale PID file)")
    else:
        print("\n○ Agent is NOT running")


def cmd_stop(args):
    pid_file = config.CONFIG_DIR / "agent.pid"
    if not pid_file.exists():
        print("Agent is not running (no PID file).")
        return
    pid = int(pid_file.read_text().strip())
    try:
        os.kill(pid, signal.SIGTERM)
        pid_file.unlink(missing_ok=True)
        print(f"✔  Agent (PID {pid}) stopped.")
    except ProcessLookupError:
        pid_file.unlink(missing_ok=True)
        print("Agent was not running (stale PID file removed).")
    except Exception as e:
        print(f"✘  Could not stop agent: {e}")


def cmd_info(args):
    snap = monitor.snapshot()
    print(json.dumps(snap, indent=2))


def cmd_start(args):
    cfg = config.load()

    if not config.is_configured():
        print("✘  Not configured. Run:  seqnode-agent init --server <url> --token <token>")
        sys.exit(1)

    _setup_logging(cfg.get("log_dir", ""), verbose=args.verbose)
    logger = logging.getLogger("seqnode.agent")

    if args.daemon and sys.platform != "win32":
        _daemonize(cfg)
        return

    # ── Write PID file ──
    pid_file = config.CONFIG_DIR / "agent.pid"
    pid_file.write_text(str(os.getpid()))

    def _cleanup(*_):
        pid_file.unlink(missing_ok=True)
        sys.exit(0)

    signal.signal(signal.SIGTERM, _cleanup)
    signal.signal(signal.SIGINT,  _cleanup)

    client = ws_client.AgentClient(cfg)

    logger.info(f"SeqNode Agent v{config.VERSION} starting…")
    logger.info(f"Server    : {cfg['server_url']}")
    logger.info(f"Workspace : {cfg.get('workspace')}")

    try:
        asyncio.run(client.run_forever())
    except KeyboardInterrupt:
        pass
    finally:
        pid_file.unlink(missing_ok=True)
        logger.info("Agent stopped.")


def _daemonize(cfg: dict):
    """Fork into background (Unix only)."""
    pid = os.fork()
    if pid > 0:
        print(f"✔  Agent started in background (PID {pid}).")
        sys.exit(0)

    os.setsid()
    pid2 = os.fork()
    if pid2 > 0:
        sys.exit(0)

    # Redirect stdio
    for fd in (sys.stdin, sys.stdout, sys.stderr):
        try:
            fd.flush()
        except Exception:
            pass
    devnull = open(os.devnull, "r+b")
    for fd_no in (0, 1, 2):
        os.dup2(devnull.fileno(), fd_no)

    # ── Write PID ──
    pid_file = config.CONFIG_DIR / "agent.pid"
    pid_file.write_text(str(os.getpid()))

    _setup_logging(cfg.get("log_dir", ""))
    client = ws_client.AgentClient(cfg)
    asyncio.run(client.run_forever())
    pid_file.unlink(missing_ok=True)


# ── CLI parser ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        prog="seqnode-agent",
        description="SeqNode Agent — local execution bridge for SeqNode-OS pipelines",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # init
    p_init = sub.add_parser("init", help="Configure the agent")
    p_init.add_argument("--server",    required=True,  help="WebSocket server URL (wss://...)")
    p_init.add_argument("--token",     required=True,  help="Agent token from SeqNode web panel")
    p_init.add_argument("--workspace", default="",     help="Local working directory for pipeline files")
    p_init.add_argument("--label",     default="",     help="Human-readable label for this agent")

    # start
    p_start = sub.add_parser("start", help="Start the agent")
    p_start.add_argument("--daemon",  action="store_true", help="Run in background (Unix only)")
    p_start.add_argument("--verbose", action="store_true", help="Debug logging")

    # stop
    sub.add_parser("stop",   help="Stop a running background agent")

    # status
    sub.add_parser("status", help="Show agent configuration and status")

    # info
    sub.add_parser("info",   help="Print system resource snapshot as JSON")

    args = parser.parse_args()
    {
        "init":   cmd_init,
        "start":  cmd_start,
        "stop":   cmd_stop,
        "status": cmd_status,
        "info":   cmd_info,
    }[args.command](args)


if __name__ == "__main__":
    main()
