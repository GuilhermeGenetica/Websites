"""
core/io_resolver.py
───────────────────
I/O resolution and batch-expansion utilities.
All functions are pure (no executor, no state) — they operate only on
plugin manifests, node definitions, workflow state snapshots, and the filesystem.

Extracted from workflow_engine.py — function bodies are 100% identical to the originals.
"""

import os
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

from core.models import (
    WorkflowNodeDef,
    WorkflowState,
    PluginManifest,
)

logger = logging.getLogger("seqnode.engine")


# ─────────────────────────────────────────────────────────────────────────────
#  Directory-mode detection
# ─────────────────────────────────────────────────────────────────────────────

def is_dir_mode(path: str) -> bool:
    """
    Returns True if the path represents a directory-scan / directory-output intent:
      - ends with / or \\
      - is a path that already exists as a directory on disk
    Empty strings and $ref values are NOT dir-mode.
    """
    if not path or path.startswith("$"):
        return False
    return path.endswith("/") or path.endswith("\\") or os.path.isdir(path)


# ─────────────────────────────────────────────────────────────────────────────
#  Directory scanning
# ─────────────────────────────────────────────────────────────────────────────

def list_dir_files(dir_path: str, extensions: Optional[List[str]] = None) -> List[str]:
    """
    Scan a directory for files, optionally filtered by extension list.
    Returns a sorted list of absolute paths. No duplicates, no subdirectories.
    Safe against repeated calls — uses a seen-set to guarantee no duplicates.
    """
    clean = dir_path.rstrip("/\\")
    if not os.path.isdir(clean):
        return []

    seen: set = set()
    files: List[str] = []
    ext_lower = [e.lower().lstrip(".") for e in extensions] if extensions else []

    for fname in sorted(os.listdir(clean)):
        fpath = os.path.join(clean, fname)
        if not os.path.isfile(fpath):
            continue
        abs_path = os.path.abspath(fpath)
        if abs_path in seen:
            continue
        seen.add(abs_path)
        if ext_lower:
            # Match any of the allowed extensions (handles .fastq.gz, .bam, etc.)
            fname_lower = fname.lower()
            matched = any(
                fname_lower.endswith("." + e) or fname_lower.endswith(e)
                for e in ext_lower
            )
            if not matched:
                continue
        files.append(abs_path)

    return files


# ─────────────────────────────────────────────────────────────────────────────
#  Auto output naming
# ─────────────────────────────────────────────────────────────────────────────

def auto_output_name(
    input_path: str,
    out_dir: str,
    plugin_id: str,
    out_key: str,
    expected_ext: str = "",
) -> str:
    """
    Generate an output filename based on the input file stem.
    Guarantees:
      1. Does NOT overwrite the input file (adds suffix if same path).
      2. Does NOT collide with existing files (adds _NNN counter).
      3. Maintains nexus: sample.fastq.gz → sample.aligned.bam (stem preserved).
      4. Falls back gracefully if the target output directory is not writable
         (e.g. /data/output without sudo): uses the input file's directory first,
         then the current working directory as last resort.
    """
    # ── Try to create/use out_dir; fall back if not writable ──────────────
    _tried = []
    _candidates = [out_dir]
    if input_path:
        _candidates.append(os.path.dirname(os.path.abspath(input_path)) or ".")
    _candidates.append(".")

    for _dir in _candidates:
        try:
            os.makedirs(_dir, exist_ok=True)
            out_dir = _dir
            break
        except (PermissionError, OSError) as _exc:
            _tried.append(f"{_dir!r}: {_exc}")
            continue
    else:
        # All candidates failed — use cwd string directly without makedirs
        out_dir = "."
        logger.warning(
            f"auto_output_name: could not create any output directory "
            f"({'; '.join(_tried)}). Using current working directory."
        )

    # Strip compound extensions (.fastq.gz, .fq.gz, .vcf.gz, .tar.gz, etc.)
    stem = os.path.basename(input_path)
    for compound in (".fastq.gz", ".fq.gz", ".vcf.gz", ".bcf.gz",
                     ".tar.gz", ".tar.bz2", ".tar.xz"):
        if stem.lower().endswith(compound):
            stem = stem[: -len(compound)]
            break
    else:
        stem = os.path.splitext(stem)[0]

    # Build suffix from out_key; skip generic names
    generic_keys = {"output", "out", "result", "file", "outfile", "output_file"}
    suffix = out_key if out_key.lower() not in generic_keys else plugin_id

    ext = expected_ext if expected_ext else ""
    if ext and not ext.startswith("."):
        ext = "." + ext

    candidate = os.path.join(out_dir, f"{stem}.{suffix}{ext}")

    # Never overwrite the input
    if os.path.abspath(candidate) == os.path.abspath(input_path):
        candidate = os.path.join(out_dir, f"{stem}.{suffix}_out{ext}")

    # Avoid collision with already-existing output files
    base_candidate = candidate
    counter = 1
    while os.path.exists(candidate) and counter < 9999:
        name_no_ext, ext2 = os.path.splitext(base_candidate)
        candidate = f"{name_no_ext}_{counter:03d}{ext2}"
        counter += 1

    return candidate


