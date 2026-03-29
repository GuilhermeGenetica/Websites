"""
core/runner_agent.py — SeqNode Agent Runner

Implements the same BaseRunner interface as LocalRunner and SlurmRunner, but
dispatches commands to the user's connected SeqNode Agent over WebSocket
instead of running them locally on the VPS server.

Usage (in server.py execute endpoint):
    agent_id = agent_manager.get_agent_by_user(user_id)
    if agent_id:
        runner = RunnerAgent(agent_id, engine)
        engine.set_runner(runner)
    await engine.execute_workflow(wf, settings=settings)
    engine.set_runner(LocalRunner())  # restore default after execution
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Optional

from core.runner_base import BaseRunner, LogCallback, RunnerResult
import core.agent_manager as agent_manager

logger = logging.getLogger("seqnode.runner_agent")


class RunnerAgent(BaseRunner):
    """
    Dispatches workflow commands to a remote SeqNode Agent via WebSocket.
    The agent executes the command locally and streams logs back in real time.
    """

    def __init__(self, agent_id: str, engine_ref=None):
        """
        agent_id   — ID of the connected agent session in agent_manager
        engine_ref — reference to the WorkflowEngine (to read current run_id)
        """
        self._agent_id  = agent_id
        self._engine    = engine_ref
        self._cancelled = False

    # ── BaseRunner interface ──────────────────────────────────────────────────

    @property
    def name(self) -> str:
        return "agent"

    def is_available(self) -> bool:
        return agent_manager.get_agent_by_user(0) is not None or (
            self._agent_id in agent_manager._agents
        )

    def cancel(self, node_id: str) -> None:
        self._cancelled = True
        run_id = self._get_run_id()
        asyncio.ensure_future(agent_manager.dispatch(self._agent_id, {
            "type":   "cancel",
            "run_id": run_id,
        }))

    async def execute_async(
        self,
        command:     str,
        node_id:     str = "",
        log_callback: Optional[LogCallback] = None,
        timeout:     Optional[float] = None,
        working_dir: Optional[str]   = None,
        run_mode:    Optional[str]   = None,
        conda_env:   Optional[str]   = None,
        conda_path:  Optional[str]   = None,
    ) -> RunnerResult:
        start    = time.time()
        run_id   = self._get_run_id()
        agent_id = self._agent_id

        # ── Verify agent is still connected ──
        if agent_id not in agent_manager._agents:
            msg = "[agent] Agent disconnected before execution could start."
            await self._safe_callback(log_callback, node_id, "error", msg)
            return RunnerResult(
                returncode=-1, stderr=msg,
                duration_seconds=time.time() - start,
                command=command, node_id=node_id,
            )

        # ── Build execute payload ──
        # Do NOT forward the VPS working_dir (a Linux server path like
        # /home/ubuntu/seqnode/data/working) to the agent — it will fail
        # the sandbox check on the user's machine.  Send an empty string
        # so the agent falls back to its own configured local workspace.
        execute_payload = {
            "run_id":      run_id,
            "node_id":     node_id,
            "command":     command,
            "working_dir": "",
            "timeout":     int(timeout or 0),
        }

        # Pass conda info to agent (agent handles wrapping locally)
        if run_mode == "conda" and conda_env:
            execute_payload["run_mode"]   = run_mode
            execute_payload["conda_env"]  = conda_env
            execute_payload["conda_path"] = conda_path or ""

        # Sign with session HMAC secret
        sig = agent_manager.sign_payload(agent_id, execute_payload)
        execute_payload["hmac"] = sig
        execute_payload["type"] = "execute"

        # ── Subscribe to logs and completion for this node ──
        log_q, completion_fut = agent_manager.subscribe(agent_id, run_id, node_id)

        try:
            # Dispatch command to agent
            ok = await agent_manager.dispatch(agent_id, execute_payload)
            if not ok:
                msg = "[agent] Failed to dispatch command — agent may have disconnected."
                await self._safe_callback(log_callback, node_id, "error", msg)
                return RunnerResult(
                    returncode=-1, stderr=msg,
                    duration_seconds=time.time() - start,
                    command=command, node_id=node_id,
                )

            await self._safe_callback(
                log_callback, node_id, "INFO",
                f"[agent] Dispatched to agent {agent_id[:8]}… ({agent_manager._agents[agent_id].info.get('hostname', '?')})"
            )

            # ── Drain log queue while waiting for completion ──
            max_wait = timeout if timeout and timeout > 0 else 86400  # 24 h default

            async def _consume_logs():
                while not completion_fut.done():
                    try:
                        pkt = await asyncio.wait_for(log_q.get(), timeout=1.0)
                        if pkt.get("type") == "log":
                            level = pkt.get("level", "info").upper()
                            await self._safe_callback(log_callback, node_id, level, pkt.get("message", ""))
                    except asyncio.TimeoutError:
                        continue
                    except asyncio.CancelledError:
                        break

            try:
                await asyncio.wait_for(_consume_logs(), timeout=max_wait)
            except asyncio.TimeoutError:
                await agent_manager.dispatch(agent_id, {"type": "cancel", "run_id": run_id})
                return RunnerResult.from_timeout(command, node_id, time.time() - start)

            # ── Read result ──
            result = completion_fut.result() if completion_fut.done() else {"status": "failed", "exit_code": -1}
            exit_code = int(result.get("exit_code", -1))

            return RunnerResult(
                returncode        = exit_code,
                success           = exit_code == 0,
                tool_missing      = exit_code == 127,
                duration_seconds  = time.time() - start,
                command           = command,
                node_id           = node_id,
            )

        finally:
            agent_manager.unsubscribe(agent_id, run_id, node_id)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _get_run_id(self) -> str:
        if self._engine and hasattr(self._engine, "current_state") and self._engine.current_state:
            return self._engine.current_state.run_id
        return f"run_{os.urandom(4).hex()}"
