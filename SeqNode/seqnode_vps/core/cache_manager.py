from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Any, Dict, Optional

logger = logging.getLogger("seqnode.cache_manager")


def _compute_cache_key(
    tool_id: str,
    params: Dict[str, Any],
    inputs_map: Dict[str, str],
    plugin_version: str = "1.0.0",
) -> str:
    canonical = {
        "tool_id": tool_id,
        "plugin_version": plugin_version,
        "params": _sort_dict(params),
        "inputs": _sort_dict(inputs_map),
    }
    raw = json.dumps(canonical, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _sort_dict(d: Dict) -> Dict:
    if not isinstance(d, dict):
        return d
    return {k: _sort_dict(v) for k, v in sorted(d.items())}


class CacheEntry:
    __slots__ = ("cache_key", "run_id", "node_id", "outputs", "created_at", "hit_count")

    def __init__(
        self,
        cache_key: str,
        run_id: str,
        node_id: str,
        outputs: Dict[str, str],
        created_at: Optional[float] = None,
        hit_count: int = 0,
    ):
        self.cache_key  = cache_key
        self.run_id     = run_id
        self.node_id    = node_id
        self.outputs    = outputs
        self.created_at = created_at or time.time()
        self.hit_count  = hit_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cache_key":  self.cache_key,
            "run_id":     self.run_id,
            "node_id":    self.node_id,
            "outputs":    self.outputs,
            "created_at": self.created_at,
            "hit_count":  self.hit_count,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "CacheEntry":
        return cls(
            cache_key  = d["cache_key"],
            run_id     = d["run_id"],
            node_id    = d["node_id"],
            outputs    = d.get("outputs", {}),
            created_at = d.get("created_at"),
            hit_count  = int(d.get("hit_count", 0)),
        )


class CacheManager:

    def __init__(self, state_manager=None, ttl_s: float = 0.0):
        self._sm = state_manager
        self._ttl_s = ttl_s
        self._mem_cache: Dict[str, CacheEntry] = {}

    def _is_expired(self, entry: CacheEntry) -> bool:
        if self._ttl_s <= 0:
            return False
        return (time.time() - entry.created_at) > self._ttl_s

    def compute_key(
        self,
        node_def: Any,
        plugin: Any,
    ) -> str:
        tool_id  = getattr(node_def, "tool_id", "")
        params   = getattr(node_def, "params", {}) or {}
        inputs   = getattr(node_def, "inputs_map", {}) or {}
        version  = getattr(plugin, "version", "1.0.0")
        return _compute_cache_key(tool_id, params, inputs, version)

    def get(self, cache_key: str) -> Optional[CacheEntry]:
        entry = self._mem_cache.get(cache_key)
        if entry:
            if self._is_expired(entry):
                del self._mem_cache[cache_key]
                return None
            entry.hit_count += 1
            return entry
        return None

    def put(self, cache_key: str, run_id: str, node_id: str, outputs: Dict[str, str]) -> CacheEntry:
        entry = CacheEntry(
            cache_key=cache_key,
            run_id=run_id,
            node_id=node_id,
            outputs=outputs,
        )
        self._mem_cache[cache_key] = entry

        if self._sm is not None:
            try:
                self._persist_entry(entry)
            except Exception as exc:
                logger.debug(f"Cache persist failed (non-critical): {exc}")

        return entry

    def _persist_entry(self, entry: CacheEntry) -> None:
        if hasattr(self._sm, "_sqlite_backend") and self._sm._sqlite_backend is not None:
            import asyncio
            db = self._sm._sqlite_backend

            async def _save():
                await db.initialize()
                async with __import__("aiosqlite").connect(db._db_path) as conn:
                    await conn.execute(
                        "INSERT OR REPLACE INTO cache_entries "
                        "(cache_key, run_id, node_id, outputs, created_at) "
                        "VALUES (?,?,?,?,?)",
                        (
                            entry.cache_key,
                            entry.run_id,
                            entry.node_id,
                            json.dumps(entry.outputs),
                            entry.created_at,
                        ),
                    )
                    await conn.commit()

            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(_save())
            else:
                loop.run_until_complete(_save())

    async def get_async(self, cache_key: str) -> Optional[CacheEntry]:
        entry = self._mem_cache.get(cache_key)
        if entry:
            if self._is_expired(entry):
                del self._mem_cache[cache_key]
            else:
                entry.hit_count += 1
                return entry

        if self._sm is not None and hasattr(self._sm, "_sqlite_backend") and self._sm._sqlite_backend is not None:
            db = self._sm._sqlite_backend
            try:
                await db.initialize()
                async with __import__("aiosqlite").connect(db._db_path) as conn:
                    conn.row_factory = __import__("aiosqlite").Row
                    async with conn.execute(
                        "SELECT * FROM cache_entries WHERE cache_key = ?", (cache_key,)
                    ) as cur:
                        row = await cur.fetchone()
                if row:
                    entry = CacheEntry(
                        cache_key  = row["cache_key"],
                        run_id     = row["run_id"],
                        node_id    = row["node_id"],
                        outputs    = json.loads(row["outputs"] or "{}"),
                        created_at = row["created_at"],
                    )
                    if not self._is_expired(entry):
                        self._mem_cache[cache_key] = entry
                        return entry
            except Exception as exc:
                logger.debug(f"Cache DB lookup failed: {exc}")

        return None

    def invalidate(self, cache_key: str) -> bool:
        existed = cache_key in self._mem_cache
        self._mem_cache.pop(cache_key, None)
        return existed

    def clear(self) -> int:
        count = len(self._mem_cache)
        self._mem_cache.clear()
        return count

    def stats(self) -> Dict[str, Any]:
        total_hits = sum(e.hit_count for e in self._mem_cache.values())
        return {
            "entries": len(self._mem_cache),
            "total_hits": total_hits,
            "ttl_s": self._ttl_s,
        }
