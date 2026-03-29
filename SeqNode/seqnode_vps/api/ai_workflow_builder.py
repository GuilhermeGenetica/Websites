# api/ai_workflow_builder.py
"""
SeqNode-OS AI Workflow Builder
Converts natural language into valid workflow JSON using any configured LLM.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

logger = logging.getLogger("seqnode.ai_builder")

# ── System prompt ────────────────────────────────────────────────────────────

_SYSTEM_PROMPT_TEMPLATE = """You are an expert bioinformatics workflow builder for SeqNode-OS.
Given a natural language description, generate a valid SeqNode-OS workflow JSON.

AVAILABLE PLUGINS (use ONLY these):
{plugins_json}

WORKFLOW JSON SCHEMA:
{schema_json}

STRICT RULES:
1. Return ONLY valid JSON — no markdown fences, no explanation text, no comments
2. node "id" fields must be unique snake_case slugs (e.g. "bwa_align", "gatk_hc_1")
3. edges: array of {{source, target, label}} — use "default" label for unconditional edges
4. params keys must exactly match the template variables {{var}} of the plugin
5. inputs_map and outputs_map keys must match template variables of the plugin
6. Do NOT invent plugins not in the list above
7. If a required tool is not available, include a comment node explaining what's missing
8. The workflow name must be a concise summary of what it does

