from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, Optional

from core.node_base import BaseNodeHandler, NodeContext, NodeResult, register_handler

logger = logging.getLogger("seqnode.node_pause")

_PAUSE_APPROVALS: Dict[str, bool] = {}
_PAUSE_EVENTS: Dict[str, asyncio.Event] = {}


def approve_pause(run_id: str, node_id: str, approved: bool = True) -> None:
    key = f"{run_id}:{node_id}"
    _PAUSE_APPROVALS[key] = approved
    event = _PAUSE_EVENTS.get(key)
    if event:
        event.set()


def get_pending_pauses() -> Dict[str, Dict[str, Any]]:
    pending = {}
    for key, event in _PAUSE_EVENTS.items():
        if not event.is_set():
            run_id, node_id = key.split(":", 1)
            pending[key] = {"run_id": run_id, "node_id": node_id, "waiting": True}
    return pending


@register_handler("pause")
class PauseNodeHandler(BaseNodeHandler):

    @property
    def node_type(self) -> str:
        return "pause"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        node_def = ctx.node_def
        node_id  = node_def.id
        state    = ctx.state
        params   = node_def.params

        run_id: str = state.run_id
        message: str = params.get("message", f"Workflow paused at node '{node_id}'. Awaiting manual approval.")
        timeout_s: Optional[float] = params.get("timeout_s", None)
        auto_approve: bool = params.get("auto_approve", False)

        key = f"{run_id}:{node_id}"
        event = asyncio.Event()
        _PAUSE_EVENTS[key] = event
        _PAUSE_APPROVALS.pop(key, None)

        await ctx.emit_log("WARN", f"[Pause] {message}")
        await ctx.emit_log("WARN", f"[Pause] Waiting for approval. Key: {key}")
        await ctx.emit_log("WARN", "[Pause] Use API endpoint POST /api/runs/{run_id}/nodes/{node_id}/approve or approve_pause() to continue.")

        if auto_approve:
            await ctx.emit_log("INFO", "[Pause] auto_approve=True, continuing immediately.")
            _PAUSE_EVENTS.pop(key, None)
            return NodeResult.ok({"approved": "true", "auto": "true"})

        try:
            if timeout_s:
                try:
                    await asyncio.wait_for(event.wait(), timeout=float(timeout_s))
                except asyncio.TimeoutError:
                    _PAUSE_EVENTS.pop(key, None)
                    _PAUSE_APPROVALS.pop(key, None)
                    timeout_action = params.get("on_timeout", "fail")
                    if timeout_action == "skip":
                        await ctx.emit_log("WARN", f"[Pause] Timeout after {timeout_s}s — skipping.")
                        return NodeResult.skipped(f"Pause timeout after {timeout_s}s")
                    elif timeout_action == "continue":
                        await ctx.emit_log("WARN", f"[Pause] Timeout after {timeout_s}s — continuing (auto-approve).")
                        return NodeResult.ok({"approved": "false", "timeout": "true"})
                    else:
                        return NodeResult.fail(f"Pause timeout after {timeout_s}s with no approval.")
            else:
                await event.wait()

            approved = _PAUSE_APPROVALS.get(key, True)
            _PAUSE_EVENTS.pop(key, None)
            _PAUSE_APPROVALS.pop(key, None)

            if approved:
                await ctx.emit_log("INFO", "[Pause] Approved. Continuing workflow.")
                return NodeResult.ok({"approved": "true"})
            else:
                await ctx.emit_log("WARN", "[Pause] Rejected. Workflow will fail.")
                return NodeResult.fail("Pause node was explicitly rejected.")

        except asyncio.CancelledError:
            _PAUSE_EVENTS.pop(key, None)
            _PAUSE_APPROVALS.pop(key, None)
            raise
