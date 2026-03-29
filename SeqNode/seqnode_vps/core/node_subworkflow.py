from __future__ import annotations

import json
import logging
from typing import Any, Dict

from core.node_base import BaseNodeHandler, NodeContext, NodeResult, register_handler

logger = logging.getLogger("seqnode.node_subworkflow")


@register_handler("subworkflow")
class SubWorkflowNodeHandler(BaseNodeHandler):

    @property
    def node_type(self) -> str:
        return "subworkflow"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        node_def = ctx.node_def
        node_id  = node_def.id

        workflow_ref: str = node_def.params.get("workflow_ref", "")
        if not workflow_ref:
            return NodeResult.fail(f"Node '{node_id}': 'workflow_ref' param is required for subworkflow node.")

        await ctx.emit_log("INFO", f"[SubWorkflow] Loading sub-workflow: {workflow_ref}")

        try:
            import os
            if not os.path.isabs(workflow_ref):
                base = ctx.settings.get("dirs", {}).get("workflows", ".")
                workflow_ref = os.path.join(base, workflow_ref)

            with open(workflow_ref, "r", encoding="utf-8") as fh:
                wf_dict = json.load(fh)
        except FileNotFoundError:
            return NodeResult.fail(f"Sub-workflow file not found: {workflow_ref}")
        except Exception as exc:
            return NodeResult.fail(f"Failed to load sub-workflow '{workflow_ref}': {exc}")

        from core.models import WorkflowDefinition
        try:
            sub_workflow = WorkflowDefinition(**wf_dict)
        except Exception as exc:
            return NodeResult.fail(f"Invalid sub-workflow definition: {exc}")

        await ctx.emit_log("INFO", f"[SubWorkflow] Starting sub-workflow '{sub_workflow.name}' ({sub_workflow.id})")

        if not hasattr(ctx, "_engine"):
            return NodeResult.fail("SubWorkflowNodeHandler requires ctx._engine.")

        engine = ctx._engine

        param_overrides: Dict[str, Any] = node_def.params.get("params", {})
        input_overrides: Dict[str, Any] = node_def.params.get("inputs", {})

        for sub_node in sub_workflow.nodes:
            if param_overrides:
                sub_node.params.update(param_overrides)
            if input_overrides:
                sub_node.inputs_map.update(input_overrides)

        merged_settings = dict(ctx.settings)
        merged_settings.update(node_def.params.get("settings", {}))

        try:
            sub_state = await engine.execute_workflow(
                workflow=sub_workflow,
                settings=merged_settings,
            )
        except Exception as exc:
            return NodeResult.fail(f"Sub-workflow execution raised exception: {exc}")

        if sub_state.status == "COMPLETED":
            combined_outputs: Dict[str, str] = {}
            for nid, outputs in sub_state.node_outputs.items():
                for out_key, out_val in outputs.items():
                    combined_outputs[f"{nid}.{out_key}"] = out_val
            await ctx.emit_log("INFO", f"[SubWorkflow] Completed: {sub_workflow.id}")
            return NodeResult.ok(combined_outputs)
        else:
            error = sub_state.error_message or f"Sub-workflow finished with status '{sub_state.status}'"
            await ctx.emit_log("ERROR", f"[SubWorkflow] Failed: {error}")
            return NodeResult.fail(error)