EXAMPLE MINIMAL WORKFLOW:
{{
  "name": "BWA Align",
  "nodes": [
    {{
      "id": "align_1",
      "type": "tool",
      "plugin_id": "bwa_mem",
      "label": "BWA MEM Alignment",
      "params": {{"threads": "4"}},
      "inputs_map": {{"reads_r1": "/data/sample_R1.fastq.gz", "reads_r2": "/data/sample_R2.fastq.gz", "reference": "/ref/hg38.fa"}},
      "outputs_map": {{"aligned_sam": "/data/output/aligned.sam"}}
    }}
  ],
  "edges": []
}}"""


# ── Pydantic models ──────────────────────────────────────────────────────────

class BuildWorkflowRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None       # if None, uses settings provider
    model: Optional[str] = None          # if None, uses settings model
    api_key: Optional[str] = None        # if None, uses settings api_key
    api_base: Optional[str] = None
    context_files: Optional[List[str]] = []   # input paths to give context to LLM
    existing_workflow: Optional[Dict[str, Any]] = None  # for refine


class BuildWorkflowResponse(BaseModel):
    workflow: Optional[Dict[str, Any]]
    validation_errors: List[str]
    is_valid: bool
    model_used: str
    provider_used: str
    duration_ms: int
    raw_response: str   # raw LLM response for debugging


# ── Core builder function ─────────────────────────────────────────────────────

async def build_workflow_from_prompt(
    request: BuildWorkflowRequest,
    pm,
    engine,
    settings: Dict[str, Any],
) -> BuildWorkflowResponse:
    t0 = time.time()

    # 1. Resolve provider/model/api_key from settings if not in request
    llm_cfg = settings.get("llm_config", {})
    provider = request.provider or llm_cfg.get("provider", "anthropic")
    model    = request.model    or llm_cfg.get("model", "")
    api_key  = request.api_key  or llm_cfg.get("api_key", "")
    api_base = request.api_base or llm_cfg.get("api_base", "")

    # Strip the "(Embedded OffLine List)" label that the /api/llm/models endpoint
    # appends to fallback model names — LLM APIs reject these suffixed strings.
    _OFFLINE_LABEL = " (Embedded OffLine List)"
    if model and _OFFLINE_LABEL in model:
        model = model.replace(_OFFLINE_LABEL, "").strip()

    # 2. Collect available plugins (compact to avoid blowing up context)
    raw_plugins = pm.list_plugins() if hasattr(pm, 'list_plugins') else [t.model_dump() for t in pm.list_tools()]
    plugins_compact = []
    for p in raw_plugins:
        plugins_compact.append({
            "id": p.get("id"),
            "name": p.get("name"),
            "description": p.get("description", ""),
            "category": p.get("category", ""),
            "template": p.get("template", ""),   # crucial for the LLM to know parameters
        })
    plugins_json = json.dumps(plugins_compact, indent=2)

    # 3. Collect workflow schema
    from core.models import WorkflowDefinition
    schema_json = json.dumps(WorkflowDefinition.model_json_schema(), indent=2)

    # 4. Build system prompt
    system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        plugins_json=plugins_json,
        schema_json=schema_json,
    )

    # 5. Build user prompt
    user_parts = [request.prompt]

    if request.context_files:
        user_parts.append("\nInput files available:")
        for f in request.context_files:
            user_parts.append(f"  - {f}")

    # Refine mode: include existing workflow
    if request.existing_workflow:
        user_parts.append("\nExisting workflow to refine:")
        user_parts.append(json.dumps(request.existing_workflow, indent=2))
        user_parts.append("\nModify the workflow above according to the instructions. Return complete modified workflow.")

    user_prompt = "\n".join(user_parts)

    # 6. Call LLM (reuses functions from node_ai_agent.py)
    raw_response = ""
    try:
        from core.node_ai_agent import (
            _call_anthropic, _call_gemini, _call_openai_compatible
        )

        if provider in ("anthropic", "claude"):
            # Pass system_prompt via the dedicated system= parameter.
            # This is the correct Anthropic Messages API format and avoids 400 errors
            # that occur when a very large system prompt is mixed into the user message.
            raw_response = await _call_anthropic(
                prompt=user_prompt,
                model=model or "claude-3-5-haiku-20241022",
                max_tokens=4096,
                api_key=api_key or None,
                system=system_prompt,
            )
        elif provider == "gemini":
            raw_response = await _call_gemini(
                prompt=system_prompt + "\n\n" + user_prompt,
                model=model or "gemini-2.0-flash",
                api_key=api_key or None,
            )
        elif provider in ("openai", "grok", "ollama", "custom"):
            if provider == "grok" and not api_base:
                api_base = "https://api.x.ai/v1"
                model = model or "grok-2-latest"
            elif provider == "openai" and not api_base:
                api_base = "https://api.openai.com/v1"
                model = model or "gpt-4o-mini"
            elif not api_base:
                api_base = "http://localhost:11434/v1"
            raw_response = await _call_openai_compatible(
                prompt=system_prompt + "\n\n" + user_prompt,
                model=model or "gpt-4o-mini",
                max_tokens=4096,
                api_key=api_key or None,
                api_base=api_base.rstrip("/"),
            )
        else:
            raise ValueError(f"Provider '{provider}' not supported for workflow building")

    except Exception as exc:
        logger.error(f"LLM call failed in build_workflow: {exc}")
        return BuildWorkflowResponse(
            workflow=None,
            validation_errors=[f"LLM call failed: {exc}"],
            is_valid=False,
            model_used=model or "",
            provider_used=provider,
            duration_ms=int((time.time() - t0) * 1000),
            raw_response="",
        )

    # 7. Parse JSON from response
    workflow_dict = None
    parse_error = None
    try:
        # Strip possible markdown code fence
        clean = raw_response.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        workflow_dict = json.loads(clean)
    except json.JSONDecodeError as e:
        parse_error = f"LLM returned invalid JSON: {e}"
        logger.warning(f"JSON parse failed. Raw response: {raw_response[:500]}")

    # 8. Validate with engine
    validation_errors = []
    if parse_error:
        validation_errors.append(parse_error)
    elif workflow_dict:
        try:
            from core.models import WorkflowDefinition
            wf = WorkflowDefinition(**workflow_dict)
            validation_errors = engine.validate_workflow(wf)
        except Exception as e:
            validation_errors.append(f"Schema validation: {e}")

    return BuildWorkflowResponse(
        workflow=workflow_dict,
        validation_errors=validation_errors,
        is_valid=len(validation_errors) == 0,
        model_used=model or "",
        provider_used=provider,
        duration_ms=int((time.time() - t0) * 1000),
        raw_response=raw_response,
    )


# ── Plugin YAML Generator ────────────────────────────────────────────────────

_PLUGIN_YAML_SYSTEM_PROMPT = """You are an expert SeqNode-OS plugin author.
Generate a valid SeqNode-OS plugin YAML file for the bioinformatics tool described.

YAML STRUCTURE RULES:
1. Top-level fields: name, id, version, category, description, author, license, tags, install, runtime, params, inputs, outputs, command
2. id: lowercase snake_case (e.g. "samtools_view", "gatk_haplotypecaller")
3. install.method: one of: conda, pip, system, docker
4. install.conda_env: "seqnode" (default)
5. params: each key is a snake_case param name with subfields: type, label, default, description
6. param types: string, int, float, bool
7. inputs/outputs: each key is a port name with: type (file), extensions (list), label, required, description
8. command.template: bash script using {param_name} for params and {port_name} for inputs/outputs
9. command.shell: "/bin/bash"
10. Return ONLY valid YAML — no markdown fences, no explanation

