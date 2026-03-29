import asyncio
import logging
import re
import subprocess
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, Optional

from jinja2 import Environment, Undefined

from core.models import PluginManifest
from core.container_runtime import ContainerRuntime
from core.runner_base import BaseRunner, RunnerResult
from core.runner_local import LocalRunner

logger = logging.getLogger("seqnode.executor")


_JINJA_ENV = Environment(
    trim_blocks=True,
    lstrip_blocks=True,
    undefined=Undefined,
    keep_trailing_newline=False,
)

_SIMPLE_VAR_RE = re.compile(r'\{(?![{%#])([A-Za-z_][A-Za-z0-9_]*)\}(?!\})')


def _render_template(template_str: str, variables: Dict[str, Any]) -> str:
    template_str = template_str.replace('{%-', '{%')
    jinja_src = _SIMPLE_VAR_RE.sub(r'{{ \1 }}', template_str)

    try:
        rendered = _JINJA_ENV.from_string(jinja_src).render(**variables)
    except Exception as exc:
        logger.warning(f"Jinja2 render error, falling back to simple substitution: {exc}")
        rendered = template_str
        for key, val in variables.items():
            rendered = rendered.replace(f"{{{key}}}", str(val))
        return rendered

    # ── Detectar se o resultado é um script multi-linha (multi-command) ──
    # Se contém newlines reais vindos do utilizador (ex: cmd com múltiplos
    # comandos), preservar como script bash em vez de juntar com '; '
    stripped = rendered.strip()
    real_lines = [l for l in stripped.split('\n') if l.strip()]

    if len(real_lines) > 1:
        # Multi-linha: preservar como script bash com set -e
        # Limpa espaços extra em cada linha mas mantém a estrutura
        cleaned = '\n'.join(l.strip() for l in real_lines)
        return cleaned

    # Single-line: aplicar a lógica original de compactação
    result = re.sub(r'(?<!\\)[ \t]*\r?\n[ \t]*', '; ', rendered)
    result = re.sub(r'(;\s*){2,}', '; ', result)
    result = result.strip('; ').strip()
    result = re.sub(r'\\\s*\n\s*', ' ', result)
    result = re.sub(r'\\\s+', ' ', result)
    result = re.sub(r'\s\\(?:\s|$)', ' ', result)
    result = re.sub(r'\s+', ' ', result).strip()
    result = result.rstrip('\\').strip()

    return result


@dataclass
class ExecutionResult:
    returncode: int = -1
    stdout: str = ""
    stderr: str = ""
    duration_seconds: float = 0.0
    command: str = ""
    success: bool = False
    tool_missing: bool = False

    @classmethod
    def from_runner_result(cls, rr: RunnerResult) -> "ExecutionResult":
        return cls(
            returncode=rr.returncode,
            stdout=rr.stdout,
            stderr=rr.stderr,
            duration_seconds=rr.duration_seconds,
            command=rr.command,
            success=rr.success,
            tool_missing=rr.tool_missing,
        )


class Executor:

    def __init__(
        self,
        container_runtime: Optional[ContainerRuntime] = None,
        runner: Optional[BaseRunner] = None,
    ):
        self.container = container_runtime or ContainerRuntime()
        self._runner: BaseRunner = runner or LocalRunner()

    @property
    def _active_processes(self) -> Dict:
        if isinstance(self._runner, LocalRunner):
            return self._runner._active_processes
        return {}

    def check_plugin_tool(self, plugin: PluginManifest) -> Dict[str, Any]:
        command_template = (
            plugin.command if isinstance(plugin.command, str)
            else plugin.command.template
        )
        runtime_type = plugin.runtime.type if plugin.runtime else "system"
        return self.container.check_tool_available(command_template, runtime_type)

    def build_raw_command(
        self,
        plugin: PluginManifest,
        params: Dict[str, Any],
        inputs_map: Dict[str, str],
        outputs_map: Dict[str, str],
    ) -> str:
        variables: Dict[str, Any] = {}
        variables.update(params)
        variables.update(inputs_map)
        variables.update(outputs_map)

        template_str = (
            plugin.command
            if isinstance(plugin.command, str)
            else plugin.command.template
        )
        return _render_template(template_str, variables)

    def build_command(
        self,
        plugin: PluginManifest,
        params: Dict[str, Any],
        inputs_map: Dict[str, str],
        outputs_map: Dict[str, str],
    ) -> str:
        command = self.build_raw_command(plugin, params, inputs_map, outputs_map)
        runtime = plugin.runtime
        image   = plugin.container or runtime.image
        wrapped = self.container.wrap_command(
            command=command,
            runtime_type=runtime.type,
            image=image,
            conda_env=runtime.conda_env,
            env_vars=runtime.env_vars or None,
            working_dir=runtime.working_dir,
        )
        return wrapped

    async def execute_async(
        self,
        command: str,
        node_id: str = "",
        log_callback: Optional[Callable] = None,
        timeout: Optional[float] = None,
        working_dir: Optional[str] = None,
        run_mode: Optional[str] = None,
        conda_env: Optional[str] = None,
        conda_path: Optional[str] = None,
    ) -> ExecutionResult:
        runner_result: RunnerResult = await self._runner.execute_async(
            command=command,
            node_id=node_id,
            log_callback=log_callback,
            timeout=timeout,
            working_dir=working_dir,
            run_mode=run_mode,
            conda_env=conda_env,
            conda_path=conda_path,
        )
        return ExecutionResult.from_runner_result(runner_result)

    async def cancel_node(self, node_id: str) -> None:
        self._runner.cancel(node_id)
        logger.info(f"Cancelled execution for node {node_id}")

    def execute_sync(self, command: str) -> ExecutionResult:
        result = ExecutionResult(command=command)
        start_time = time.time()
        try:
            proc = subprocess.run(
                command,
                shell=True,
                executable="/bin/bash",
                capture_output=True,
                text=True,
            )
            result.returncode = proc.returncode
            result.stdout     = proc.stdout
            result.stderr     = proc.stderr
            result.success    = proc.returncode == 0
            if result.returncode == 127:
                result.tool_missing = True
        except Exception as exc:
            result.stderr     = str(exc)
            result.returncode = -1
        finally:
            result.duration_seconds = time.time() - start_time
        return result

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
