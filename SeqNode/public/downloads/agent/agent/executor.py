"""
executor.py — Subprocess command execution with real-time log streaming

Runs a shell command in a subprocess, reads stdout/stderr line by line,
and calls back the caller with each line so it can be sent via WebSocket.
"""

import asyncio
import logging
import os
import signal
import sys

logger = logging.getLogger("seqnode.executor")

# Active subprocess (used for cancellation)
_current_proc: asyncio.subprocess.Process | None = None


async def run_command(
    command: str,
    working_dir: str,
    on_log,          # async callable(level: str, line: str)
    timeout: int = 0,
    run_id: str = "",
    node_id: str = "",
    run_mode: str = "",
    conda_env: str = "",
    conda_path: str = "",
) -> int:
    """
    Execute *command* inside a bash shell.
    Streams each stdout/stderr line via on_log("info"/"error", line).
    Returns the exit code.
    """
    global _current_proc

    os.makedirs(working_dir, exist_ok=True)

    # ── Conda wrapping (mirrors LocalRunner logic) ──
    if run_mode == "conda" and conda_env:
        import shutil
        if conda_path:
            conda_bin = conda_path
        else:
            conda_bin = "mamba" if shutil.which("mamba") else "conda"
        safe_cmd = command.replace("'", "'\\''")
        command  = f"{conda_bin} run -n {conda_env} bash -c '{safe_cmd}'"
        await on_log("info", f"[agent] Conda env: {conda_env} (binary: {conda_bin})")

    if sys.platform != "win32":
        shell      = "/bin/bash"
        shell_flag = "-c"
    else:
        # On Windows, only use bash for shebang scripts; use cmd.exe for everything else.
        # Using WSL/Git bash for all commands causes asyncio pipe hangs (WSL keeps pipes open).
        if command.lstrip().startswith("#!"):
            import shutil as _sh
            _bash = _sh.which("bash")
            if _bash:
                shell      = _bash
                shell_flag = "-c"
            else:
                await on_log("error",
                    "[agent] This command requires bash. "
                    "Install Git Bash (https://gitforwindows.org) or WSL and add bash to PATH.")
                return 1
        else:
            shell      = "cmd.exe"
            shell_flag = "/c"

    try:
        proc = await asyncio.create_subprocess_exec(
            shell, shell_flag, command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=working_dir,
        )
        _current_proc = proc

        async def _drain(stream, level: str):
            while True:
                line = await stream.readline()
                if not line:
                    break
                text = line.decode(errors="replace").rstrip("\n")
                await on_log(level, text)

        tasks = [
            asyncio.create_task(_drain(proc.stdout, "info")),
            asyncio.create_task(_drain(proc.stderr, "error")),
        ]

        wait_coro = proc.wait()
        if timeout and timeout > 0:
            try:
                await asyncio.wait_for(wait_coro, timeout=timeout)
            except asyncio.TimeoutError:
                proc.kill()
                await on_log("error", f"[agent] Command timed out after {timeout}s")
                return 124
        else:
            await wait_coro

        await asyncio.gather(*tasks)
        return proc.returncode or 0

    except asyncio.CancelledError:
        if _current_proc:
            try:
                _current_proc.kill()
            except Exception:
                pass
        raise
    except Exception as e:
        await on_log("error", f"[agent] Execution error: {e}")
        return 1
    finally:
        _current_proc = None


def cancel_current():
    """Kill the currently running subprocess (called from WebSocket handler)."""
    global _current_proc
    if _current_proc:
        try:
            if sys.platform == "win32":
                _current_proc.kill()
            else:
                os.killpg(os.getpgid(_current_proc.pid), signal.SIGTERM)
        except Exception:
            try:
                _current_proc.kill()
            except Exception:
                pass