MINIMAL EXAMPLE:
name: "FastQC Quality Control"
id: "fastqc"
version: "0.12.1"
category: "Quality Control"
description: FastQC quality assessment for raw sequencing reads.
author: "Babraham Bioinformatics"
license: "GPL-3.0"
tags: [fastqc, qc, quality, fastq]
install:
  method: conda
  conda_env: seqnode
  conda_package: "fastqc=0.12.1"
  conda_channels: [bioconda, conda-forge, defaults]
  binary: fastqc
runtime:
  type: conda
  conda_env: seqnode
params:
  threads:
    type: int
    label: "Threads"
    default: 4
    description: Number of threads.
inputs:
  reads:
    type: file
    extensions: [".fastq", ".fastq.gz", ".fq", ".fq.gz"]
    label: "Input FASTQ"
    required: true
    description: Input sequencing reads.
outputs:
  report_html:
    type: file
    extensions: [".html"]
    label: "HTML Report"
    description: FastQC HTML report.
command:
  template: |
    mkdir -p $(dirname {report_html})
    fastqc -t {threads} -o $(dirname {report_html}) {reads}
  shell: "/bin/bash"
"""


class GeneratePluginYamlRequest(BaseModel):
    tool_name: str           # e.g. "GATK HaplotypeCaller"
    tool_id: str             # e.g. "gatk_haplotypecaller"
    description: str         # what the tool does
    category: Optional[str] = "Bioinformatics"
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    api_base: Optional[str] = None


class GeneratePluginYamlResponse(BaseModel):
    yaml_content: str
    filename: str
    plugin_id: str
    ok: bool
    error: Optional[str] = None


async def generate_plugin_yaml(
    request: GeneratePluginYamlRequest,
    settings: Dict[str, Any],
) -> GeneratePluginYamlResponse:
    llm_cfg  = settings.get("llm_config", {})
    provider = request.provider or llm_cfg.get("provider", "anthropic")
    model    = request.model    or llm_cfg.get("model", "")
    api_key  = request.api_key  or llm_cfg.get("api_key", "")
    api_base = request.api_base or llm_cfg.get("api_base", "")

    _OFFLINE_LABEL = " (Embedded OffLine List)"
    if model and _OFFLINE_LABEL in model:
        model = model.replace(_OFFLINE_LABEL, "").strip()

    user_prompt = (
        f"Generate a complete SeqNode-OS plugin YAML for the following tool:\n\n"
        f"Tool name: {request.tool_name}\n"
        f"Plugin id: {request.tool_id}\n"
        f"Category: {request.category or 'Bioinformatics'}\n"
        f"Description: {request.description}\n\n"
        f"Include realistic parameters, inputs, outputs, and a working bash command template."
    )

    raw = ""
    try:
        from core.node_ai_agent import (
            _call_anthropic, _call_gemini, _call_openai_compatible
        )
        if provider in ("anthropic", "claude"):
            raw = await _call_anthropic(
                prompt=user_prompt,
                model=model or "claude-3-5-haiku-20241022",
                max_tokens=3000,
                api_key=api_key or None,
                system=_PLUGIN_YAML_SYSTEM_PROMPT,
            )
        elif provider == "gemini":
            raw = await _call_gemini(
                prompt=_PLUGIN_YAML_SYSTEM_PROMPT + "\n\n" + user_prompt,
                model=model or "gemini-2.0-flash",
                api_key=api_key or None,
            )
        elif provider in ("openai", "grok", "ollama", "custom"):
            if provider == "grok" and not api_base:
                api_base = "https://api.x.ai/v1"
                model = model or "grok-2-latest"
            elif provider == "openai" and not api_base:
                api_base = "https://api.openai.com/v1"
                model = model or "gpt-4o-mini"
            elif not api_base:
                api_base = "http://localhost:11434/v1"
            raw = await _call_openai_compatible(
                prompt=_PLUGIN_YAML_SYSTEM_PROMPT + "\n\n" + user_prompt,
                model=model or "gpt-4o-mini",
                max_tokens=3000,
                api_key=api_key or None,
                api_base=api_base.rstrip("/"),
            )
        else:
            raise ValueError(f"Provider '{provider}' not supported")
    except Exception as exc:
        logger.error(f"generate_plugin_yaml LLM error: {exc}")
        return GeneratePluginYamlResponse(
            yaml_content="", filename="", plugin_id=request.tool_id,
            ok=False, error=str(exc),
        )

    # Strip markdown fences if present
    clean = raw.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    filename = f"{request.tool_id}.yaml"
    return GeneratePluginYamlResponse(
        yaml_content=clean,
        filename=filename,
        plugin_id=request.tool_id,
        ok=True,
        error=None,
    )
