from __future__ import annotations

import asyncio
import shutil
import time
from typing import Dict, Optional

from core.runner_base import BaseRunner, LogCallback, RunnerResult


class LocalRunner(BaseRunner):

    def __init__(self, shell: str = "/bin/bash"):
        self._shell = shell
        self._active_processes: Dict[str, asyncio.subprocess.Process] = {}

    @property
    def name(self) -> str:
        return "local"

    def is_available(self) -> bool:
        return True

    def cancel(self, node_id: str) -> None:
        proc = self._active_processes.get(node_id)
        if proc:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            finally:
                self._active_processes.pop(node_id, None)

    async def execute_async(
        self,
        command: str,
        node_id: str = "",
        log_callback: Optional[LogCallback] = None,
        timeout: Optional[float] = None,
        working_dir: Optional[str] = None,
        run_mode: Optional[str] = None,
        conda_env: Optional[str] = None,
        conda_path: Optional[str] = None,
    ) -> RunnerResult:
        start_time = time.time()
        stdout_lines: list[str] = []
        stderr_lines: list[str] = []

        # ── Resolve working_dir ──
        import os
        import tempfile
        import shutil

        effective_cwd = None
        if working_dir and working_dir.strip():
            expanded = os.path.expanduser(working_dir.strip())
            if os.path.isdir(expanded):
                effective_cwd = expanded
            else:
                await self._safe_callback(
                    log_callback, node_id, "WARN",
                    f"Working directory '{expanded}' does not exist. "
                    f"Falling back to server working directory."
                )

        # ── Conda wrapping ──
        if run_mode == "conda" and conda_env and conda_env.strip():
            env_name = conda_env.strip()

            # Resolve o binário conda/mamba
            if conda_path and conda_path.strip():
                conda_bin = os.path.expanduser(conda_path.strip())
                # Se é um directório, procurar conda/mamba dentro dele
                if os.path.isdir(conda_bin):
                    if os.path.isfile(os.path.join(conda_bin, "mamba")):
                        conda_bin = os.path.join(conda_bin, "mamba")
                    elif os.path.isfile(os.path.join(conda_bin, "conda")):
                        conda_bin = os.path.join(conda_bin, "conda")
                    else:
                        conda_bin = os.path.join(conda_bin, "conda")
            else:
                # Auto-detect: prefere mamba, fallback conda
                conda_bin = "mamba" if shutil.which("mamba") else "conda"

            # Wrap o comando — SEMPRE com bash -c, NUNCA com --no-capture-output.
            #
            # Porquê sem --no-capture-output:
            #   Com essa flag, conda/mamba gera um script temporário que executa:
            #     exec -- <comando> [args...]
            #   O builtin exec do bash NÃO suporta "--" como terminador de opções,
            #   logo "exec: --: invalid option" (exit 2) em qualquer comando com flags.
            #
            # Porquê bash -c:
            #   Garante que o comando corre dentro do shell do ambiente conda,
            #   com PERL5LIB / PATH / LD_LIBRARY_PATH correctos do env.
            safe_cmd = command.replace("'", "'\\''")
            command = f"{conda_bin} run -n {env_name} bash -c '{safe_cmd}'"

            await self._safe_callback(
                log_callback, node_id, "INFO",
                f"[conda] Running in environment: {env_name} (binary: {conda_bin})"
            )

        # ── Multi-line: escrever script temporário ──
        script_file = None
        actual_command = command

        if '\n' in command.strip():
            try:
                fd, script_file = tempfile.mkstemp(
                    suffix='.sh', prefix=f'seqnode_{node_id}_'
                )
                with os.fdopen(fd, 'w') as f:
                    f.write('#!/bin/bash\nset -e\n')
                    f.write(command)
                    f.write('\n')
                os.chmod(script_file, 0o755)
                actual_command = script_file
            except Exception as exc:
                await self._safe_callback(
                    log_callback, node_id, "WARN",
                    f"Could not create temp script, running inline: {exc}"
                )
                lines = [l.strip() for l in command.strip().split('\n') if l.strip()]
                actual_command = ' && '.join(lines)

        try:
            process = await asyncio.create_subprocess_shell(
                actual_command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                executable=self._shell,
                cwd=effective_cwd,
            )
            self._active_processes[node_id] = process

            async def _read_stream(stream, collector, level: str):
                async for raw in stream:
                    line = raw.decode("utf-8", errors="replace").rstrip()
                    collector.append(line)
                    await self._safe_callback(log_callback, node_id, level, line)

            read_task = asyncio.gather(
                _read_stream(process.stdout, stdout_lines, "INFO"),
                _read_stream(process.stderr, stderr_lines, "STDERR"),
            )

            if timeout:
                try:
                    await asyncio.wait_for(
                        asyncio.gather(read_task, process.wait()),
                        timeout=timeout,
                    )
                except asyncio.TimeoutError:
                    process.kill()
                    duration = time.time() - start_time
                    self._active_processes.pop(node_id, None)
                    return RunnerResult.from_timeout(command, node_id, duration)
            else:
                await read_task
                await process.wait()

            returncode = process.returncode
            stdout_str = "\n".join(stdout_lines)
            stderr_str = "\n".join(stderr_lines)
            success = returncode == 0
            tool_missing = returncode == 127

            if tool_missing:
                missing = self._extract_missing_tool(stderr_str)
                if missing:
                    stderr_str += (
                        f"\n\n[SeqNode] Tool '{missing}' is not installed or not in PATH.\n"
                        f"Install it with one of:\n"
                        f"  conda install -c bioconda {missing}\n"
                        f"  sudo apt install {missing}\n"
                        f"  pip install {missing}\n"
                        f"Or use Runtime Override (node properties) to set the binary path directly."
                    )

            return RunnerResult(
                returncode=returncode,
                stdout=stdout_str,
                stderr=stderr_str,
                duration_seconds=time.time() - start_time,
                success=success,
                tool_missing=tool_missing,
                command=command,
                node_id=node_id,
            )

        except Exception as exc:
            duration = time.time() - start_time
            return RunnerResult.from_exception(command, node_id, exc, duration)

        finally:
            self._active_processes.pop(node_id, None)
            if script_file:
                try:
                    os.unlink(script_file)
                except Exception:
                    pass

    @staticmethod
    def _extract_missing_tool(stderr: str) -> Optional[str]:
        if not stderr:
            return None
        for line in stderr.split("\n"):
            if "command not found" in line:
                parts = line.split(":")
                for i, part in enumerate(parts):
                    if "command not found" in part and i > 0:
                        candidate = parts[i - 1].strip()
                        if candidate and not candidate.startswith("line"):
                            return candidate
        return None