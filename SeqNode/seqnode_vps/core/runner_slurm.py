from __future__ import annotations

import asyncio
import os
import re
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from core.runner_base import BaseRunner, LogCallback, RunnerResult


@dataclass
class SlurmJobState:
    job_id: str
    node_id: str
    script_path: str
    stdout_path: str
    stderr_path: str
    slurm_state: str = "PENDING"


_TERMINAL_STATES = {"COMPLETED", "FAILED", "CANCELLED", "TIMEOUT", "NODE_FAIL", "OUT_OF_MEMORY"}
_RUNNING_STATES  = {"RUNNING", "COMPLETING"}


class SlurmRunner(BaseRunner):

    def __init__(
        self,
        partition: str = "batch",
        time_limit: str = "24:00:00",
        cpus_per_task: int = 1,
        mem_gb: int = 4,
        working_dir_base: str = "/tmp/seqnode_slurm",
        extra_headers: Optional[List[str]] = None,
        poll_interval_s: float = 10.0,
    ):
        self._partition = partition
        self._time_limit = time_limit
        self._cpus = cpus_per_task
        self._mem_gb = mem_gb
        self._working_dir_base = working_dir_base
        self._extra_headers = extra_headers or []
        self._poll_interval = poll_interval_s
        self._active_jobs: Dict[str, SlurmJobState] = {}

    @property
    def name(self) -> str:
        return "slurm"

    def is_available(self) -> bool:
        return shutil.which("sbatch") is not None

    def cancel(self, node_id: str) -> None:
        job = self._active_jobs.get(node_id)
        if job:
            try:
                subprocess.run(
                    ["scancel", job.job_id],
                    capture_output=True,
                    timeout=10,
                )
            except Exception:
                pass
            finally:
                self._active_jobs.pop(node_id, None)

    def _write_job_script(self, node_id: str, command: str, run_dir: str) -> str:
        stdout_path = os.path.join(run_dir, f"{node_id}.out")
        stderr_path = os.path.join(run_dir, f"{node_id}.err")
        script_path = os.path.join(run_dir, f"{node_id}.sh")

        lines = [
            "#!/bin/bash",
            f"#SBATCH --job-name=seqnode_{node_id}",
            f"#SBATCH --output={stdout_path}",
            f"#SBATCH --error={stderr_path}",
            f"#SBATCH --cpus-per-task={self._cpus}",
            f"#SBATCH --mem={self._mem_gb}G",
            f"#SBATCH --time={self._time_limit}",
            f"#SBATCH --partition={self._partition}",
        ]
        for header in self._extra_headers:
            lines.append(f"#SBATCH {header}")
        lines.extend(["", "set -euo pipefail", "", command, ""])

        with open(script_path, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines))
        os.chmod(script_path, 0o755)
        return script_path

    def _submit_job(self, script_path: str) -> str:
        result = subprocess.run(
            ["sbatch", script_path],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise RuntimeError(f"sbatch failed: {result.stderr.strip()}")
        match = re.search(r"Submitted batch job (\d+)", result.stdout)
        if not match:
            raise RuntimeError(f"Could not parse job ID from sbatch output: {result.stdout!r}")
        return match.group(1)

    def _poll_job_state(self, job_id: str) -> str:
        result = subprocess.run(
            ["squeue", "-j", job_id, "-h", "-o", "%T"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return "COMPLETED"
        return result.stdout.strip()

    def _get_exit_code(self, job_id: str) -> int:
        result = subprocess.run(
            ["sacct", "-j", job_id, "--format=ExitCode", "-n", "--noheader"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return -1
        raw = result.stdout.strip().split()[0]
        try:
            return int(raw.split(":")[0])
        except (ValueError, IndexError):
            return -1

    def _read_file_safe(self, path: str) -> str:
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as fh:
                return fh.read()
        except FileNotFoundError:
            return ""

    async def execute_async(
        self,
        command: str,
        node_id: str = "",
        log_callback: Optional[LogCallback] = None,
        timeout: Optional[float] = None,
    ) -> RunnerResult:
        start_time = time.time()
        run_dir = os.path.join(self._working_dir_base, node_id)
        os.makedirs(run_dir, exist_ok=True)

        stdout_path = os.path.join(run_dir, f"{node_id}.out")
        stderr_path = os.path.join(run_dir, f"{node_id}.err")

        try:
            script_path = self._write_job_script(node_id, command, run_dir)
            await self._safe_callback(log_callback, node_id, "INFO", f"[SLURM] Submitting job script: {script_path}")

            try:
                job_id = await asyncio.get_event_loop().run_in_executor(None, self._submit_job, script_path)
            except RuntimeError as exc:
                return RunnerResult.from_exception(command, node_id, exc, time.time() - start_time)

            await self._safe_callback(log_callback, node_id, "INFO", f"[SLURM] Job submitted: {job_id}")

            job_state = SlurmJobState(
                job_id=job_id,
                node_id=node_id,
                script_path=script_path,
                stdout_path=stdout_path,
                stderr_path=stderr_path,
            )
            self._active_jobs[node_id] = job_state

            deadline = (start_time + timeout) if timeout else None
            last_log_pos = 0

            while True:
                if deadline and time.time() > deadline:
                    self.cancel(node_id)
                    duration = time.time() - start_time
                    return RunnerResult.from_timeout(command, node_id, duration)

                await asyncio.sleep(self._poll_interval)

                slurm_state = await asyncio.get_event_loop().run_in_executor(
                    None, self._poll_job_state, job_id
                )
                job_state.slurm_state = slurm_state
                await self._safe_callback(log_callback, node_id, "INFO", f"[SLURM] State: {slurm_state}")

                new_stdout = self._read_file_safe(stdout_path)
                if len(new_stdout) > last_log_pos:
                    for line in new_stdout[last_log_pos:].splitlines():
                        if line.strip():
                            await self._safe_callback(log_callback, node_id, "INFO", line)
                    last_log_pos = len(new_stdout)

                if slurm_state in _TERMINAL_STATES:
                    break

            exit_code = await asyncio.get_event_loop().run_in_executor(
                None, self._get_exit_code, job_id
            )
            stdout_str = self._read_file_safe(stdout_path)
            stderr_str = self._read_file_safe(stderr_path)
            success = slurm_state == "COMPLETED" and exit_code == 0
            duration = time.time() - start_time

            if not success and stderr_str:
                await self._safe_callback(log_callback, node_id, "STDERR", stderr_str[-500:])

            return RunnerResult(
                returncode=exit_code,
                stdout=stdout_str,
                stderr=stderr_str,
                duration_seconds=duration,
                success=success,
                tool_missing=exit_code == 127,
                command=command,
                node_id=node_id,
                extra={"slurm_job_id": job_id, "slurm_final_state": slurm_state},
            )

        except Exception as exc:
            return RunnerResult.from_exception(command, node_id, exc, time.time() - start_time)

        finally:
            self._active_jobs.pop(node_id, None)
