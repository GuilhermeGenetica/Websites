from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Type

logger = logging.getLogger("seqnode.node_base")

_HANDLER_REGISTRY: Dict[str, Type["BaseNodeHandler"]] = {}


def register_handler(node_type: str):
    def decorator(cls: Type["BaseNodeHandler"]) -> Type["BaseNodeHandler"]:
        _HANDLER_REGISTRY[node_type] = cls
        return cls
    return decorator


def get_node_handler(node_type: str) -> "BaseNodeHandler":
    cls = _HANDLER_REGISTRY.get(node_type)
    if cls is None:
        cls = _HANDLER_REGISTRY.get("tool")
    if cls is None:
        raise KeyError(f"No handler registered for node_type='{node_type}' and no 'tool' fallback.")
    return cls()


def auto_register() -> None:
    from core.node_tool import ToolNodeHandler
    if "tool" not in _HANDLER_REGISTRY:
        _HANDLER_REGISTRY["tool"] = ToolNodeHandler

    _optional_types = {
        "subworkflow":  ("core.node_subworkflow", "SubWorkflowNodeHandler"),
        "condition":    ("core.node_condition",   "ConditionNodeHandler"),
        "ai_agent":     ("core.node_ai_agent",    "AIAgentNodeHandler"),
        "pause":        ("core.node_pause",        "PauseNodeHandler"),
        "loop":         ("core.node_loop",         "LoopNodeHandler"),
    }
    for ntype, (module_path, class_name) in _optional_types.items():
        if ntype not in _HANDLER_REGISTRY:
            try:
                import importlib
                mod = importlib.import_module(module_path)
                _HANDLER_REGISTRY[ntype] = getattr(mod, class_name)
            except Exception as exc:
                logger.debug(f"Could not register handler for '{ntype}': {exc}")


@dataclass
class NodeResult:
    success: bool
    outputs: Dict[str, str] = field(default_factory=dict)
    error_message: Optional[str] = None
    skip_downstream: List[str] = field(default_factory=list)
    extra: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def ok(cls, outputs: Optional[Dict[str, str]] = None) -> "NodeResult":
        return cls(success=True, outputs=outputs or {})

    @classmethod
    def fail(cls, error_message: str) -> "NodeResult":
        return cls(success=False, error_message=error_message)

    @classmethod
    def skipped(cls, reason: str = "") -> "NodeResult":
        return cls(success=True, outputs={}, extra={"skipped": True, "reason": reason})


@dataclass
class NodeContext:
    node_def: Any
    plugin: Any
    state: Any
    settings: Dict[str, Any] = field(default_factory=dict)
    predecessors: List[str] = field(default_factory=list)
    log_callback: Optional[Callable] = None
    dag: Any = None

    async def emit_log(self, level: str, message: str) -> None:
        if self.log_callback is None:
            return
        node_id = getattr(self.node_def, "id", "")
        try:
            import asyncio
            result = self.log_callback(node_id, level, message)
            if asyncio.iscoroutine(result):
                await result
        except Exception:
            pass


class BaseNodeHandler(ABC):

    @property
    @abstractmethod
    def node_type(self) -> str:
        ...

    @abstractmethod
    async def execute(self, ctx: NodeContext) -> NodeResult:
        ...

    def can_handle(self, node_type: str) -> bool:
        return node_type == self.node_type
