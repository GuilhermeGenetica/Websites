"""
core/param_resolver.py
──────────────────────
Pure parameter-normalization utilities.
No I/O, no state, no executor dependencies.

Extracted from workflow_engine.py — functions are 100% identical to the originals.
"""

import re
from typing import Dict, Any

from core.models import PluginManifest


def normalize_paths(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize path values in a dict before command execution:
      - Convert Windows backslashes → forward slashes
      - Collapse accidental double slashes
    Skips upstream references ($node.port) and non-string values.
    Preserves trailing slash on directory-mode paths.
    """
    result = {}
    for k, v in d.items():
        if isinstance(v, str) and v and not v.startswith("$"):
            trailing = v.endswith("/") or v.endswith("\\")
            v = v.replace("\\", "/")
            v = re.sub(r"(?<!:)//+", "/", v)
            if trailing and not v.endswith("/"):
                v = v + "/"
        result[k] = v
    return result


def coerce_params(
    node_params: Dict[str, Any],
    plugin: PluginManifest,
) -> Dict[str, Any]:
    """
    Coerce raw node parameter values to the types declared in the plugin schema.
    Applies plugin defaults first, then overlays node-level values with type casting.
    """
    resolved: Dict[str, Any] = {}

    for p_name, p_schema in plugin.params.items():
        if p_schema.default is not None:
            resolved[p_name] = p_schema.default

    for k, v in node_params.items():
        schema = plugin.params.get(k)
        if schema is None:
            resolved[k] = v
            continue
        try:
            if schema.type in ("bool", "boolean"):
                if isinstance(v, bool):
                    resolved[k] = v
                else:
                    resolved[k] = str(v).lower() in ("true", "1", "yes")
            elif schema.type in ("int", "integer"):
                resolved[k] = int(v)
            elif schema.type in ("float", "number"):
                resolved[k] = float(v)
            else:
                resolved[k] = v
        except (ValueError, TypeError):
            resolved[k] = v

    return resolved
