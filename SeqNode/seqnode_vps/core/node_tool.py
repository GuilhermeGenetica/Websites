from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from core.node_base import BaseNodeHandler, NodeContext, NodeResult, register_handler
from core.models import NodeStatus

logger = logging.getLogger("seqnode.node_tool")


def _resolve_working_dir(node_def, settings: Dict[str, Any]) -> str:
    """
    Resolve o directório de trabalho efectivo para um nó:
      1. workdir explícito nos params do nó (ex: shell_cmd)
      2. dirs.working das settings globais (fallback)
      3. string vazia = herda o cwd do servidor (último recurso)
    """
    node_workdir = (node_def.params or {}).get("workdir", "")
    if isinstance(node_workdir, str) and node_workdir.strip():
        return node_workdir.strip()

    settings_working = (settings.get("dirs") or {}).get("working", "")
    if isinstance(settings_working, str) and settings_working.strip():
        return settings_working.strip()

    return ""


def _resolve_run_mode(node_def, settings: Dict[str, Any]) -> Tuple[str, str, str]:
    """
    Resolve o modo de execução, conda env e conda path.
    Prioridade:
      1. conda_env explícito nos params do nó → modo conda (prioridade máxima)
      2. execution.run_mode + execution.conda_env das settings globais
      3. "system" sem conda (default)
    Se run_mode == "conda" mas conda_env está vazio, usa "base" como fallback.
    Retorna (run_mode, conda_env, conda_path)
    """
    exec_cfg = settings.get("execution") or {}
    global_conda_path = exec_cfg.get("conda_path", "")

    # 1. Param do nó (conda_env do shell_cmd ou qualquer plugin)
    node_conda = (node_def.params or {}).get("conda_env", "")
    if isinstance(node_conda, str) and node_conda.strip():
        return ("conda", node_conda.strip(), global_conda_path)

    # 2. Settings globais
    global_mode = exec_cfg.get("run_mode", "system")
    global_conda = exec_cfg.get("conda_env", "")

    if global_mode == "conda":
        env_name = global_conda.strip() if global_conda.strip() else "base"
        return ("conda", env_name, global_conda_path)

    # 3. Default
    return ("system", "", "")


