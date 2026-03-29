from __future__ import annotations

import asyncio
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Callable, Dict, Optional


@dataclass
class RunnerResult:
    returncode: int = -1
    stdout: str = ""
    stderr: str = ""
    duration_seconds: float = 0.0
    success: bool = False
    tool_missing: bool = False
    command: str = ""
    node_id: str = ""
    extra: Dict = field(default_factory=dict)

    @classmethod
    def from_timeout(cls, command: str, node_id: str, duration: float) -> "RunnerResult":
        return cls(
            returncode=-9,
            stdout="",
            stderr="TIMEOUT: Process killed after timeout",
            duration_seconds=duration,
            success=False,
            tool_missing=False,
            command=command,
            node_id=node_id,
        )

    @classmethod
    def from_exception(cls, command: str, node_id: str, exc: Exception, duration: float) -> "RunnerResult":
        return cls(
            returncode=-1,
            stdout="",
            stderr=str(exc),
            duration_seconds=duration,
            success=False,
            tool_missing=False,
            command=command,
            node_id=node_id,
        )


LogCallback = Callable[[str, str, str], None]


class BaseRunner(ABC):

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    async def execute_async(
        self,
        command: str,
        node_id: str = "",
        log_callback: Optional[LogCallback] = None,
        timeout: Optional[float] = None,
    ) -> RunnerResult:
        ...

    @abstractmethod
    def cancel(self, node_id: str) -> None:
        ...

    @abstractmethod
    def is_available(self) -> bool:
        ...

    async def _safe_callback(
        self,
        log_callback: Optional[LogCallback],
        node_id: str,
        level: str,
        message: str,
    ) -> None:
        if log_callback is None:
            return
        try:
            result = log_callback(node_id, level, message)
            if asyncio.iscoroutine(result):
                await result
        except Exception:
            pass
