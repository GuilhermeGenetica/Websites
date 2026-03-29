from __future__ import annotations

import logging
import operator
import re
from typing import Any, Dict, List

from core.node_base import BaseNodeHandler, NodeContext, NodeResult, register_handler

logger = logging.getLogger("seqnode.node_condition")

_OPS = {
    "==":  operator.eq,
    "!=":  operator.ne,
    ">":   operator.gt,
    ">=":  operator.ge,
    "<":   operator.lt,
    "<=":  operator.le,
    "in":  lambda a, b: a in b,
    "not in": lambda a, b: a not in b,
    "contains": lambda a, b: b in a,
    "startswith": lambda a, b: str(a).startswith(str(b)),
    "endswith": lambda a, b: str(a).endswith(str(b)),
}


def _resolve_value(val: Any, state: Any, predecessors: List[str]) -> Any:
    if not isinstance(val, str):
        return val
    if val.startswith("$ref:"):
        ref = val[5:].strip()
        parts = ref.split(".", 1)
        if len(parts) == 2:
            ref_node, ref_key = parts
        else:
            ref_node, ref_key = parts[0], None
        outputs = state.node_outputs.get(ref_node, {})
        if ref_key:
            return outputs.get(ref_key, "")
        return list(outputs.values())[0] if outputs else ""
    if val.startswith("$param:"):
        return val[7:].strip()
    return val


def _evaluate_condition(condition: Dict[str, Any], state: Any, predecessors: List[str]) -> bool:
    logic = condition.get("logic", "and").lower()
    rules = condition.get("rules", [])

    if not rules:
        expr = condition.get("expression", "")
        if expr:
            return bool(eval(expr, {"__builtins__": {}}, {}))
        return True

    results: List[bool] = []
    for rule in rules:
        left  = _resolve_value(rule.get("left", ""),  state, predecessors)
        right = _resolve_value(rule.get("right", ""), state, predecessors)
        op_str = rule.get("operator", "==")
        op_fn = _OPS.get(op_str)
        if op_fn is None:
            logger.warning(f"Unknown operator '{op_str}' in condition rule, defaulting False.")
            results.append(False)
            continue
        try:
            r_left  = _coerce(left)
            r_right = _coerce(right)
            results.append(op_fn(r_left, r_right))
        except Exception as exc:
            logger.warning(f"Condition evaluation error: {exc}")
            results.append(False)

    if logic == "or":
        return any(results)
    return all(results)


def _coerce(val: Any) -> Any:
    if isinstance(val, str):
        if val.lower() == "true":
            return True
        if val.lower() == "false":
            return False
        try:
            return int(val)
        except ValueError:
            pass
        try:
            return float(val)
        except ValueError:
            pass
    return val


@register_handler("condition")
class ConditionNodeHandler(BaseNodeHandler):

    @property
    def node_type(self) -> str:
        return "condition"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        node_def    = ctx.node_def
        node_id     = node_def.id
        state       = ctx.state
        predecessors = ctx.predecessors

        condition_cfg = node_def.params.get("condition", {})
        if not condition_cfg:
            await ctx.emit_log("WARN", f"[Condition] No condition config for node '{node_id}'. Defaulting to True.")
            result = True
        else:
            try:
                result = _evaluate_condition(condition_cfg, state, predecessors)
            except Exception as exc:
                return NodeResult.fail(f"Condition evaluation raised exception: {exc}")

        branch_true:  List[str] = node_def.params.get("on_true",  [])
        branch_false: List[str] = node_def.params.get("on_false", [])

        await ctx.emit_log("INFO", f"[Condition] Result: {result}")

        skip_nodes: List[str] = []
        if result:
            skip_nodes = branch_false
            await ctx.emit_log("INFO", f"[Condition] Taking TRUE branch. Skipping: {branch_false}")
        else:
            skip_nodes = branch_true
            await ctx.emit_log("INFO", f"[Condition] Taking FALSE branch. Skipping: {branch_true}")

        return NodeResult(
            success=True,
            outputs={"condition_result": str(result)},
            skip_downstream=skip_nodes,
        )