@register_handler("tool")
class ToolNodeHandler(BaseNodeHandler):

    @property
    def node_type(self) -> str:
        return "tool"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        node_def = ctx.node_def
        plugin   = ctx.plugin
        state    = ctx.state
        settings = ctx.settings

        if not hasattr(ctx, "_executor"):
            return NodeResult.fail("ToolNodeHandler requires ctx._executor (set by engine).")

        executor = ctx._executor
        predecessors = ctx.predecessors

        from core.param_resolver import coerce_params, normalize_paths
        from core.io_resolver import expand_batch_for_node, resolve_io_for_execution
        from core.command_builder import build_command_for_node
        from core.executor import ExecutionResult

        resolved_params = coerce_params(node_def.params, plugin)
        dir_inputs = expand_batch_for_node(node_def, plugin)

        # ── Resolve working dir: nó → settings → vazio ──
        effective_workdir = _resolve_working_dir(node_def, settings)

        # ── Resolve run mode: nó conda_env → settings global → system ──
        effective_run_mode, effective_conda_env, effective_conda_path = _resolve_run_mode(node_def, settings)

        if dir_inputs:
            return await self._execute_batch(
                ctx, executor, node_def, plugin, state, predecessors, settings,
                resolved_params, dir_inputs, effective_workdir,
                effective_run_mode, effective_conda_env, effective_conda_path,
            )
        else:
            return await self._execute_single(
                ctx, executor, node_def, plugin, state, predecessors, settings,
                resolved_params, effective_workdir,
                effective_run_mode, effective_conda_env, effective_conda_path,
            )

    async def _execute_batch(
        self,
        ctx: NodeContext,
        executor,
        node_def,
        plugin,
        state,
        predecessors: List[str],
        settings: Dict[str, Any],
        resolved_params: Dict[str, Any],
        dir_inputs: Dict[str, List[str]],
        effective_workdir: str,
        effective_run_mode: str,
        effective_conda_env: str,
        effective_conda_path: str,
    ) -> NodeResult:
        from core.param_resolver import normalize_paths
        from core.io_resolver import resolve_io_for_execution
        from core.command_builder import build_command_for_node

        node_id = node_def.id
        batch_size = max(len(v) for v in dir_inputs.values())
        await ctx.emit_log("INFO",
            f"Directory-mode detected. Batch size: {batch_size} file(s). "
            f"Dir inputs: { {k: len(v) for k, v in dir_inputs.items()} }")

        if effective_workdir:
            await ctx.emit_log("INFO", f"Working directory: {effective_workdir}")
        if effective_run_mode == "conda":
            await ctx.emit_log("INFO", f"Conda environment: {effective_conda_env}")
            if effective_conda_path:
                await ctx.emit_log("INFO", f"Conda binary: {effective_conda_path}")

        batch_outputs: Dict[str, List[str]] = {}
        node_failed = False

        for file_index in range(batch_size):
            resolved_inputs, resolved_outputs = resolve_io_for_execution(
                node_def=node_def, plugin=plugin, state=state,
                predecessors=predecessors, settings=settings,
                file_index=file_index, dir_inputs=dir_inputs,
            )
            resolved_inputs  = normalize_paths(resolved_inputs)
            resolved_outputs = normalize_paths(resolved_outputs)
            resolved_p       = normalize_paths(resolved_params)

            await ctx.emit_log("INFO",
                f"[Batch {file_index + 1}/{batch_size}] "
                f"Inputs: {resolved_inputs} | Outputs: {resolved_outputs}")

            command = build_command_for_node(node_def, plugin, resolved_p, resolved_inputs, resolved_outputs, executor)

            async def log_cb_batch(nid, level, msg, _idx=file_index, _sz=batch_size):
                if ctx.log_callback:
                    import asyncio
                    res = ctx.log_callback(nid, level, f"[{_idx+1}/{_sz}] {msg}")
                    if asyncio.iscoroutine(res):
                        await res

            exec_result = await executor.execute_async(
                command=command, node_id=node_id, log_callback=log_cb_batch,
                working_dir=effective_workdir,
                run_mode=effective_run_mode,
                conda_env=effective_conda_env,
                conda_path=effective_conda_path,
            )

            if exec_result.success:
                for out_key, out_val in resolved_outputs.items():
                    batch_outputs.setdefault(out_key, []).append(out_val)
                await ctx.emit_log("INFO",
                    f"[Batch {file_index + 1}/{batch_size}] Completed in {exec_result.duration_seconds:.1f}s.")
            else:
                err_msg = exec_result.stderr[-300:] if exec_result.stderr else "Unknown error"
                await ctx.emit_log("ERROR",
                    f"[Batch {file_index + 1}/{batch_size}] Failed (exit={exec_result.returncode}): {err_msg}")
                node_failed = True
                if exec_result.tool_missing:
                    break

        if node_failed and not batch_outputs:
            return NodeResult.fail("All batch items failed.")

        merged_outputs: Dict[str, str] = {k: ";".join(v) for k, v in batch_outputs.items()}
        n_ok = len(next(iter(batch_outputs.values()), []))
        await ctx.emit_log("INFO",
            f"Batch completed: {n_ok}/{batch_size} items succeeded. Outputs propagated: {merged_outputs}")
        return NodeResult.ok(merged_outputs)

    async def _execute_single(
        self,
        ctx: NodeContext,
        executor,
        node_def,
        plugin,
        state,
        predecessors: List[str],
        settings: Dict[str, Any],
        resolved_params: Dict[str, Any],
        effective_workdir: str,
        effective_run_mode: str,
        effective_conda_env: str,
        effective_conda_path: str,
    ) -> NodeResult:
        from core.param_resolver import normalize_paths
        from core.io_resolver import resolve_io_for_execution
        from core.command_builder import build_command_for_node

        node_id = node_def.id

        resolved_inputs, resolved_outputs = resolve_io_for_execution(
            node_def=node_def, plugin=plugin, state=state,
            predecessors=predecessors, settings=settings,
            file_index=0, dir_inputs=None,
        )
        resolved_inputs  = normalize_paths(resolved_inputs)
        resolved_outputs = normalize_paths(resolved_outputs)
        resolved_p       = normalize_paths(resolved_params)

        await ctx.emit_log("INFO", f"Resolved inputs:  {resolved_inputs}")
        await ctx.emit_log("INFO", f"Resolved outputs: {resolved_outputs}")
        await ctx.emit_log("INFO", f"Resolved params:  {resolved_p}")
        if effective_workdir:
            await ctx.emit_log("INFO", f"Working directory: {effective_workdir}")
        if effective_run_mode == "conda":
            await ctx.emit_log("INFO", f"Conda environment: {effective_conda_env}")
            if effective_conda_path:
                await ctx.emit_log("INFO", f"Conda binary: {effective_conda_path}")

        command = build_command_for_node(node_def, plugin, resolved_p, resolved_inputs, resolved_outputs, executor)
        await ctx.emit_log("INFO", f"Command: {command}")

        async def log_cb(nid, level, msg):
            if ctx.log_callback:
                import asyncio
                res = ctx.log_callback(nid, level, msg)
                if asyncio.iscoroutine(res):
                    await res

        exec_result = await executor.execute_async(
            command=command, node_id=node_id, log_callback=log_cb,
            working_dir=effective_workdir,
            run_mode=effective_run_mode,
            conda_env=effective_conda_env,
            conda_path=effective_conda_path,
        )

        if exec_result.success:
            await ctx.emit_log("INFO", f"Completed in {exec_result.duration_seconds:.1f}s (exit code 0)")
            return NodeResult.ok(resolved_outputs)
        else:
            err_msg = exec_result.stderr[-500:] if exec_result.stderr else "Unknown error"
            tool_txt = " Tool not found." if exec_result.tool_missing else ""
            await ctx.emit_log("ERROR", f"Failed (exit={exec_result.returncode}):{tool_txt} {err_msg[:200]}")
            await ctx.emit_log("ERROR", f"Full stderr: {exec_result.stderr}")
            return NodeResult.fail(err_msg)