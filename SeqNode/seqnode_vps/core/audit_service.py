# core/audit_service.py
"""
SeqNode-OS Audit Service
Generates immutable audit documents for workflow runs.
Compatible with: FDA 21 CFR Part 11, ISO 15189, ANVISA RDC 786.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# ── Data structures ──────────────────────────────────────────────────────────

@dataclass
class AuditFileRef:
    path: str
    sha256: Optional[str]
    size_bytes: Optional[int]
    exists: bool


@dataclass
class AuditEntry:
    node_id: str
    node_type: str
    plugin_id: Optional[str]
    label: str
    commands_executed: List[str]       # exact commands extracted from logs
    input_files: List[AuditFileRef]
    output_files: List[AuditFileRef]
    started_at: Optional[str]
    finished_at: Optional[str]
    duration_seconds: Optional[float]
    status: str
    log_lines: List[str]               # relevant logs (INFO/ERROR)


@dataclass
class AuditDocument:
    document_id: str                   # = run_id
    seqnode_version: str
    generated_at: str                  # ISO 8601 UTC
    workflow_name: str
    workflow_id: Optional[str]
    run_status: str
    total_duration_seconds: Optional[float]
    entries: List[AuditEntry]
    workflow_snapshot: Dict[str, Any]  # complete workflow snapshot
    system_snapshot: Dict[str, Any]    # system_info at run time
    integrity_checksum: str            # SHA256 of document without this field


# ── Helpers ──────────────────────────────────────────────────────────────────

def _sha256_file(path: str) -> Optional[str]:
    """SHA256 of a file. Returns None if not accessible."""
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except (OSError, IOError):
        return None


def _file_ref(path: str) -> AuditFileRef:
    if not path:
        return AuditFileRef(path=path, sha256=None, size_bytes=None, exists=False)
    exists = os.path.exists(path)
    return AuditFileRef(
        path=os.path.abspath(path),
        sha256=_sha256_file(path) if exists else None,
        size_bytes=os.path.getsize(path) if exists else None,
        exists=exists,
    )


def _extract_commands(logs: list) -> List[str]:
    """Extract command lines from logs (patterns: [CMD], Executing:, Command:, Running:)."""
    commands = []
    patterns = [
        re.compile(r'\[CMD\]\s+(.+)'),
        re.compile(r'Executing:\s+(.+)'),
        re.compile(r'Command:\s+(.+)'),
        re.compile(r'Running:\s+(.+)'),
    ]
    for log in logs:
        msg = log.message if hasattr(log, 'message') else log.get('message', '')
        for pat in patterns:
            m = pat.search(msg)
            if m:
                commands.append(m.group(1).strip())
                break
    return commands


def _get_seqnode_version() -> str:
    try:
        import importlib.metadata
        return importlib.metadata.version("seqnode-os")
    except Exception:
        try:
            setup_py = os.path.join(os.path.dirname(__file__), "..", "setup.py")
            with open(setup_py) as f:
                m = re.search(r'version=["\']([^"\']+)', f.read())
                return m.group(1) if m else "unknown"
        except Exception:
            return "unknown"


# ── Main builder ─────────────────────────────────────────────────────────────

def build_audit_document(
    run_state,
    workflow_def: Optional[Dict[str, Any]],
    system_info: Dict[str, Any],
) -> AuditDocument:
    """
    Builds AuditDocument from WorkflowState.
    run_state: WorkflowState (model_dump() or Pydantic object)
    workflow_def: dict of original workflow (optional)
    system_info: result of get_system_info()
    """
    state = run_state.model_dump() if hasattr(run_state, 'model_dump') else run_state
    logs_all = state.get("logs", [])

    entries: List[AuditEntry] = []

    nodes_def = {}
    if workflow_def:
        for n in workflow_def.get("nodes", []):
            nodes_def[n.get("id", "")] = n

    for node_id, node_status in state.get("node_statuses", {}).items():
        node_def = nodes_def.get(node_id, {})
        node_logs = [l for l in logs_all if (l.get("node_id") if isinstance(l, dict) else l.node_id) == node_id]

        # Extract input/output files from node_def
        inputs = [_file_ref(v) for v in node_def.get("inputs_map", {}).values() if v]
        outputs = [_file_ref(v) for v in node_def.get("outputs_map", {}).values() if v]

        node_log_msgs = [l.get("message", "") if isinstance(l, dict) else l.message for l in node_logs]
        important_logs = [m for m in node_log_msgs if any(kw in m.upper() for kw in ["CMD", "ERROR", "WARN", "EXEC", "RUNNING"])]

        entries.append(AuditEntry(
            node_id=node_id,
            node_type=node_def.get("type", "unknown"),
            plugin_id=node_def.get("plugin_id"),
            label=node_def.get("label", node_id),
            commands_executed=_extract_commands(node_logs),
            input_files=inputs,
            output_files=outputs,
            started_at=None,
            finished_at=None,
            duration_seconds=None,
            status=node_status,
            log_lines=important_logs[:50],  # max 50 relevant lines
        ))

    # Calculate total duration
    started = state.get("started_at")
    finished = state.get("finished_at")
    duration = None
    if started and finished:
        try:
            s = datetime.fromisoformat(started.replace("Z", "+00:00"))
            f = datetime.fromisoformat(finished.replace("Z", "+00:00"))
            duration = (f - s).total_seconds()
        except Exception:
            pass

    # Build document without checksum
    doc = AuditDocument(
        document_id=state.get("run_id", "unknown"),
        seqnode_version=_get_seqnode_version(),
        generated_at=datetime.now(timezone.utc).isoformat(),
        workflow_name=workflow_def.get("name", "Unknown") if workflow_def else state.get("workflow_name", "Unknown"),
        workflow_id=workflow_def.get("id") if workflow_def else None,
        run_status=state.get("status", "unknown"),
        total_duration_seconds=duration,
        entries=entries,
        workflow_snapshot=workflow_def or {},
        system_snapshot=system_info,
        integrity_checksum="",  # calculated below
    )

    # Calculate checksum (auto-seal)
    doc_dict = asdict(doc)
    doc_dict.pop("integrity_checksum")
    checksum = hashlib.sha256(json.dumps(doc_dict, sort_keys=True).encode()).hexdigest()
    doc.integrity_checksum = checksum

    return doc


# ── Export functions ──────────────────────────────────────────────────────────

def export_audit_json(doc: AuditDocument) -> Dict[str, Any]:
    return asdict(doc)


def export_audit_json_ld(doc: AuditDocument) -> Dict[str, Any]:
    """JSON-LD serialization with Dublin Core + schema.org context."""
    base = asdict(doc)
    return {
        "@context": {
            "dc": "http://purl.org/dc/elements/1.1/",
            "schema": "https://schema.org/",
            "seqnode": "https://seqnode.dev/audit/v1#",
            "prov": "http://www.w3.org/ns/prov#"
        },
        "@type": "seqnode:AuditDocument",
        "dc:identifier": doc.document_id,
        "dc:created": doc.generated_at,
        "dc:title": f"Audit: {doc.workflow_name}",
        "schema:softwareVersion": doc.seqnode_version,
        "seqnode:runStatus": doc.run_status,
        "seqnode:integrityChecksum": doc.integrity_checksum,
        "seqnode:entries": base["entries"],
        "seqnode:workflowSnapshot": base["workflow_snapshot"],
        "seqnode:systemSnapshot": base["system_snapshot"],
    }


def export_audit_pdf(doc: AuditDocument) -> bytes:
    """
    Generates PDF audit report.
    Tries ReportLab first; fallback to fpdf2; fallback to HTML as bytes.
    """
    try:
        return _pdf_reportlab(doc)
    except ImportError:
        pass
    try:
        return _pdf_fpdf2(doc)
    except ImportError:
        pass
    # Fallback: simple HTML
    html = _audit_html(doc)
    return html.encode("utf-8")


def _pdf_reportlab(doc: AuditDocument) -> bytes:
    from io import BytesIO
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.pagesizes import A4

    buf = BytesIO()
    pdf = SimpleDocTemplate(buf, pagesize=A4, title=f"Audit {doc.document_id}")
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("SeqNode-OS Audit Report", styles['Title']))
    story.append(Paragraph(f"Run ID: {doc.document_id}", styles['Normal']))
    story.append(Paragraph(f"Workflow: {doc.workflow_name}", styles['Normal']))
    story.append(Paragraph(f"Status: {doc.run_status}", styles['Normal']))
    story.append(Paragraph(f"Generated: {doc.generated_at}", styles['Normal']))
    story.append(Paragraph(f"SeqNode version: {doc.seqnode_version}", styles['Normal']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Integrity SHA256: {doc.integrity_checksum}", styles['Code']))
    story.append(Spacer(1, 20))

    for entry in doc.entries:
        story.append(Paragraph(f"Node: {entry.label} ({entry.node_id})", styles['Heading2']))
        story.append(Paragraph(f"Type: {entry.node_type} | Plugin: {entry.plugin_id or 'N/A'} | Status: {entry.status}", styles['Normal']))
        for cmd in entry.commands_executed:
            story.append(Paragraph(f"CMD: {cmd}", styles['Code']))
        story.append(Spacer(1, 8))

    pdf.build(story)
    return buf.getvalue()


def _pdf_fpdf2(doc: AuditDocument) -> bytes:
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "SeqNode-OS Audit Report", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 6, f"Run ID: {doc.document_id}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Workflow: {doc.workflow_name}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Status: {doc.run_status}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Generated: {doc.generated_at}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Checksum: {doc.integrity_checksum}", new_x="LMARGIN", new_y="NEXT")
    for entry in doc.entries:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 6, f"{entry.label} [{entry.status}]", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", size=9)
        for cmd in entry.commands_executed:
            pdf.multi_cell(0, 5, f"  CMD: {cmd}")
    return pdf.output()


def _audit_html(doc: AuditDocument) -> str:
    rows = ""
    for e in doc.entries:
        cmds = "<br>".join(e.commands_executed) or "—"
        rows += f"<tr><td>{e.node_id}</td><td>{e.plugin_id or '—'}</td><td>{e.status}</td><td><code>{cmds}</code></td></tr>"
    return f"""<!DOCTYPE html>
<html><head><meta charset='utf-8'><title>Audit {doc.document_id}</title></head>
<body>
<h1>SeqNode-OS Audit Report</h1>
<p>Run ID: {doc.document_id}</p>
<p>Workflow: {doc.workflow_name}</p>
<p>Status: {doc.run_status}</p>
<p>Generated: {doc.generated_at}</p>
<p>Checksum: <code>{doc.integrity_checksum}</code></p>
<table border='1'><tr><th>Node</th><th>Plugin</th><th>Status</th><th>Commands</th></tr>
{rows}
</table>
</body></html>"""
