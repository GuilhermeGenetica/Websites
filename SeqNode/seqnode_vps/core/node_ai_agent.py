from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

from core.node_base import BaseNodeHandler, NodeContext, NodeResult, register_handler

logger = logging.getLogger("seqnode.node_ai_agent")


def _resolve_refs(text: str, state: Any) -> str:
    import re
    def _replace(m: re.Match) -> str:
        ref = m.group(1).strip()
        parts = ref.split(".", 1)
        if len(parts) == 2:
            nid, key = parts
            return state.node_outputs.get(nid, {}).get(key, m.group(0))
        nid = parts[0]
        outputs = state.node_outputs.get(nid, {})
        if outputs:
            return list(outputs.values())[0]
        return m.group(0)
    return re.sub(r'\$ref:\{([^}]+)\}', _replace, text)


async def _call_http(
    endpoint: str,
    method: str,
    headers: Dict[str, str],
    payload: Dict[str, Any],
    timeout: float = 60.0,
) -> Dict[str, Any]:
    try:
        import aiohttp
    except ImportError:
        raise RuntimeError("aiohttp is required for HTTP AI agent nodes. Install with: pip install aiohttp")

    async with aiohttp.ClientSession(headers=headers) as session:
        fn = getattr(session, method.lower(), session.post)
        async with fn(endpoint, json=payload, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
            if not resp.ok:
                try:
                    err_body = await resp.json()
                    err_type = err_body.get("error", {}).get("type", "")
                    err_msg  = err_body.get("error", {}).get("message", str(err_body))
                    detail   = f"{err_type}: {err_msg}" if err_type else err_msg
                except Exception:
                    detail = await resp.text()
                logger.error(f"HTTP {resp.status} from {endpoint}: {detail}")
                raise aiohttp.ClientResponseError(
                    resp.request_info, resp.history,
                    status=resp.status,
                    message=detail,
                )
            return await resp.json()


async def _call_anthropic(
    prompt: str,
    model: str,
    max_tokens: int,
    api_key: Optional[str],
    system: Optional[str] = None,
) -> str:
    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set and no api_key param provided.")

    # Strip any UI-only label that gets appended to embedded offline model names
    _OFFLINE_LABEL = " (Embedded OffLine List)"
    if model and _OFFLINE_LABEL in model:
        model = model.replace(_OFFLINE_LABEL, "").strip()

    payload: Dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    # Use the dedicated system parameter — required for correct behaviour on all
    # Anthropic models and avoids mixing instructions with user content.
    if system:
        payload["system"] = system

    response = await _call_http(
        endpoint="https://api.anthropic.com/v1/messages",
        method="POST",
        # Do NOT include content-type here — aiohttp sets it automatically
        # when json= is used, and a duplicate header causes some servers to reject.
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        payload=payload,
    )
    content_blocks = response.get("content", [])
    text_parts = [b.get("text", "") for b in content_blocks if b.get("type") == "text"]
    return "\n".join(text_parts)


async def _call_gemini(prompt: str, model: str, api_key: Optional[str]) -> str:
    api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set and no api_key param provided.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    response = await _call_http(
        endpoint=url,
        method="POST",
        headers={"Content-Type": "application/json"},
        payload={
            "contents": [{"parts": [{"text": prompt}]}]
        },
    )
    try:
        return response["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return ""


async def _call_openai_compatible(prompt: str, model: str, max_tokens: int, api_key: Optional[str], api_base: str) -> str:
    if not api_key and "localhost" not in api_base:
        raise RuntimeError("API_KEY is required for online OpenAI-compatible endpoints.")

    response = await _call_http(
        endpoint=f"{api_base}/chat/completions",
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        payload={
            "model": model,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        },
    )
    choices = response.get("choices", [])
    if choices:
        return choices[0].get("message", {}).get("content", "")
    return ""


async def _call_mcp(mcp_config: Dict[str, Any], inputs: Dict[str, Any]) -> Dict[str, Any]:
    tool_name = mcp_config.get("tool_name", "")
    server_url = mcp_config.get("server_url", "")
    if not server_url:
        raise RuntimeError("mcp.server_url is required for MCP AI agent nodes.")

    payload = {"tool": tool_name, "inputs": inputs}
    headers = {"Content-Type": "application/json"}
    api_key = mcp_config.get("api_key", "")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = await _call_http(
        endpoint=server_url,
        method="POST",
        headers=headers,
        payload=payload,
        timeout=float(mcp_config.get("timeout_s", 120)),
    )
    return response


@register_handler("ai_agent")
class AIAgentNodeHandler(BaseNodeHandler):

    @property
    def node_type(self) -> str:
        return "ai_agent"

    async def execute(self, ctx: NodeContext) -> NodeResult:
        node_def = ctx.node_def
        node_id  = node_def.id
        state    = ctx.state
        params   = node_def.params

        provider: str = params.get("provider", "http").lower()
        await ctx.emit_log("INFO", f"[AI Agent] Provider: {provider}")

        prompt_template: str = params.get("prompt", "")
        if prompt_template:
            prompt_template = _resolve_refs(prompt_template, state)

        output_key: str = params.get("output_key", "ai_result")
        output_file: Optional[str] = node_def.outputs_map.get(output_key, "")

        api_key  = params.get("api_key")
        model    = params.get("model")
        api_base = params.get("api_base", "")

        try:
            if provider in ("anthropic", "claude"):
                text = await _call_anthropic(
                    prompt=prompt_template,
                    model=model or "claude-3-5-haiku-20241022",
                    max_tokens=int(params.get("max_tokens", 1024)),
                    api_key=api_key,
                )
                result_data = {output_key: text}

            elif provider == "gemini":
                text = await _call_gemini(
                    prompt=prompt_template,
                    model=model or "gemini-2.0-flash",
                    api_key=api_key,
                )
                result_data = {output_key: text}

            elif provider in ("openai", "grok", "ollama", "custom"):
                if provider == "grok":
                    if not api_base: api_base = "https://api.x.ai/v1"
                    if not model: model = "grok-2-latest"
                elif provider == "openai":
                    if not api_base: api_base = "https://api.openai.com/v1"
                    if not model: model = "gpt-4o-mini"
                elif not api_base:
                    api_base = "http://localhost:11434/v1" # Fallback Ollama

                text = await _call_openai_compatible(
                    prompt=prompt_template,
                    model=model,
                    max_tokens=int(params.get("max_tokens", 1024)),
                    api_key=api_key,
                    api_base=api_base.rstrip('/'),
                )
                result_data = {output_key: text}

            elif provider == "mcp":
                mcp_cfg = params.get("mcp", {})
                raw_inputs: Dict[str, Any] = {}
                for k, v in node_def.inputs_map.items():
                    raw_inputs[k] = v
                response = await _call_mcp(mcp_cfg, raw_inputs)
                result_data = {output_key: json.dumps(response)}

            elif provider == "http":
                endpoint = params.get("endpoint", "")
                if not endpoint:
                    return NodeResult.fail("AI Agent (http): 'endpoint' param is required.")
                method = params.get("method", "POST")
                headers_raw = params.get("headers", {})
                payload: Dict[str, Any] = {}
                if prompt_template:
                    payload[params.get("prompt_field", "prompt")] = prompt_template
                payload.update(params.get("extra_payload", {}))
                response = await _call_http(endpoint, method, headers_raw, payload,
                                            timeout=float(params.get("timeout_s", 60)))
                out_path = params.get("response_path", "")
                if out_path:
                    parts = out_path.split(".")
                    val: Any = response
                    for p in parts:
                        if isinstance(val, dict):
                            val = val.get(p, "")
                        else:
                            val = ""
                            break
                    result_data = {output_key: str(val)}
                else:
                    result_data = {output_key: json.dumps(response)}
            else:
                return NodeResult.fail(f"AI Agent: unknown provider '{provider}'.")

        except Exception as exc:
            logger.exception(f"AI Agent node '{node_id}' failed")
            return NodeResult.fail(f"AI Agent error: {exc}")

        if output_file:
            try:
                import os as _os
                _os.makedirs(_os.path.dirname(_os.path.abspath(output_file)), exist_ok=True)
                with open(output_file, "w", encoding="utf-8") as fh:
                    content = result_data.get(output_key, "")
                    fh.write(content if isinstance(content, str) else json.dumps(content, indent=2))
                result_data[output_key] = output_file
                await ctx.emit_log("INFO", f"[AI Agent] Output written to: {output_file}")
            except Exception as exc:
                await ctx.emit_log("WARN", f"[AI Agent] Could not write output file: {exc}")

        preview = str(result_data.get(output_key, ""))[:200]
        await ctx.emit_log("INFO", f"[AI Agent] Completed. Result preview: {preview}")
        return NodeResult.ok(result_data)