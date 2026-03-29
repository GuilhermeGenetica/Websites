"""
core/workflow_engine.py
───────────────────────
WorkflowEngine — pure orchestration layer.

Responsabilities kept here:
  • DAG construction & validation
  • Parallel execution loop (asyncio.gather per topological layer)
  • Runner injection (LocalRunner default, SlurmRunner optional)
  • Retry via RetryPolicy / RetryContext
  • Callback management (log + status)
  • State persistence coordination (UnifiedStateManager)

All parameter, I/O and command-building logic stays in:
  • core/param_resolver.py
  • core/io_resolver.py
  • core/command_builder.py
"""

import asyncio
import logging
import time
from typing import Any, Callable, Dict, List, Optional

import networkx as nx

from core.models import (
    ExecutionLog,
    NodeStatus,
    PluginManifest,
    WorkflowDefinition,
    WorkflowNodeDef,
    WorkflowState,
)
from core.plugin_manager import PluginManager
from core.executor import Executor
from core.container_runtime import ContainerRuntime
from core.runner_base import BaseRunner, RunnerResult
from core.runner_local import LocalRunner
from core.retry_policy import RetryContext, RetryPolicy, format_retry_log
from core.state_db import UnifiedStateManager

from core.param_resolver import coerce_params, normalize_paths
from core.io_resolver import expand_batch_for_node, resolve_io_for_execution
from core.command_builder import build_command_for_node, preflight_with_override

logger = logging.getLogger("seqnode.engine")


WORKFLOW_JSON_SCHEMA: Dict[str, Any] = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "SeqNode Workflow",
    "description": "A SeqNode-OS workflow definition.",
    "type": "object",
    "required": ["id", "name", "nodes"],
    "properties": {
        "id":          {"type": "string",  "description": "Unique workflow identifier.", "minLength": 1},
        "name":        {"type": "string",  "description": "Human-readable workflow name.", "minLength": 1},
        "description": {"type": "string",  "description": "Optional workflow description."},
        "version":     {"type": "string",  "description": "Workflow version string (semver recommended).", "default": "1.0.0"},
        "tags":        {"type": "array",   "items": {"type": "string"}},
        "global_params": {"type": "object", "additionalProperties": True},
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "tool_id"],
                "properties": {
                    "id":               {"type": "string",  "minLength": 1},
                    "tool_id":          {"type": "string",  "minLength": 1},
                    "label":            {"type": "string"},
                    "enabled":          {"type": "boolean", "default": True},
                    "edges":            {"type": "array",   "items": {"type": "string"}, "default": []},
                    "params":           {"type": "object",  "additionalProperties": True},
                    "inputs_map":       {"type": "object",  "additionalProperties": {"type": "string"}},
                    "outputs_map":      {"type": "object",  "additionalProperties": {"type": "string"}},
                    "custom_command":   {"type": ["string", "null"]},
                    "runtime_override": {"type": "object",  "additionalProperties": True},
                    "plugin_paths":     {"type": "object",  "additionalProperties": {"type": "string"}},
                    "x":                {"type": "number"},
                    "y":                {"type": "number"},
                    "node_type":        {"type": "string",  "default": "tool"},
                },
                "additionalProperties": True,
            },
        },
    },
    "additionalProperties": True,
}


