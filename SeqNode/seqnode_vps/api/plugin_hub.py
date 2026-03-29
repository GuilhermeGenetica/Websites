# api/plugin_hub.py
"""
SeqNode-OS Plugin Hub
Community plugin ecosystem based on GitHub.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict, List, Optional

import httpx
import yaml

logger = logging.getLogger("seqnode.plugin_hub")

HUB_INDEX_URL = os.getenv(
    "SEQNODE_HUB_INDEX_URL",
    "https://raw.githubusercontent.com/seqnode-os/community-plugins/main/index.yaml"
)
HUB_CACHE_TTL = int(os.getenv("SEQNODE_HUB_CACHE_TTL", "300"))  # 5 minutes

_cache: Dict = {"data": None, "fetched_at": 0.0}


async def fetch_hub_index() -> List[Dict]:
    """Fetches and caches the hub index.yaml. TTL configurable."""
    now = time.time()
    if _cache["data"] and (now - _cache["fetched_at"]) < HUB_CACHE_TTL:
        return _cache["data"]

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(HUB_INDEX_URL)
            resp.raise_for_status()
            data = yaml.safe_load(resp.text)
            plugins = data.get("plugins", [])
            _cache["data"] = plugins
            _cache["fetched_at"] = now
            logger.info(f"Plugin Hub index fetched: {len(plugins)} plugins")
            return plugins
    except Exception as e:
        logger.warning(f"Failed to fetch Plugin Hub index: {e}")
        # Return expired cache if available
        if _cache["data"]:
            return _cache["data"]
        return []


def invalidate_hub_cache():
    _cache["data"] = None
    _cache["fetched_at"] = 0.0


async def fetch_plugin_yaml(yaml_url: str) -> Dict:
    """Download and parse a specific plugin YAML from the hub."""
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        resp = await client.get(yaml_url)
        resp.raise_for_status()
        return yaml.safe_load(resp.text)


async def install_hub_plugin(yaml_url: str, plugins_dir: str) -> Dict[str, Any]:
    """
    Downloads plugin YAML and installs it in local plugins_dir.
    Creates subdirectory {plugin_id}/ and writes {plugin_id}.yaml.
    """
    plugin_data = await fetch_plugin_yaml(yaml_url)
    plugin_id = plugin_data.get("id", "").strip()
    if not plugin_id:
        raise ValueError("Plugin YAML is missing the 'id' field")

    # Sanitize — prevent path traversal
    safe_id = "".join(c for c in plugin_id if c.isalnum() or c in "_-")
    if safe_id != plugin_id:
        raise ValueError(f"Plugin id '{plugin_id}' contains invalid characters")

    dest_dir = os.path.join(os.path.abspath(plugins_dir), safe_id)
    os.makedirs(dest_dir, exist_ok=True)
    dest_file = os.path.join(dest_dir, f"{safe_id}.yaml")

    with open(dest_file, "w", encoding="utf-8") as f:
        yaml.dump(plugin_data, f, default_flow_style=False, allow_unicode=True)

    logger.info(f"Plugin Hub: installed '{safe_id}' to {dest_file}")
    return {"status": "installed", "plugin_id": safe_id, "path": dest_file}


def search_plugins(plugins: List[Dict], query: str) -> List[Dict]:
    q = query.lower().strip()
    if not q:
        return plugins
    return [
        p for p in plugins
        if q in p.get("name", "").lower()
        or q in p.get("description", "").lower()
        or any(q in str(t).lower() for t in p.get("tags", []))
        or q in p.get("author", "").lower()
    ]


def mark_installed(plugins: List[Dict], local_ids: set) -> List[Dict]:
    for p in plugins:
        p["installed"] = p.get("id") in local_ids
    return plugins
