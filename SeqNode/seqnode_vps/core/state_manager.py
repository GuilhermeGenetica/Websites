import os
import json
import time
import logging
from typing import Optional, Dict, List
from core.models import WorkflowState, ExecutionLog, NodeStatus

logger = logging.getLogger("seqnode.state")


class StateManager:

    def __init__(self, state_dir: str = ".seqnode_state"):
        self.state_dir = os.path.abspath(state_dir)
        os.makedirs(self.state_dir, exist_ok=True)

    def _state_path(self, run_id: str) -> str:
        return os.path.join(self.state_dir, f"{run_id}.json")

    def save_state(self, state: WorkflowState):
        path = self._state_path(state.run_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(state.model_dump(), f, indent=2, default=str)
        logger.debug(f"State saved: {path}")

    def load_state(self, run_id: str) -> Optional[WorkflowState]:
        path = self._state_path(run_id)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return WorkflowState(**data)
        except Exception as e:
            logger.error(f"Failed to load state {run_id}: {e}")
            return None

    def list_runs(self) -> List[Dict]:
        runs = []
        for fn in sorted(os.listdir(self.state_dir)):
            if not fn.endswith(".json"):
                continue
            run_id = fn.replace(".json", "")
            state = self.load_state(run_id)
            if state:
                runs.append({
                    "run_id": state.run_id,
                    "workflow_id": state.workflow_id,
                    "status": state.status,
                    "started_at": state.started_at,
                    "finished_at": state.finished_at,
                })
        return runs

    def delete_run(self, run_id: str) -> bool:
        path = self._state_path(run_id)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False

    def add_log(self, state: WorkflowState, node_id: str, level: str, message: str, source: str = "engine"):
        entry = ExecutionLog(
            timestamp=time.time(),
            node_id=node_id,
            level=level,
            message=message,
            source=source,
        )
        state.logs.append(entry)

    def update_node_status(self, state: WorkflowState, node_id: str, status: NodeStatus):
        state.node_statuses[node_id] = status