# ─────────────────────────────────────────────────────────────────────────────
#  Batch expansion
# ─────────────────────────────────────────────────────────────────────────────

def expand_batch_for_node(
    node_def: WorkflowNodeDef,
    plugin: PluginManifest,
) -> Optional[Dict[str, List[str]]]:
    """
    Check if any inputs_map entry is a directory-mode path.
    If yes, scan each dir-mode input and return:
        { input_key: [file1, file2, ...], ... }
    The batch size is the length of the longest file list.
    Returns None if no directory inputs are found.
    """
    dir_inputs: Dict[str, List[str]] = {}

    for key, val in node_def.inputs_map.items():
        if not val or val.startswith("$"):
            continue
        if not is_dir_mode(val):
            continue

        inp_spec = (plugin.inputs or {}).get(key)
        extensions = list(inp_spec.extensions or []) if inp_spec and inp_spec.extensions else []

        files = list_dir_files(val, extensions or None)
        if files:
            dir_inputs[key] = files
        else:
            logger.warning(
                f"Node '{node_def.id}': directory '{val}' for input '{key}' "
                f"is empty or has no matching files."
            )

    return dir_inputs if dir_inputs else None


# ─────────────────────────────────────────────────────────────────────────────
#  Full I/O resolution for a single execution unit
# ─────────────────────────────────────────────────────────────────────────────
def resolve_io_for_execution(
    node_def: WorkflowNodeDef,
    plugin: PluginManifest,
    state: WorkflowState,
    predecessors: List[str],
    settings: Dict[str, Any],
    file_index: int = 0,
    dir_inputs: Optional[Dict[str, List[str]]] = None,
) -> Tuple[Dict[str, str], Dict[str, str]]:
    """
    Resolve inputs and outputs for a single execution unit (one file or one batch item).

    Resolution order for inputs:
      1. Explicit $ref → resolved from predecessor node_outputs
      2. Global $ref scan for any node outputs (not just predecessors)
      3. Directory-mode → specific file at file_index from dir_inputs
      4. Empty input → auto-fill from first matching predecessor output (by extension)

    Resolution order for outputs:
      1. Explicit file path → used as-is
      2. Directory-mode (ends with /) → auto-name inside that dir
      3. Empty → auto-name in settings output_dir, or same dir as first input,
         or current working directory as last resort

    Returns (resolved_inputs, resolved_outputs) — both are dicts of str→str.
    """
    resolved_inputs  = dict(node_def.inputs_map)
    resolved_outputs = dict(node_def.outputs_map)

    settings = settings or {}
    output_dir_fallback = settings.get("dirs", {}).get("output", "") or ""

    # ── Step 1: Resolve $ref inputs from direct predecessors ──────────────
    for pred_id in predecessors:
        pred_outputs = state.node_outputs.get(pred_id, {})
        for key, val in list(resolved_inputs.items()):
            if isinstance(val, str) and val.startswith("$"):
                ref_parts = val[1:].split(".")
                if len(ref_parts) == 2 and ref_parts[0] == pred_id:
                    out_key = ref_parts[1]
                    if out_key in pred_outputs:
                        resolved_inputs[key] = pred_outputs[out_key]

    # ── Step 2: Resolve any remaining $refs from any completed node ───────
    for key, val in list(resolved_inputs.items()):
        if isinstance(val, str) and val.startswith("$"):
            ref_parts = val[1:].split(".")
            if len(ref_parts) == 2:
                ref_node_id, out_key = ref_parts
                node_out = state.node_outputs.get(ref_node_id, {})
                if out_key in node_out:
                    resolved_inputs[key] = node_out[out_key]

    # ── Step 3: Replace dir-mode inputs with specific file at file_index ──
    if dir_inputs:
        for key, file_list in dir_inputs.items():
            if file_index < len(file_list):
                resolved_inputs[key] = file_list[file_index]
            else:
                logger.warning(
                    f"Node '{node_def.id}': file_index {file_index} out of range "
                    f"for dir-input '{key}' ({len(file_list)} files)."
                )

    # ── Step 4: Auto-fill empty inputs from predecessor outputs ───────────
    if predecessors:
        # Collect all outputs from all predecessors, preserving order
        all_pred_outputs: List[Tuple[str, str]] = []
        for pred_id in predecessors:
            for out_key, out_val in state.node_outputs.get(pred_id, {}).items():
                if out_val and not out_val.startswith("$"):
                    all_pred_outputs.append((out_key, out_val))

        for inp_key in list(plugin.inputs.keys()):
            if resolved_inputs.get(inp_key):
                continue  # already resolved
            inp_spec   = plugin.inputs.get(inp_key)
            inp_exts   = [e.lower().lstrip(".") for e in (inp_spec.extensions or [])] if inp_spec else []

            matched_val = None
            if inp_exts:
                for _, out_val in all_pred_outputs:
                    out_lower = out_val.lower()
                    if any(out_lower.endswith("." + e) or out_lower.endswith(e) for e in inp_exts):
                        matched_val = out_val
                        break
            if matched_val is None and all_pred_outputs:
                # No extension match — take first available predecessor output
                matched_val = all_pred_outputs[0][1]

            if matched_val:
                resolved_inputs[inp_key] = matched_val
                logger.info(
                    f"Node '{node_def.id}': auto-filled input '{inp_key}' "
                    f"from predecessor output: {matched_val}"
                )

    # ── Step 5: Pre-populate resolved_outputs with plugin output keys ──────
    # ONLY pre-populate outputs that are either:
    #   a) required: true  → always auto-name (most tool plugins)
    #   b) required: false AND already present in outputs_map → user connected them
    #
    # Optional outputs NOT in outputs_map are intentionally skipped.
    # This prevents auto_output_name from trying to create inaccessible directories
    # (e.g. /data/output) for unused optional ports like shell_cmd's output_file2-5.
    for out_key, out_spec in (plugin.outputs or {}).items():
        if out_key in resolved_outputs:
            continue  # already set by user (explicit path or $ref)
        is_required = getattr(out_spec, "required", True)
        if is_required:
            # Required output not yet set → mark for auto-naming
            resolved_outputs[out_key] = ""

    # ── Step 6: Resolve outputs ───────────────────────────────────────────
    # Determine the "primary" resolved input for auto-naming basis
    first_real_input = next(
        (v for v in resolved_inputs.values() if v and not v.startswith("$") and not is_dir_mode(v)),
        None,
    )

    for key, val in list(resolved_outputs.items()):
        out_spec     = (plugin.outputs or {}).get(key)
        raw_exts     = (out_spec.extensions or []) if out_spec and out_spec.extensions else []
        expected_ext = raw_exts[0] if raw_exts else ""
        if expected_ext and not expected_ext.startswith("."):
            expected_ext = "." + expected_ext

        is_dir_out = is_dir_mode(val)
        is_empty   = not val

        if not (is_dir_out or is_empty):
            continue  # explicit file path — keep as-is

        # Determine output directory
        if is_dir_out:
            out_dir = val.rstrip("/\\")
        elif output_dir_fallback:
            out_dir = output_dir_fallback
        elif first_real_input:
            out_dir = os.path.dirname(first_real_input) or "."
        else:
            out_dir = "."

        if first_real_input:
            resolved_outputs[key] = auto_output_name(
                input_path=first_real_input,
                out_dir=out_dir,
                plugin_id=plugin.id,
                out_key=key,
                expected_ext=expected_ext,
            )
        else:
            # No input available for naming — generate timestamped name
            ts   = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            name = f"{plugin.id}_{key}_{ts}{expected_ext}"
            resolved_outputs[key] = os.path.join(out_dir, name)

    return resolved_inputs, resolved_outputs