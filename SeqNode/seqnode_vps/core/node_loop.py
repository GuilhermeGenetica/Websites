from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from core.node_base import BaseNodeHandler, NodeContext, NodeResult, register_handler

logger = logging.getLogger("seqnode.node_loop")


def _resolve_items(items_source: Any, state: Any) -> List[Any]:
    if isinstance(items_source, list):
        return items_source

    if isinstance(items_source, str):
        if items_source.startswith("$ref:"):
            ref = items_source[5:].strip()
            parts = ref.split(".", 1)
            if len(parts) == 2:
                nid, key = parts
                raw = state.node_outputs.get(nid, {}).get(key, "")
            else:
                outputs = state.node_outputs.get(parts[0], {})
                raw = list(outputs.values())[0] if outputs else ""
            if isinstance(raw, list):
                return raw
            if isinstance(raw, str) and ";" in raw:
                return [v.strip() for v in raw.split(";") if v.strip()]
            return [raw] if raw else []

        if ";" in items_source:
            return [v.strip() for v in items_source.split(";") if v.strip()]
        if "," in items_source:
            return [v.strip() for v in items_source.split(",") if v.strip()]
        return [items_source] if items_source else []

    if isinstance(items_source, dict):
        start = int(items_source.get("start", 0))
        stop  = int(items_source.get("stop", 0))
        step  = int(items_source.get("step", 1))
        return list(range(start, stop, step))

    return []


@register_handler("loop")
class LoopNodeHandler(BaseNodeHandler):

    @property
    def node_type(self) -> str:
        return "loop"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        node_def = ctx.node_def
        node_id  = node_def.id
        state    = ctx.state
        params   = node_def.params

        items_source = params.get("items", [])
        items = _resolve_items(items_source, state)

        if not items:
            await ctx.emit_log("WARN", f"[Loop] No items to iterate over in node '{node_id}'.")
            return NodeResult.ok({"loop_count": "0"})

        max_iterations: int = int(params.get("max_iterations", 1000))
        items = items[:max_iterations]

        item_var: str = params.get("item_var", "item")
        index_var: str = params.get("index_var", "index")
        loop_body_node: Optional[str] = params.get("body_node", None)
        parallel: bool = bool(params.get("parallel", False))
        fail_fast: bool = bool(params.get("fail_fast", True))

        await ctx.emit_log("INFO", f"[Loop] Iterating over {len(items)} items. Parallel={parallel}.")

        all_outputs: Dict[str, List[str]] = {}
        failed_count = 0

        async def _run_iteration(index: int, item: Any) -> Optional[NodeResult]:
            iter_state_patch = {
                item_var: str(item),
                index_var: str(index),
                "loop_total": str(len(items)),
            }
            await ctx.emit_log("INFO", f"[Loop] Iteration {index + 1}/{len(items)}: {item_var}={item}")

            if loop_body_node and hasattr(ctx, "_engine") and ctx._engine is not None:
                engine = ctx._engine
                if engine.dag and loop_body_node in engine.dag.nodes:
                    body_node_data = engine.dag.nodes[loop_body_node]
                    body_node_def  = body_node_data["node_def"]
                    body_plugin    = body_node_data["plugin"]

                    patched_params = dict(body_node_def.params)
                    patched_params.update(iter_state_patch)

                    from core.node_base import NodeContext as NC
                    body_ctx = NC(
                        node_def=type(body_node_def)(**{
                            **body_node_def.model_dump(),
                            "params": patched_params,
                        }),
                        plugin=body_plugin,
                        state=state,
                        settings=ctx.settings,
                        predecessors=[node_id],
                        log_callback=ctx.log_callback,
                        dag=ctx.dag,
                    )
                    body_ctx._executor = getattr(ctx, "_executor", None)
                    body_ctx._engine   = engine

                    from core.node_base import get_node_handler
                    body_type = getattr(body_node_def, "node_type", "tool") or "tool"
                    handler = get_node_handler(body_type)
                    return await handler.execute(body_ctx)

            return NodeResult.ok({item_var: str(item), index_var: str(index)})

        if parallel:
            tasks = [_run_iteration(i, item) for i, item in enumerate(items)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            results = []
            for i, item in enumerate(items):
                try:
                    result = await _run_iteration(i, item)
                    results.append(result)
                    if result and not result.success and fail_fast:
                        await ctx.emit_log("ERROR", f"[Loop] Iteration {i + 1} failed. fail_fast=True, stopping.")
                        failed_count += 1
                        break
                except Exception as exc:
                    results.append(exc)
                    if fail_fast:
                        await ctx.emit_log("ERROR", f"[Loop] Iteration {i + 1} raised exception: {exc}. Stopping.")
                        failed_count += 1
                        break

        for i, res in enumerate(results):
            if isinstance(res, Exception):
                failed_count += 1
                await ctx.emit_log("ERROR", f"[Loop] Iteration {i + 1} exception: {res}")
            elif isinstance(res, NodeResult):
                if not res.success:
                    failed_count += 1
                else:
                    for k, v in res.outputs.items():
                        all_outputs.setdefault(k, []).append(v)

        merged: Dict[str, str] = {k: ";".join(v) for k, v in all_outputs.items()}
        merged["loop_count"] = str(len(items))
        merged["loop_failed"] = str(failed_count)

        if failed_count > 0 and fail_fast:
            return NodeResult.fail(f"Loop had {failed_count} failed iteration(s).")

        await ctx.emit_log("INFO", f"[Loop] Done. {len(items) - failed_count}/{len(items)} iterations succeeded.")
        return NodeResult.ok(merged)
