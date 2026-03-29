from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Dict, List, Literal, Optional

import aiosqlite

from core.models import ExecutionLog, NodeStatus, WorkflowState
from core.state_manager import StateManager

logger = logging.getLogger("seqnode.state_db")

_DDL = """
CREATE TABLE IF NOT EXISTS runs (
    run_id          TEXT PRIMARY KEY,
    workflow_id     TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'PENDING',
    started_at      REAL,
    finished_at     REAL,
    error_message   TEXT,
    node_statuses   TEXT NOT NULL DEFAULT '{}',
    node_outputs    TEXT NOT NULL DEFAULT '{}',
    created_at      REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      TEXT    NOT NULL,
    timestamp   REAL    NOT NULL,
    node_id     TEXT    NOT NULL DEFAULT '',
    level       TEXT    NOT NULL DEFAULT 'INFO',
    message     TEXT    NOT NULL DEFAULT '',
    source      TEXT    NOT NULL DEFAULT 'engine'
);

CREATE TABLE IF NOT EXISTS cache_entries (
    cache_key   TEXT PRIMARY KEY,
    run_id      TEXT NOT NULL,
    node_id     TEXT NOT NULL,
    outputs     TEXT NOT NULL DEFAULT '{}',
    created_at  REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_run_id ON logs(run_id);
CREATE INDEX IF NOT EXISTS idx_runs_status  ON runs(status);
"""


class StateDB:

    def __init__(self, db_path: str):
        self._db_path = db_path
        self._initialised = False

    async def initialize(self) -> None:
        os.makedirs(os.path.dirname(os.path.abspath(self._db_path)), exist_ok=True)
        async with aiosqlite.connect(self._db_path) as db:
            await db.executescript(_DDL)
            await db.commit()
        self._initialised = True
        logger.debug(f"StateDB initialised at {self._db_path}")

    async def _ensure_init(self) -> None:
        if not self._initialised:
            await self.initialize()

    async def save_run(self, state: WorkflowState) -> None:
        await self._ensure_init()
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute(
                """INSERT OR REPLACE INTO runs
                   (run_id, workflow_id, status, started_at, finished_at,
                    error_message, node_statuses, node_outputs, created_at)
                   VALUES (?,?,?,?,?,?,?,?,?)""",
                (
                    state.run_id,
                    state.workflow_id,
                    state.status,
                    state.started_at,
                    state.finished_at,
                    state.error_message,
                    json.dumps({k: v.value if hasattr(v, "value") else str(v) for k, v in state.node_statuses.items()}),
                    json.dumps(state.node_outputs),
                    time.time(),
                ),
            )
            await db.commit()

    async def load_run(self, run_id: str) -> Optional[WorkflowState]:
        await self._ensure_init()
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,)) as cur:
                row = await cur.fetchone()
        if not row:
            return None
        try:
            ns_raw = json.loads(row["node_statuses"] or "{}")
            node_statuses = {k: NodeStatus(v) for k, v in ns_raw.items()}
            node_outputs = json.loads(row["node_outputs"] or "{}")

            logs_raw = await self.get_logs(run_id, limit=5000)
            logs = [
                ExecutionLog(
                    timestamp=lg["timestamp"],
                    node_id=lg["node_id"],
                    level=lg["level"],
                    message=lg["message"],
                    source=lg["source"],
                )
                for lg in logs_raw
            ]
            return WorkflowState(
                workflow_id=row["workflow_id"],
                run_id=row["run_id"],
                status=row["status"],
                node_statuses=node_statuses,
                node_outputs=node_outputs,
                logs=logs,
                started_at=row["started_at"],
                finished_at=row["finished_at"],
                error_message=row["error_message"],
            )
        except Exception as exc:
            logger.error(f"Failed to deserialise run {run_id}: {exc}")
            return None

    async def list_runs(
        self,
        status: Optional[str] = None,
        workflow_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        await self._ensure_init()
        query = "SELECT run_id, workflow_id, status, started_at, finished_at FROM runs"
        params: list = []
        conditions: list[str] = []
        if status:
            conditions.append("status = ?")
            params.append(status)
        if workflow_id:
            conditions.append("workflow_id = ?")
            params.append(workflow_id)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, params) as cur:
                rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def delete_run(self, run_id: str) -> bool:
        await self._ensure_init()
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute("DELETE FROM logs WHERE run_id = ?", (run_id,))
            cur = await db.execute("DELETE FROM runs WHERE run_id = ?", (run_id,))
            deleted = cur.rowcount > 0
            await db.commit()
        return deleted

    async def upsert_node_state(self, run_id: str, node_id: str, status: str) -> None:
        await self._ensure_init()
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT node_statuses FROM runs WHERE run_id = ?", (run_id,)) as cur:
                row = await cur.fetchone()
            if row:
                ns = json.loads(row["node_statuses"] or "{}")
                ns[node_id] = status
                await db.execute(
                    "UPDATE runs SET node_statuses = ? WHERE run_id = ?",
                    (json.dumps(ns), run_id),
                )
                await db.commit()

    async def append_log(
        self,
        run_id: str,
        node_id: str,
        level: str,
        message: str,
        source: str = "engine",
    ) -> None:
        await self._ensure_init()
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute(
                "INSERT INTO logs (run_id, timestamp, node_id, level, message, source) VALUES (?,?,?,?,?,?)",
                (run_id, time.time(), node_id, level, message, source),
            )
            await db.commit()

    async def get_logs(
        self,
        run_id: str,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        await self._ensure_init()
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM logs WHERE run_id = ? ORDER BY id ASC LIMIT ? OFFSET ?",
                (run_id, limit, offset),
            ) as cur:
                rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def get_run_count(self) -> int:
        await self._ensure_init()
        async with aiosqlite.connect(self._db_path) as db:
            async with db.execute("SELECT COUNT(*) FROM runs") as cur:
                row = await cur.fetchone()
        return row[0] if row else 0


