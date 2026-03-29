# api/mcp_server.py
"""
SeqNode-OS MCP Server
Exposes SeqNode as an MCP server for LLM agents (Claude Desktop, Cursor, etc.)
Documentation MCP: https://modelcontextprotocol.io
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional, Sequence

from fastapi import APIRouter
from starlette.requests import Request

logger = logging.getLogger("seqnode.mcp")

# MCP server instance — created here, references to pm/engine injected via factory
_mcp_server = None


def create_mcp_router(pm, engine, get_settings_fn) -> APIRouter:
    """
    Factory that creates and configures the MCP server.
    Receives references to PluginManager and WorkflowEngine from server.py.
    Returns a FastAPI APIRouter to mount at /mcp.
    """
    try:
        from mcp.server import Server
        from mcp.server.sse import SseServerTransport
        from mcp.types import (
            Tool, TextContent, CallToolResult, ListToolsResult,
        )
    except ImportError as e:
        raise ImportError(f"MCP package not installed. Run: pip install mcp>=1.0.0\n{e}")

    global _mcp_server
    server = Server("seqnode-os")
    _mcp_server = server

    # ── Tool definitions ────────────────────────────────────────────────────

    @server.list_tools()
    async def list_tools() -> ListToolsResult:
        return ListToolsResult(tools=[
            Tool(
                name="list_plugins",
                description="List all available bioinformatics tool plugins installed in SeqNode-OS",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "category": {
                            "type": "string",
                            "description": "Filter by category (optional). E.g. 'alignment', 'variant_calling'"
                        }
                    }
                }
            ),
            Tool(
                name="list_workflows",
                description="List all saved workflow definitions",
                inputSchema={"type": "object", "properties": {}}
            ),
            Tool(
                name="execute_workflow",
                description=(
                    "Execute a bioinformatics workflow. "
                    "Returns a run_id to track progress with get_run_status."
                ),
                inputSchema={
                    "type": "object",
                    "required": ["workflow"],
                    "properties": {
                        "workflow": {
                            "type": "string",
                            "description": "Complete workflow JSON as string (SeqNode-OS WorkflowDefinition schema)"
                        }
                    }
                }
            ),
            Tool(
                name="get_run_status",
                description="Get the current status and progress of a workflow run",
                inputSchema={
                    "type": "object",
                    "required": ["run_id"],
                    "properties": {
                        "run_id": {"type": "string", "description": "Run ID returned by execute_workflow"}
                    }
                }
            ),
            Tool(
                name="get_run_logs",
                description="Get execution logs for a workflow run, optionally filtered by node or level",
                inputSchema={
                    "type": "object",
                    "required": ["run_id"],
                    "properties": {
                        "run_id": {"type": "string"},
                        "node_id": {"type": "string", "description": "Filter logs for a specific node (optional)"},
                        "level": {
                            "type": "string",
                            "enum": ["INFO", "WARN", "ERROR", "DEBUG"],
                            "description": "Filter by log level (optional)"
                        },
                        "last_n": {"type": "integer", "description": "Return only last N log entries (optional)"}
                    }
                }
            ),
            Tool(
                name="cancel_execution",
                description="Cancel the currently running workflow execution",
                inputSchema={"type": "object", "properties": {}}
            ),
            Tool(
                name="get_system_info",
                description="Get system information: CPU, memory, disk, installed tools, SeqNode version",
                inputSchema={"type": "object", "properties": {}}
            ),
            Tool(
                name="get_workflow_schema",
                description="Get the JSON schema for SeqNode-OS workflow definitions. Use this before build_workflow.",
                inputSchema={"type": "object", "properties": {}}
            ),
            Tool(
                name="validate_workflow",
                description="Validate a workflow JSON before executing it. Returns validation errors if any.",
                inputSchema={
                    "type": "object",
                    "required": ["workflow"],
                    "properties": {
                        "workflow": {"type": "string", "description": "Workflow JSON as string"}
                    }
                }
            ),
        ])

    # ── Tool handlers ────────────────────────────────────────────────────────

    @server.call_tool()
    async def call_tool(name: str, arguments: Dict[str, Any]) -> CallToolResult:
        try:
            if name == "list_plugins":
                plugins = pm.list_plugins() if hasattr(pm, 'list_plugins') else [t.model_dump() for t in pm.list_tools()]
                cat = arguments.get("category")
                if cat:
                    plugins = [p for p in plugins if p.get("category", "").lower() == cat.lower()]
                result = [
                    {"id": p.get("id"), "name": p.get("name"), "description": p.get("description", ""),
                     "category": p.get("category", ""), "template": p.get("template", "")}
                    for p in plugins
                ]
                return CallToolResult(content=[TextContent(type="text", text=json.dumps(result, indent=2))])

            elif name == "list_workflows":
                settings = get_settings_fn()
                wf_dir = settings.get("dirs", {}).get("workflows", "workflows")
                workflows = []
                if os.path.isdir(wf_dir):
                    for f in sorted(os.listdir(wf_dir)):
                        if f.endswith(".json"):
                            wf_id = f[:-5]
                            workflows.append({"id": wf_id, "filename": f})
                return CallToolResult(content=[TextContent(type="text", text=json.dumps(workflows, indent=2))])

            elif name == "execute_workflow":
                wf_json = arguments.get("workflow", "{}")
                wf_data = json.loads(wf_json) if isinstance(wf_json, str) else wf_json
                from core.models import WorkflowDefinition
                import asyncio
                wf = WorkflowDefinition(**wf_data)
                errors = engine.validate_workflow(wf)
                if errors:
                    return CallToolResult(
                        isError=True,
                        content=[TextContent(type="text", text=f"Validation errors: {json.dumps(errors)}")]
                    )
                settings = get_settings_fn()
                async def run_bg():
                    try:
                        await engine.execute_workflow(wf, settings=settings)
                    except Exception as e:
                        logger.error(f"MCP execute_workflow background error: {e}")
                asyncio.create_task(run_bg())
                await asyncio.sleep(0)
                run_id = engine.current_state.run_id if engine.current_state else "unknown"
                return CallToolResult(content=[TextContent(type="text", text=json.dumps({"status": "started", "run_id": run_id}))])

            elif name == "get_run_status":
                run_id = arguments["run_id"]
                state = engine.state_manager.load_state(run_id)
                if not state:
                    return CallToolResult(isError=True, content=[TextContent(type="text", text=f"Run '{run_id}' not found")])
                data = state.model_dump()
                summary = {
                    "run_id": data.get("run_id"),
                    "status": data.get("status"),
                    "started_at": data.get("started_at"),
                    "finished_at": data.get("finished_at"),
                    "node_statuses": data.get("node_statuses", {}),
                }
                return CallToolResult(content=[TextContent(type="text", text=json.dumps(summary, indent=2))])

            elif name == "get_run_logs":
                run_id = arguments["run_id"]
                state = engine.state_manager.load_state(run_id)
                if not state:
                    return CallToolResult(isError=True, content=[TextContent(type="text", text=f"Run '{run_id}' not found")])
                logs = [l.model_dump() for l in state.logs]
                if arguments.get("node_id"):
                    logs = [l for l in logs if l.get("node_id") == arguments["node_id"]]
                if arguments.get("level"):
                    logs = [l for l in logs if l.get("level") == arguments["level"]]
                if arguments.get("last_n"):
                    logs = logs[-int(arguments["last_n"]):]
                return CallToolResult(content=[TextContent(type="text", text=json.dumps(logs, indent=2))])

            elif name == "cancel_execution":
                engine.cancel()
                return CallToolResult(content=[TextContent(type="text", text='{"status": "cancel_requested"}')])

            elif name == "get_system_info":
                from core.system_info import get_system_info
                info = get_system_info()
                return CallToolResult(content=[TextContent(type="text", text=json.dumps(info, indent=2))])

            elif name == "get_workflow_schema":
                from core.models import WorkflowDefinition
                schema = WorkflowDefinition.model_json_schema()
                return CallToolResult(content=[TextContent(type="text", text=json.dumps(schema, indent=2))])

            elif name == "validate_workflow":
                wf_json = arguments.get("workflow", "{}")
                wf_data = json.loads(wf_json) if isinstance(wf_json, str) else wf_json
                from core.models import WorkflowDefinition
                wf = WorkflowDefinition(**wf_data)
                errors = engine.validate_workflow(wf)
                result = {"valid": len(errors) == 0, "errors": errors}
                return CallToolResult(content=[TextContent(type="text", text=json.dumps(result, indent=2))])

            else:
                return CallToolResult(isError=True, content=[TextContent(type="text", text=f"Unknown tool: {name}")])

        except Exception as exc:
            logger.exception(f"MCP tool '{name}' raised exception")
            return CallToolResult(isError=True, content=[TextContent(type="text", text=f"Error: {exc}")])

    # ── FastAPI Router ───────────────────────────────────────────────────────

    router = APIRouter()
    sse_transport = SseServerTransport("/mcp/messages")

    @router.get("/mcp/sse")
    async def mcp_sse_endpoint(request: Request):
        """SSE endpoint for MCP clients."""
        async with sse_transport.connect_sse(request.scope, request.receive, request._send) as streams:
            await server.run(streams[0], streams[1], server.create_initialization_options())

    @router.post("/mcp/messages")
    async def mcp_messages(request: Request):
        """Message endpoint for SSE transport."""
        await sse_transport.handle_post_message(request.scope, request.receive, request._send)

    @router.get("/mcp/manifest")
    async def mcp_manifest():
        """Discovery manifest — describes the MCP server for manual integration."""
        return {
            "name": "seqnode-os",
            "version": "1.0.0",
            "description": "SeqNode-OS Bioinformatics Pipeline Engine",
            "transport": "sse",
            "sse_url": "/mcp/sse",
            "tools": [
                "list_plugins", "list_workflows", "execute_workflow",
                "get_run_status", "get_run_logs", "cancel_execution",
                "get_system_info", "get_workflow_schema", "validate_workflow"
            ]
        }

    return router