class WorkflowEngine:

    def __init__(
        self,
        plugin_manager: PluginManager,
        state_dir: str = ".seqnode_state",
        runner: Optional[BaseRunner] = None,
        state_manager: Optional[UnifiedStateManager] = None,
    ):
        self.pm = plugin_manager
        self.container = ContainerRuntime()
        self._runner: BaseRunner = runner or LocalRunner()
        self.executor = Executor(container_runtime=self.container, runner=self._runner)
        self.state_manager: UnifiedStateManager = state_manager or UnifiedStateManager.from_settings({})
        self.dag: Optional[nx.DiGraph] = None
        self.current_state: Optional[WorkflowState] = None
        self._log_callbacks: List[Callable] = []
        self._status_callbacks: List[Callable] = []
        self._cancel_requested = False

    def set_runner(self, runner: BaseRunner) -> None:
        self._runner = runner
        self.executor = Executor(container_runtime=self.container, runner=runner)

    # ── Callback management ───────────────────────────────────────────────

    def add_log_callback(self, callback: Callable) -> None:
        self._log_callbacks.append(callback)

    def remove_log_callback(self, callback: Callable) -> None:
        if callback in self._log_callbacks:
            self._log_callbacks.remove(callback)

    def add_status_callback(self, callback: Callable) -> None:
        self._status_callbacks.append(callback)

    def remove_status_callback(self, callback: Callable) -> None:
        if callback in self._status_callbacks:
            self._status_callbacks.remove(callback)

    async def _emit_log(self, node_id: str, level: str, message: str) -> None:
        if self.current_state:
            self.state_manager.add_log(self.current_state, node_id, level, message)
        for cb in self._log_callbacks:
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(node_id, level, message)
                else:
                    cb(node_id, level, message)
            except Exception:
                pass

    async def _emit_status(self, status: str, run_id: str) -> None:
        for cb in self._status_callbacks:
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(status, run_id)
                else:
                    cb(status, run_id)
            except Exception:
                pass

    # ── DAG construction ──────────────────────────────────────────────────

    def build_dag(self, workflow: WorkflowDefinition) -> nx.DiGraph:
        dag = nx.DiGraph()
        node_map: Dict[str, WorkflowNodeDef] = {}

        for node in workflow.nodes:
            if not node.enabled:
                continue
            plugin = self.pm.get_tool(node.tool_id)
            if not plugin:
                raise ValueError(f"Plugin '{node.tool_id}' not found for node '{node.id}'.")
            dag.add_node(node.id, plugin=plugin, node_def=node)
            node_map[node.id] = node

        for node in workflow.nodes:
            if not node.enabled:
                continue
            for target_id in node.edges:
                if target_id in node_map and node_map[target_id].enabled:
                    dag.add_edge(node.id, target_id)

        if not nx.is_directed_acyclic_graph(dag):
            cycles = list(nx.simple_cycles(dag))
            raise ValueError(f"Circular dependency detected: {cycles}")

        logger.info(f"DAG built: {len(dag.nodes)} nodes, {len(dag.edges)} edges")
        return dag

    # ── Validation ────────────────────────────────────────────────────────

    def validate_workflow(self, workflow: WorkflowDefinition) -> List[str]:
        errors = []
        seen_ids: set = set()
        node_ids = {n.id for n in workflow.nodes}

        for node in workflow.nodes:
            if node.id in seen_ids:
                errors.append(f"Duplicate node id: {node.id}")
            seen_ids.add(node.id)

            plugin = self.pm.get_tool(node.tool_id)
            if not plugin:
                errors.append(f"Node '{node.id}': plugin '{node.tool_id}' not found.")
                continue

            for edge_target in node.edges:
                if edge_target not in node_ids:
                    errors.append(f"Node '{node.id}': edge target '{edge_target}' does not exist.")

            has_predecessor = any(
                node.id in (n2.edges or [])
                for n2 in workflow.nodes
                if n2.id != node.id
            )

            for inp_name, inp_spec in plugin.inputs.items():
                if not inp_spec.required:
                    continue
                if node.custom_command:
                    continue
                mapped_val = node.inputs_map.get(inp_name, "")
                if not mapped_val and not has_predecessor:
                    errors.append(
                        f"Node '{node.id}': required input '{inp_name}' not mapped "
                        f"and no predecessor node to auto-fill from."
                    )

        try:
            self.build_dag(workflow)
        except ValueError as e:
            errors.append(str(e))

        return errors

    @staticmethod
    def validate_workflow_basic(workflow_dict: Dict[str, Any]) -> Dict[str, Any]:
        errors = []
        if not workflow_dict.get("id"):
            errors.append("Workflow 'id' is required.")
        if not workflow_dict.get("name"):
            errors.append("Workflow 'name' is required.")

        nodes = workflow_dict.get("nodes", [])
        if not isinstance(nodes, list):
            errors.append("Workflow 'nodes' must be an array.")
            return {"valid": False, "errors": errors}

        seen_ids: set = set()
        node_ids = {n.get("id") for n in nodes if isinstance(n, dict) and n.get("id")}

        for node in nodes:
            if not isinstance(node, dict):
                errors.append("Each node must be an object.")
                continue
            node_id = node.get("id")
            if not node_id:
                errors.append("A node is missing the 'id' field.")
            elif node_id in seen_ids:
                errors.append(f"Duplicate node id: '{node_id}'.")
            else:
                seen_ids.add(node_id)
            if not node.get("tool_id"):
                errors.append(f"Node '{node_id or '?'}': 'tool_id' is required.")
            for edge_target in node.get("edges", []):
                if edge_target not in node_ids:
                    errors.append(f"Node '{node_id}': edge target '{edge_target}' does not exist.")

        return {"valid": len(errors) == 0, "errors": errors}

    # ── Pre-flight ────────────────────────────────────────────────────────

    def preflight_check(self, workflow: WorkflowDefinition) -> List[Dict[str, Any]]:
        # When using RunnerAgent, tools run on the user's machine — skip VPS-side binary checks.
        from core.runner_agent import RunnerAgent as _RA
        if isinstance(self._runner, _RA):
            return []

        issues = []
        seen_tools: set = set()
        for node in workflow.nodes:
            if not node.enabled:
                continue
            plugin = self.pm.get_tool(node.tool_id)
            if not plugin:
                continue
            issue = preflight_with_override(node, plugin, self.executor)
            if issue and plugin.id not in seen_tools:
                issues.append(issue)
            seen_tools.add(plugin.id)
        return issues

    # ── Parallel execution helpers ────────────────────────────────────────

    def _can_run(self, node_id: str, state: WorkflowState) -> bool:
        for pred in self.dag.predecessors(node_id):
            pred_status = state.node_statuses.get(pred)
            if pred_status not in (NodeStatus.COMPLETED, NodeStatus.SKIPPED):
                return False
        return True

    def _should_skip(self, node_id: str, state: WorkflowState) -> bool:
        for pred in self.dag.predecessors(node_id):
            pred_status = state.node_statuses.get(pred)
            if pred_status in (NodeStatus.FAILED, NodeStatus.CANCELLED):
                return True
        return False

    async def _execute_layer(
        self,
        layer: List[str],
        state: WorkflowState,
        settings: Dict[str, Any],
    ) -> None:
        runnable = []
        for node_id in layer:
            if state.node_statuses.get(node_id) == NodeStatus.COMPLETED:
                await self._emit_log(node_id, "INFO", "Already completed (resumed). Skipping.")
                continue
            if self._should_skip(node_id, state):
                state.node_statuses[node_id] = NodeStatus.SKIPPED
                await self._emit_log(node_id, "WARN", "Skipped due to upstream failure.")
                continue
            runnable.append(node_id)

        if runnable:
            await asyncio.gather(
                *[self._execute_single_node(nid, state, settings) for nid in runnable]
            )

    async def _execute_single_node(
        self,
        node_id: str,
        state: WorkflowState,
        settings: Dict[str, Any],
    ) -> None:
        if self._cancel_requested:
            state.node_statuses[node_id] = NodeStatus.CANCELLED
            await self._emit_log(node_id, "WARN", "Cancelled by user request.")
            return

        node_data = self.dag.nodes[node_id]
        plugin: PluginManifest = node_data["plugin"]
        node_def: WorkflowNodeDef = node_data["node_def"]

        state.node_statuses[node_id] = NodeStatus.RUNNING
        self.state_manager.save_state(state)
        await self._emit_log(node_id, "INFO", f"Starting: {plugin.name} [{plugin.id}]")

        retry_policy = RetryPolicy.from_node_def(node_def)
        retry_ctx = RetryContext()
        predecessors = list(self.dag.predecessors(node_id))

        while True:
            try:
                exec_result = await self._run_node_command(
                    node_id, node_def, plugin, state, predecessors, settings
                )
            except Exception as exc:
                state.node_statuses[node_id] = NodeStatus.FAILED
                state.error_message = str(exc)
                await self._emit_log(node_id, "ERROR", f"Exception: {exc}")
                self.state_manager.save_state(state)
                return

            if exec_result is None:
                self.state_manager.save_state(state)
                return

            if exec_result.success:
                self.state_manager.save_state(state)
                return

            if retry_policy.should_retry(exec_result, retry_ctx.attempt):
                delay = retry_policy.next_delay(retry_ctx.attempt)
                log_msg = format_retry_log(node_id, retry_ctx.attempt + 1, retry_policy.max_retries, delay, exec_result)
                await self._emit_log(node_id, "WARN", log_msg)
                retry_ctx.increment(exec_result)
                await asyncio.sleep(delay)
            else:
                self.state_manager.save_state(state)
                return

    async def _run_node_command(
        self,
        node_id: str,
        node_def: WorkflowNodeDef,
        plugin: PluginManifest,
        state: WorkflowState,
        predecessors: List[str],
        settings: Dict[str, Any],
    ) -> Optional[RunnerResult]:
        from core.executor import ExecutionResult

        resolved_params = coerce_params(node_def.params, plugin)
        dir_inputs = expand_batch_for_node(node_def, plugin)

        # ── Resolve working dir and run mode from settings ──
        exec_cfg = settings.get("execution") or {}
        global_conda_path = exec_cfg.get("conda_path", "")

        # Working dir: node param → settings dirs.working → empty
        effective_workdir = ""
        node_workdir = (node_def.params or {}).get("workdir", "")
        if isinstance(node_workdir, str) and node_workdir.strip():
            effective_workdir = node_workdir.strip()
        else:
            settings_working = (settings.get("dirs") or {}).get("working", "")
            if isinstance(settings_working, str) and settings_working.strip():
                effective_workdir = settings_working.strip()

        # Run mode: node conda_env → settings global → system
        effective_run_mode = "system"
        effective_conda_env = ""
        effective_conda_path = global_conda_path

        node_conda = (node_def.params or {}).get("conda_env", "")
        if isinstance(node_conda, str) and node_conda.strip():
            effective_run_mode = "conda"
            effective_conda_env = node_conda.strip()
        else:
            global_mode = exec_cfg.get("run_mode", "system")
            global_conda = exec_cfg.get("conda_env", "")
            if global_mode == "conda":
                effective_run_mode = "conda"
                effective_conda_env = global_conda.strip() if global_conda.strip() else "base"

        if effective_workdir:
            await self._emit_log(node_id, "INFO", f"Working directory: {effective_workdir}")
        if effective_run_mode == "conda":
            await self._emit_log(node_id, "INFO", f"Conda environment: {effective_conda_env}")

        if dir_inputs:
            batch_size = max(len(v) for v in dir_inputs.values())
            await self._emit_log(node_id, "INFO",
                f"Directory-mode detected. Batch size: {batch_size} file(s).")
            batch_outputs: Dict[str, List[str]] = {}
            node_failed = False

            for file_index in range(batch_size):
                if self._cancel_requested:
                    await self._emit_log(node_id, "WARN", f"Batch cancelled at item {file_index}.")
                    node_failed = True
                    break

                resolved_inputs, resolved_outputs = resolve_io_for_execution(
                    node_def=node_def, plugin=plugin, state=state,
                    predecessors=predecessors, settings=settings,
                    file_index=file_index, dir_inputs=dir_inputs,
                )
                resolved_inputs  = normalize_paths(resolved_inputs)
                resolved_outputs = normalize_paths(resolved_outputs)
                resolved_p       = normalize_paths(resolved_params)

                await self._emit_log(node_id, "INFO",
                    f"[Batch {file_index + 1}/{batch_size}] Inputs: {resolved_inputs} | Outputs: {resolved_outputs}")

                command = build_command_for_node(node_def, plugin, resolved_p, resolved_inputs, resolved_outputs, self.executor)

                async def log_cb_batch(nid, level, msg, _idx=file_index, _sz=batch_size):
                    await self._emit_log(nid, level, f"[{_idx+1}/{_sz}] {msg}")

                exec_result: ExecutionResult = await self.executor.execute_async(
                    command=command, node_id=node_id, log_callback=log_cb_batch,
                    working_dir=effective_workdir,
                    run_mode=effective_run_mode,
                    conda_env=effective_conda_env,
                    conda_path=effective_conda_path,
                )

                if exec_result.success:
                    for out_key, out_val in resolved_outputs.items():
                        batch_outputs.setdefault(out_key, []).append(out_val)
                    await self._emit_log(node_id, "INFO",
                        f"[Batch {file_index + 1}/{batch_size}] Completed in {exec_result.duration_seconds:.1f}s.")
                else:
                    err_msg = exec_result.stderr[-300:] if exec_result.stderr else "Unknown error"
                    await self._emit_log(node_id, "ERROR",
                        f"[Batch {file_index + 1}/{batch_size}] Failed (exit={exec_result.returncode}): {err_msg}")
                    node_failed = True
                    if exec_result.tool_missing:
                        break

            if node_failed and not batch_outputs:
                state.node_statuses[node_id] = NodeStatus.FAILED
                state.error_message = "All batch items failed."
            else:
                state.node_statuses[node_id] = NodeStatus.COMPLETED
                merged_outputs: Dict[str, str] = {k: ";".join(v) for k, v in batch_outputs.items()}
                state.node_outputs[node_id] = merged_outputs
                n_ok = len(next(iter(batch_outputs.values()), []))
                await self._emit_log(node_id, "INFO",
                    f"Batch completed: {n_ok}/{batch_size} items succeeded. Outputs: {merged_outputs}")
            return None

        else:
            resolved_inputs, resolved_outputs = resolve_io_for_execution(
                node_def=node_def, plugin=plugin, state=state,
                predecessors=predecessors, settings=settings,
                file_index=0, dir_inputs=None,
            )
            resolved_inputs  = normalize_paths(resolved_inputs)
            resolved_outputs = normalize_paths(resolved_outputs)
            resolved_p       = normalize_paths(resolved_params)

            await self._emit_log(node_id, "INFO", f"Resolved inputs:  {resolved_inputs}")
            await self._emit_log(node_id, "INFO", f"Resolved outputs: {resolved_outputs}")
            await self._emit_log(node_id, "INFO", f"Resolved params:  {resolved_p}")

            command = build_command_for_node(node_def, plugin, resolved_p, resolved_inputs, resolved_outputs, self.executor)
            await self._emit_log(node_id, "INFO", f"Command: {command}")

            async def log_cb(nid, level, msg):
                await self._emit_log(nid, level, msg)

            exec_result: ExecutionResult = await self.executor.execute_async(
                command=command, node_id=node_id, log_callback=log_cb,
                working_dir=effective_workdir,
                run_mode=effective_run_mode,
                conda_env=effective_conda_env,
                conda_path=effective_conda_path,
            )

            if exec_result.success:
                state.node_statuses[node_id] = NodeStatus.COMPLETED
                state.node_outputs[node_id]  = resolved_outputs
                await self._emit_log(node_id, "INFO",
                    f"Completed in {exec_result.duration_seconds:.1f}s (exit code 0)")
            else:
                state.node_statuses[node_id] = NodeStatus.FAILED
                err_msg = exec_result.stderr[-500:] if exec_result.stderr else "Unknown error"
                state.error_message = err_msg
                tool_txt = " Tool not found." if exec_result.tool_missing else ""
                await self._emit_log(node_id, "ERROR",
                    f"Failed (exit={exec_result.returncode}):{tool_txt} {err_msg[:200]}")
                await self._emit_log(node_id, "ERROR", f"Full stderr: {exec_result.stderr}")

            from core.runner_base import RunnerResult as RR
            return RR(
                returncode=exec_result.returncode,
                stdout=exec_result.stdout,
                stderr=exec_result.stderr,
                duration_seconds=exec_result.duration_seconds,
                success=exec_result.success,
                tool_missing=exec_result.tool_missing,
                command=command,
                node_id=node_id,
            )

    # ── Main execution loop ───────────────────────────────────────────────

    async def execute_workflow(
        self,
        workflow: WorkflowDefinition,
        resume_from: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None,
    ) -> WorkflowState:
        self._cancel_requested = False
        self.dag = self.build_dag(workflow)
        settings = settings or {}

        state = WorkflowState(workflow_id=workflow.id)
        state.started_at = time.time()
        state.status = "RUNNING"

        layers = list(nx.topological_generations(self.dag))
        all_node_ids = [nid for layer in layers for nid in layer]

        for node_id in all_node_ids:
            state.node_statuses[node_id] = NodeStatus.PENDING

        if resume_from:
            old_state = self.state_manager.load_state(resume_from)
            if old_state:
                state.run_id = old_state.run_id
                for nid, ns in old_state.node_statuses.items():
                    if ns == NodeStatus.COMPLETED:
                        state.node_statuses[nid] = NodeStatus.COMPLETED
                        if nid in old_state.node_outputs:
                            state.node_outputs[nid] = old_state.node_outputs[nid]
                state.logs = old_state.logs

        self.current_state = state
        await self._emit_status("RUNNING", state.run_id)

        preflight_issues = self.preflight_check(workflow)
        if preflight_issues:
            for issue in preflight_issues:
                await self._emit_log(issue["node_id"], "WARN",
                    f"Pre-flight: {issue['plugin_name']} - {issue['message']}")
            await self._emit_log("engine", "WARN",
                f"Pre-flight found {len(preflight_issues)} issue(s). Execution will continue.")

        exec_order_str = " -> ".join(all_node_ids)
        await self._emit_log("engine", "INFO", f"Execution started. Order: {exec_order_str}")

        for layer in layers:
            if self._cancel_requested:
                for nid in layer:
                    if state.node_statuses.get(nid) == NodeStatus.PENDING:
                        state.node_statuses[nid] = NodeStatus.CANCELLED
                        await self._emit_log(nid, "WARN", "Cancelled by user request.")
                continue
            await self._execute_layer(list(layer), state, settings)
            self.state_manager.save_state(state)

        all_completed = all(s == NodeStatus.COMPLETED for s in state.node_statuses.values())
        any_failed    = any(s == NodeStatus.FAILED    for s in state.node_statuses.values())

        if all_completed:
            state.status = "COMPLETED"
        elif any_failed:
            state.status = "FAILED"
        elif self._cancel_requested:
            state.status = "CANCELLED"
        else:
            state.status = "COMPLETED"

        state.finished_at = time.time()
        self.state_manager.save_state(state)

        duration = state.finished_at - state.started_at
        await self._emit_log("engine", "INFO", f"Workflow {state.status} in {duration:.1f}s")
        await self._emit_status(state.status, state.run_id)

        return state

    # ── Utilities ─────────────────────────────────────────────────────────

    def cancel(self) -> None:
        self._cancel_requested = True
        for node_id in list(self.executor._active_processes.keys()):
            asyncio.ensure_future(self.executor.cancel_node(node_id))

    def get_execution_order(self, workflow: WorkflowDefinition) -> List[str]:
        dag = self.build_dag(workflow)
        return list(nx.topological_sort(dag))

    def get_execution_layers(self, workflow: WorkflowDefinition) -> List[List[str]]:
        dag = self.build_dag(workflow)
        return [list(layer) for layer in nx.topological_generations(dag)]

    @staticmethod
    def get_workflow_schema() -> Dict[str, Any]:
        return WORKFLOW_JSON_SCHEMA