class UnifiedStateManager:

    def __init__(
        self,
        backend: Literal["json", "sqlite"] = "json",
        db_path: str = ".seqnode_state/seqnode.db",
        state_dir: str = ".seqnode_state",
    ):
        self.backend = backend
        self.db_path = db_path
        self.state_dir = state_dir
        self._json_backend: Optional[StateManager] = None
        self._sqlite_backend: Optional[StateDB] = None

        if backend == "json":
            self._json_backend = StateManager(state_dir=state_dir)
        else:
            self._sqlite_backend = StateDB(db_path=db_path)

    @classmethod
    def from_settings(cls, settings: Dict[str, Any]) -> "UnifiedStateManager":
        backend = settings.get("state_backend", "json")
        state_dir = settings.get("dirs", {}).get("state", ".seqnode_state")
        db_path = os.path.join(state_dir, "seqnode.db")
        return cls(backend=backend, db_path=db_path, state_dir=state_dir)

    def save_state(self, state: WorkflowState) -> None:
        if self.backend == "json":
            self._json_backend.save_state(state)
        else:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(self._sqlite_backend.save_run(state))
            else:
                loop.run_until_complete(self._sqlite_backend.save_run(state))

    def load_state(self, run_id: str) -> Optional[WorkflowState]:
        if self.backend == "json":
            return self._json_backend.load_state(run_id)
        else:
            import asyncio
            try:
                loop = asyncio.get_running_loop()
                # Running inside an async context — use a new thread to avoid deadlock
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    future = pool.submit(
                        asyncio.run, self._sqlite_backend.load_run(run_id)
                    )
                    return future.result(timeout=30)
            except RuntimeError:
                # No running loop — safe to use run_until_complete
                return asyncio.run(self._sqlite_backend.load_run(run_id))

    async def load_state_async(self, run_id: str) -> Optional[WorkflowState]:
        if self.backend == "json":
            return self._json_backend.load_state(run_id)
        return await self._sqlite_backend.load_run(run_id)

    async def save_state_async(self, state: WorkflowState) -> None:
        if self.backend == "json":
            self._json_backend.save_state(state)
        else:
            await self._sqlite_backend.save_run(state)

    def list_runs(self) -> List[Dict]:
        if self.backend == "json":
            return self._json_backend.list_runs()
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return []
        return loop.run_until_complete(self._sqlite_backend.list_runs())

    async def list_runs_async(self) -> List[Dict]:
        if self.backend == "json":
            return self._json_backend.list_runs()
        return await self._sqlite_backend.list_runs()

    def delete_run(self, run_id: str) -> bool:
        if self.backend == "json":
            return self._json_backend.delete_run(run_id)
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return False
        return loop.run_until_complete(self._sqlite_backend.delete_run(run_id))

    def add_log(self, state: WorkflowState, node_id: str, level: str, message: str, source: str = "engine") -> None:
        if self._json_backend:
            self._json_backend.add_log(state, node_id, level, message, source)
        if self._sqlite_backend:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(
                    self._sqlite_backend.append_log(state.run_id, node_id, level, message, source)
                )
            else:
                loop.run_until_complete(
                    self._sqlite_backend.append_log(state.run_id, node_id, level, message, source)
                )

    async def get_logs_async(self, run_id: str, limit: int = 1000) -> List[Dict]:
        if self.backend == "json":
            state = self._json_backend.load_state(run_id)
            if not state:
                return []
            return [
                {"timestamp": lg.timestamp, "node_id": lg.node_id, "level": lg.level,
                 "message": lg.message, "source": lg.source}
                for lg in state.logs[-limit:]
            ]
        return await self._sqlite_backend.get_logs(run_id, limit=limit)

    async def _migrate_json_to_sqlite(self) -> None:
        flag = os.path.join(self.state_dir, ".migrated")
        if os.path.exists(flag):
            return
        if not self._sqlite_backend:
            return
        await self._sqlite_backend.initialize()
        json_sm = StateManager(state_dir=self.state_dir)
        runs = json_sm.list_runs()
        migrated = 0
        for run_info in runs:
            run_id = run_info.get("run_id")
            if not run_id:
                continue
            state = json_sm.load_state(run_id)
            if state:
                try:
                    await self._sqlite_backend.save_run(state)
                    for log in state.logs:
                        await self._sqlite_backend.append_log(
                            run_id, log.node_id, log.level, log.message, log.source
                        )
                    migrated += 1
                except Exception as exc:
                    logger.warning(f"Migration skipped for {run_id}: {exc}")
        with open(flag, "w") as fh:
            fh.write(f"migrated={migrated}\n")
        logger.info(f"JSON→SQLite migration complete: {migrated} runs.")
