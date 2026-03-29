from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from core.runner_base import RunnerResult


@dataclass
class RetryPolicy:
    max_retries: int = 0
    initial_delay_s: float = 5.0
    backoff_multiplier: float = 2.0
    retry_on_exit_codes: List[int] = field(default_factory=lambda: [-1, 1, 137])
    retry_on_tool_missing: bool = False

    @classmethod
    def from_node_def(cls, node_def: Any) -> "RetryPolicy":
        retry_cfg: Dict = {}
        if hasattr(node_def, "params") and isinstance(node_def.params, dict):
            retry_cfg = node_def.params.get("retry", {})
        if not retry_cfg and hasattr(node_def, "runtime_override") and isinstance(node_def.runtime_override, dict):
            retry_cfg = node_def.runtime_override.get("retry", {})
        if not retry_cfg:
            return cls()
        return cls(
            max_retries=int(retry_cfg.get("max_retries", 0)),
            initial_delay_s=float(retry_cfg.get("initial_delay_s", 5.0)),
            backoff_multiplier=float(retry_cfg.get("backoff_multiplier", 2.0)),
            retry_on_exit_codes=list(retry_cfg.get("retry_on_exit_codes", [-1, 1, 137])),
            retry_on_tool_missing=bool(retry_cfg.get("retry_on_tool_missing", False)),
        )

    @classmethod
    def default(cls) -> "RetryPolicy":
        return cls()

    def should_retry(self, result: RunnerResult, attempt: int) -> bool:
        if attempt >= self.max_retries:
            return False
        if result.tool_missing and not self.retry_on_tool_missing:
            return False
        return result.returncode in self.retry_on_exit_codes

    def next_delay(self, attempt: int) -> float:
        return self.initial_delay_s * (self.backoff_multiplier ** attempt)


@dataclass
class RetryContext:
    attempt: int = 0
    history: List[RunnerResult] = field(default_factory=list)

    def increment(self, result: Optional[RunnerResult] = None) -> None:
        if result is not None:
            self.history.append(result)
        self.attempt += 1

    def reset(self) -> None:
        self.attempt = 0
        self.history.clear()

    @property
    def last_result(self) -> Optional[RunnerResult]:
        return self.history[-1] if self.history else None


def format_retry_log(
    node_id: str,
    attempt: int,
    max_retries: int,
    delay: float,
    result: RunnerResult,
) -> str:
    return (
        f"Node {node_id}: attempt {attempt}/{max_retries} failed "
        f"(exit={result.returncode}). "
        f"Retrying in {delay:.1f}s..."
    )
