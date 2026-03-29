"""
server_agent_patch.py
=====================
Complete instructions to patch /home/ubuntu/seqnode/core/server.py on the Oracle VPS.

This enables:
  - Admin with agent connected → executes on the admin's local machine
  - Admin without agent        → executes on the VPS server (existing behaviour)
  - Regular user with agent    → executes on their local machine
  - Regular user without agent → returns HTTP 403 (must install agent first)

═══════════════════════════════════════════════════════════════
STEP 1 — Copy the three new files to the VPS
═══════════════════════════════════════════════════════════════
From your local machine:

  scp SeqNode_old/core/agent_manager.py ubuntu@<vps>:/home/ubuntu/seqnode/core/
  scp SeqNode_old/core/runner_agent.py  ubuntu@<vps>:/home/ubuntu/seqnode/core/

═══════════════════════════════════════════════════════════════
STEP 2 — Install httpx on the VPS Python venv
═══════════════════════════════════════════════════════════════
  # /home/ubuntu/venv/bin/pip install httpx
  /home/ubuntu/miniforge3/envs/seqnode/bin/pip install httpx

═══════════════════════════════════════════════════════════════
STEP 3 — Set PHP_API_URL environment variable on VPS
═══════════════════════════════════════════════════════════════
  echo 'export PHP_API_URL=https://seqnode.onnetweb.com/api' >> /home/ubuntu/.bashrc
  export PHP_API_URL=https://seqnode.onnetweb.com/api

═══════════════════════════════════════════════════════════════
STEP 4 — Edit /home/ubuntu/seqnode/core/server.py
═══════════════════════════════════════════════════════════════

4a) Add these imports (after existing imports):

    from core.agent_manager import handle_agent_ws, list_agents, dispatch as agent_dispatch
    from core.runner_agent  import RunnerAgent
    from core.runner_local  import LocalRunner   # already imported — just confirm it's there
    from fastapi import Request

4b) Replace the existing  @app.post("/api/execute")  handler with this version:

─────────────────────────────────────────────────────────────────────────────────
@app.post("/api/execute")
async def execute_workflow_endpoint(request: Request, payload: Dict[str, Any]):
    try:
        wf_data = payload.get("workflow", payload)
        wf = WorkflowDefinition(**wf_data)
        errors = engine.validate_workflow(wf)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        current_settings = _get_settings()

        # ── Resolve execution target from headers injected by VpsProxy.php ──
        user_id  = int(request.headers.get("x-seqnode-user-id", "0"))
        is_admin = request.headers.get("x-seqnode-is-admin", "0") == "1"

        agent_id = agent_manager.get_agent_by_user(user_id) if user_id else None

        if not agent_id and not is_admin:
            # Regular users without a connected agent cannot execute
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "no_agent",
                    "message": (
                        "No SeqNode Agent connected for your account. "
                        "Install and start the agent on your local machine "
                        "to execute workflows."
                    ),
                },
            )

        async def run_bg():
            try:
                if agent_id:
                    # Route execution to the user's local agent
                    runner = RunnerAgent(agent_id, engine_ref=engine)
                    engine.set_runner(runner)
                    logger.info(
                        f"[execute] Routing to agent {agent_id[:8]}… "
                        f"(user={user_id} admin={is_admin})"
                    )
                else:
                    # Admin fallback: run on VPS server
                    engine.set_runner(LocalRunner())
                    logger.info(f"[execute] Running on VPS server (user={user_id} admin={is_admin})")

                await engine.execute_workflow(wf, settings=current_settings)

            except Exception as e:
                logger.error(f"Background execution error: {e}")
            finally:
                # Always restore the default local runner after execution
                engine.set_runner(LocalRunner())

        asyncio.create_task(run_bg())
        await asyncio.sleep(0)

        run_id = engine.current_state.run_id if engine.current_state else "unknown"
        return {
            "status": "started",
            "run_id": run_id,
            "execution_target": "agent" if agent_id else "server",
            "agent_id": agent_id or None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
─────────────────────────────────────────────────────────────────────────────────

4c) Add agent WebSocket endpoint and status routes at the end of server.py:

─────────────────────────────────────────────────────────────────────────────────
from core.agent_manager import handle_agent_ws, list_agents
import core.agent_manager as agent_manager

@app.websocket("/ws/agent")
async def websocket_agent(websocket: WebSocket):
    \"\"\"Reverse WebSocket endpoint — SeqNode Agents connect here.\"\"\"
    await handle_agent_ws(
        websocket,
        on_log_fn    = broadcast_log,
        on_status_fn = broadcast_status_change,
    )


@app.get("/api/agent/status")
def get_agent_status():
    \"\"\"Return all currently connected agents.\"\"\"
    return {"agents": list_agents()}


@app.get("/api/agent/user/{user_id}")
def get_agent_for_user(user_id: int):
    \"\"\"Check if a specific user has an agent connected.\"\"\"
    agent_id = agent_manager.get_agent_by_user(user_id)
    if not agent_id:
        return {"connected": False, "agent_id": None, "info": None}
    session = agent_manager._agents.get(agent_id)
    return {
        "connected": True,
        "agent_id":  agent_id,
        "info":      session.info if session else None,
    }
─────────────────────────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
STEP 5 — Restart the VPS backend
═══════════════════════════════════════════════════════════════
  # bash /home/ubuntu/SEQNODE/vps/start-backend.sh restart
  sudo systemctl restart seqnode

═══════════════════════════════════════════════════════════════
STEP 6 — Verify
═══════════════════════════════════════════════════════════════
  curl https://api.seqnode.onnetweb.com/api/agent/status
  # → {"agents": [...]}   if agent is running

  curl https://api.seqnode.onnetweb.com/api/agent/user/1
  # → {"connected": true, "agent_id": "...", "info": {"hostname": "..."}}
"""