/**
 * modules/node-types.jsx — SeqNode-OS Special Node Types
 *
 * Exports:
 * SPECIAL_NODE_DEFS                 — special node definitions
 * SpecialNodesSidebar               — React component for sidebar
 * SpecialNodeProperties             — React component for PropertiesPanel
 * updateConditionRule(node, field, val)
 * updateConditionBranch(node, branch, val)
 */

import React, { useState, useCallback } from "react";
import { openFileBrowser } from "./props-io.js";

/* ════════════════════════════════════════════════════════════
   Special node definitions
   ════════════════════════════════════════════════════════════ */

export const SPECIAL_NODE_DEFS = [
    {
        type:  "subworkflow",
        label: "Sub-Workflow",
        icon:  "\u2937",
        cls:   "sni-subworkflow",
        desc:  "Nest another workflow as a single node",
    },
    {
        type:  "condition",
        label: "Condition",
        icon:  "\u25C6",
        cls:   "sni-condition",
        desc:  "Branch execution based on a rule",
    },
    {
        type:  "ai_agent",
        label: "AI Agent",
        icon:  "\u2726",
        cls:   "sni-ai_agent",
        desc:  "Call an LLM or HTTP endpoint",
    },
    {
        type:  "pause",
        label: "Pause",
        icon:  "\u23F8",
        cls:   "sni-pause",
        desc:  "Wait for manual approval before continuing",
    },
    {
        type:  "loop",
        label: "Loop",
        icon:  "\u21BA",
        cls:   "sni-loop",
        desc:  "Repeat a node over a list of items",
    },
];

/* ════════════════════════════════════════════════════════════
   SpecialNodesSidebar — React component
   ════════════════════════════════════════════════════════════ */

export function SpecialNodesSidebar({ onAddNode }) {
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem("gf_control_nodes_collapsed") === "1";
    });

    const toggleCollapsed = useCallback(() => {
        setCollapsed(c => {
            const next = !c;
            localStorage.setItem("gf_control_nodes_collapsed", next ? "1" : "0");
            return next;
        });
    }, []);

    const onDragStart = useCallback((ev, nodeType) => {
        ev.dataTransfer.setData("special_node_type", nodeType);
        ev.dataTransfer.effectAllowed = "copy";
    }, []);

    return (
        <div id="special-nodes-panel" className="special-nodes-section">
            <div
                id="special-nodes-header"
                title="Click to collapse / expand Control Nodes"
                onClick={toggleCollapsed}
                style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "space-between",
                    padding:        "5px 8px",
                    cursor:         "pointer",
                    userSelect:     "none",
                    fontSize:       "11px",
                    fontWeight:     600,
                    textTransform:  "uppercase",
                    letterSpacing:  "0.5px",
                    color:          "var(--text-secondary, #888)",
                    borderTop:      "1px solid var(--border, #333)",
                    marginTop:      "4px",
                    boxSizing:      "border-box",
                }}
            >
                <span>Control Nodes</span>
                <span style={{ fontSize: "10px", display: "inline-block" }}>
                    {collapsed ? "\u25B6" : "\u25BC"}
                </span>
            </div>

            <div
                id="special-nodes-items"
                style={{
                    overflow:   "hidden",
                    maxHeight:  collapsed ? "0px" : "600px",
                    transition: "max-height 0.22s ease",
                }}
            >
                {SPECIAL_NODE_DEFS.map(def => (
                    <div
                        key={def.type}
                        className="special-node-item"
                        title={def.desc}
                        draggable
                        data-node-type={def.type}
                        onDragStart={ev => onDragStart(ev, def.type)}
                        onDoubleClick={() => onAddNode?.(def.type)}
                    >
                        <div className={"special-node-icon " + def.cls}>{def.icon}</div>
                        <span>{def.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   Componentes React de Propriedades dos Nós Especiais
   ════════════════════════════════════════════════════════════ */

export function SubworkflowNode({ node, updateNodeParam }) {
    const p = node.params || {};
    return (
        <div>
            <h3 style={{ marginTop: 14 }}>&#x2934; Sub-Workflow</h3>
            <div className="prop-group">
                <label className="prop-label">Workflow File (.json)</label>
                <div className="fp-input-row">
                    <input type="text" className="fp-edit prop-input"
                        value={p.workflow_ref || ""}
                        placeholder="path/to/workflow.json or workflow_id"
                        onChange={(e) => updateNodeParam("workflow_ref", e.target.value)} />
                    <button className="btn-small btn-browse-file" title="Browse"
                        onClick={() => openFileBrowser("", ".json", (path) => updateNodeParam("workflow_ref", path), "file")}>
                        &#x1F4C2;
                    </button>
                </div>
                <div className="prop-desc">Reference a saved workflow by file path or ID. Outputs are prefixed with the sub-node IDs.</div>
            </div>
        </div>
    );
}

export function ConditionNode({ node, updateNodeParam }) {
    const p    = node.params || {};
    const rule = p.condition || {};
    const ops  = ["==", "!=", ">", ">=", "<", "<=", "in", "contains", "startswith", "endswith"];

    const handleRuleChange = (field, val) => {
        updateNodeParam("condition", { ...rule, [field]: val });
    };

    const handleBranchChange = (branch, val) => {
        updateNodeParam(branch, val.split(",").map(s => s.trim()).filter(Boolean));
    };

    return (
        <div>
            <h3 style={{ marginTop: 14 }}>&#x25C6; Condition</h3>
            <div className="prop-desc" style={{ marginBottom: 8 }}>Evaluate a rule and branch the workflow. Nodes listed in <code>on_true</code> proceed; others in <code>on_false</code> are skipped.</div>

            <div className="prop-group">
                <label className="prop-label">Left Value</label>
                <input type="text" className="prop-input" value={rule.left || ""} placeholder="$node_id.output_key or literal" onChange={e => handleRuleChange("left", e.target.value)} />
            </div>

            <div className="prop-group">
                <label className="prop-label">Operator</label>
                <select className="prop-input" value={rule.op || ""} onChange={e => handleRuleChange("op", e.target.value)}>
                    <option value="" disabled></option>
                    {ops.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
            </div>

            <div className="prop-group">
                <label className="prop-label">Right Value</label>
                <input type="text" className="prop-input" value={rule.right || ""} placeholder="literal or $ref" onChange={e => handleRuleChange("right", e.target.value)} />
            </div>

            <div className="prop-group">
                <label className="prop-label">On True — node IDs (comma-separated)</label>
                <input type="text" className="prop-input" value={(p.on_true || []).join(",")} onChange={e => handleBranchChange("on_true", e.target.value)} />
            </div>

            <div className="prop-group">
                <label className="prop-label">On False — node IDs (comma-separated)</label>
                <input type="text" className="prop-input" value={(p.on_false || []).join(",")} onChange={e => handleBranchChange("on_false", e.target.value)} />
            </div>
        </div>
    );
}

export function AiAgentNode({ node, updateNodeParam }) {
    const p         = node.params || {};
    const providers = ["anthropic", "openai", "mcp", "http"];

    return (
        <div>
            <h3 style={{ marginTop: 14 }}>&#x2726; AI Agent</h3>

            <div className="prop-group">
                <label className="prop-label">Provider</label>
                <select className="prop-input" value={p.provider || providers[0]} onChange={e => updateNodeParam("provider", e.target.value)}>
                    {providers.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
            </div>

            <div className="prop-group">
                <label className="prop-label">Model</label>
                <input type="text" className="prop-input" value={p.model || ""} placeholder="claude-sonnet-4-6 / gpt-4o / &#x2026;" onChange={e => updateNodeParam("model", e.target.value)} />
            </div>

            <div className="prop-group">
                <label className="prop-label">Prompt Template</label>
                <textarea className="prop-input" rows="5" style={{ fontFamily: "monospace", fontSize: 11 }} value={p.prompt || ""} placeholder="Use $ref:node_id.output_key to inject upstream values" onChange={e => updateNodeParam("prompt", e.target.value)} />
                <div className="prop-desc">Use <code>$ref:nodeId.outputKey</code> to inject upstream values.</div>
            </div>

            <div className="prop-group">
                <label className="prop-label">Max Tokens</label>
                <input type="number" className="prop-input" value={p.max_tokens || 1000} onChange={e => updateNodeParam("max_tokens", Number(e.target.value))} />
            </div>

            {p.provider === "http" && (
                <div className="prop-group">
                    <label className="prop-label">HTTP URL</label>
                    <input type="text" className="prop-input" value={p.url || ""} placeholder="https://&#x2026;/v1/chat/completions" onChange={e => updateNodeParam("url", e.target.value)} />
                </div>
            )}

            <div className="prop-group">
                <label className="prop-label">Output File Path (optional)</label>
                <input type="text" className="prop-input" value={p.output_file || ""} placeholder="leave empty to pass via memory" onChange={e => updateNodeParam("output_file", e.target.value)} />
            </div>
        </div>
    );
}

export function PauseNode({ node, updateNodeParam, currentRunId, onApprovePause }) {
    const p              = node.params || {};
    const onTimeoutOpts  = ["fail", "skip", "continue"];

    return (
        <div>
            <h3 style={{ marginTop: 14 }}>&#x23F8; Pause / Approval Gate</h3>
            <div className="prop-desc" style={{ marginBottom: 8 }}>Stops workflow execution and waits for a manual approval via the UI or API before continuing downstream nodes.</div>

            <div className="prop-group">
                <label className="prop-label">Message (shown to approver)</label>
                <textarea className="prop-input" rows="3" value={p.message || ""} onChange={e => updateNodeParam("message", e.target.value)} />
            </div>

            <div className="prop-group">
                <label className="prop-label">Timeout (seconds, 0 = no timeout)</label>
                <input type="number" className="prop-input" value={p.timeout_s || 0} onChange={e => updateNodeParam("timeout_s", Number(e.target.value))} />
            </div>

            <div className="prop-group">
                <label className="prop-label">On Timeout</label>
                <select className="prop-input" value={p.on_timeout || ""} onChange={e => updateNodeParam("on_timeout", e.target.value)}>
                    <option value="" disabled></option>
                    {onTimeoutOpts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>

            <div className="prop-group">
                <label className="prop-label">Auto-Approve</label>
                <input type="checkbox" checked={!!p.auto_approve} onChange={e => updateNodeParam("auto_approve", e.target.checked)} />
                <span className="prop-desc" style={{ display: "inline", marginLeft: 6 }}>Skip manual step in automated runs</span>
            </div>

            {currentRunId && (
                <div style={{ marginTop: 10 }}>
                    <button className="btn-small" style={{ background: "var(--success)" }} onClick={() => onApprovePause?.(currentRunId, node.id, true)}>&#x2714; Approve</button>{" "}
                    <button className="btn-small" style={{ background: "var(--error)" }} onClick={() => onApprovePause?.(currentRunId, node.id, false)}>&#x274C; Reject</button>
                </div>
            )}
        </div>
    );
}

export function LoopNode({ node, updateNodeParam }) {
    const p = node.params || {};

    return (
        <div>
            <h3 style={{ marginTop: 14 }}>&#x21BA; Loop</h3>
            <div className="prop-desc" style={{ marginBottom: 8 }}>Iterates a body node over a list of items. Results are collected and merged as semicolon-joined strings in outputs.</div>

            <div className="prop-group">
                <label className="prop-label">Items Source</label>
                <input type="text" className="prop-input" value={p.items || ""} placeholder="item1;item2;item3  or  $ref:node.key  or  {from:0,to:10,step:1}" onChange={e => updateNodeParam("items", e.target.value)} />
                <div className="prop-desc">Semicolon list, <code>$ref:node.key</code> upstream ref, or range object.</div>
            </div>

            <div className="prop-group">
                <label className="prop-label">Body Node ID</label>
                <input type="text" className="prop-input" value={p.body_node || ""} placeholder="node_id to execute per item (optional)" onChange={e => updateNodeParam("body_node", e.target.value)} />
            </div>

            <div className="prop-group">
                <label className="prop-label">Parallel</label>
                <input type="checkbox" checked={!!p.parallel} onChange={e => updateNodeParam("parallel", e.target.checked)} />
                <span className="prop-desc" style={{ display: "inline", marginLeft: 6 }}>Run iterations concurrently</span>
            </div>

            <div className="prop-group">
                <label className="prop-label">Fail Fast</label>
                <input type="checkbox" checked={p.fail_fast !== false} onChange={e => updateNodeParam("fail_fast", e.target.checked)} />
                <span className="prop-desc" style={{ display: "inline", marginLeft: 6 }}>Abort on first iteration failure</span>
            </div>
        </div>
    );
}

export function SpecialNodeProperties({ node, updateNodeParam, currentRunId, onApprovePause }) {
    if (!node) return null;
    const type = node.node_type || "tool";

    switch (type) {
        case "subworkflow": return <SubworkflowNode node={node} updateNodeParam={updateNodeParam} />;
        case "condition":   return <ConditionNode node={node} updateNodeParam={updateNodeParam} />;
        case "ai_agent":    return <AiAgentNode node={node} updateNodeParam={updateNodeParam} />;
        case "pause":       return <PauseNode node={node} updateNodeParam={updateNodeParam} currentRunId={currentRunId} onApprovePause={onApprovePause} />;
        case "loop":        return <LoopNode node={node} updateNodeParam={updateNodeParam} />;
        default:            return null;
    }
}

/* ════════════════════════════════════════════════════════════
   Funções Comentadas (Preservação do Histórico Vanilla JS)
   ════════════════════════════════════════════════════════════ */

/*
export function renderSpecialNodeProperties(node) {
    const type = node.node_type || "tool";
    switch (type) {
        case "subworkflow": return _renderSubworkflow(node);
        case "condition":   return _renderCondition(node);
        case "ai_agent":    return _renderAiAgent(node);
        case "pause":       return _renderPause(node);
        case "loop":        return _renderLoop(node);
        default:            return "";
    }
}

function _renderSubworkflow(node) {
    const p = node.params || {};
    let html = '<h3 style="margin-top:14px">&#x2934; Sub-Workflow</h3>';
    html += '<div class="prop-group">'
        + '<label class="prop-label">Workflow File (.json)</label>'
        + '<div class="fp-input-row">'
        + '<input type="text" class="fp-edit prop-input" id="swnp-ref-' + _esc(node.id) + '" '
        + 'value="' + _esc(p.workflow_ref || "") + '" '
        + 'placeholder="path/to/workflow.json or workflow_id" '
        + 'data-action="updateNodeParam" data-param-key="workflow_ref">'
        + '<button class="btn-small btn-browse-file" title="Browse" '
        + 'data-browse-file data-input-id="swnp-ref-' + _esc(node.id) + '" data-ext=".json">&#x1F4C2;</button>'
        + '</div>'
        + '<div class="prop-desc">Reference a saved workflow by file path or ID. '
        + 'Outputs are prefixed with the sub-node IDs.</div>'
        + '</div>';
    return html;
}

function _renderCondition(node) {
    const p    = node.params || {};
    const rule = p.condition || {};
    const ops  = ["==", "!=", ">", ">=", "<", "<=", "in", "contains", "startswith", "endswith"];

    let html = '<h3 style="margin-top:14px">&#x25C6; Condition</h3>';
    html += '<div class="prop-desc" style="margin-bottom:8px">Evaluate a rule and branch the workflow. '
        + 'Nodes listed in <code>on_true</code> proceed; others in <code>on_false</code> are skipped.</div>';

    html += '<div class="prop-group"><label class="prop-label">Left Value</label>'
        + '<input type="text" class="prop-input" value="' + _esc(rule.left || "") + '" '
        + 'placeholder="$node_id.output_key or literal" '
        + 'data-action="updateConditionRule" data-condition-field="left">'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">Operator</label>'
        + '<select class="prop-input" data-action="updateConditionRule" data-condition-field="op">';
    for (const op of ops)
        html += '<option value="' + op + '"' + (rule.op === op ? " selected" : "") + '>' + op + '</option>';
    html += '</select></div>';

    html += '<div class="prop-group"><label class="prop-label">Right Value</label>'
        + '<input type="text" class="prop-input" value="' + _esc(rule.right || "") + '" '
        + 'placeholder="literal or $ref" '
        + 'data-action="updateConditionRule" data-condition-field="right">'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">On True — node IDs (comma-separated)</label>'
        + '<input type="text" class="prop-input" value="' + _esc((p.on_true || []).join(",")) + '" '
        + 'data-action="updateConditionBranch" data-branch="on_true">'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">On False — node IDs (comma-separated)</label>'
        + '<input type="text" class="prop-input" value="' + _esc((p.on_false || []).join(",")) + '" '
        + 'data-action="updateConditionBranch" data-branch="on_false">'
        + '</div>';
    return html;
}

function _renderAiAgent(node) {
    const p         = node.params || {};
    const providers = ["anthropic", "openai", "mcp", "http"];
    let html = '<h3 style="margin-top:14px">&#x2726; AI Agent</h3>';

    html += '<div class="prop-group"><label class="prop-label">Provider</label>'
        + '<select class="prop-input" data-action="updateNodeParam" data-param-key="provider">';
    for (const prov of providers)
        html += '<option value="' + prov + '"' + (p.provider === prov ? " selected" : "") + '>' + prov + '</option>';
    html += '</select></div>';

    html += '<div class="prop-group"><label class="prop-label">Model</label>'
        + '<input type="text" class="prop-input" value="' + _esc(p.model || "") + '" '
        + 'placeholder="claude-sonnet-4-6 / gpt-4o / &#x2026;" '
        + 'data-action="updateNodeParam" data-param-key="model">'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">Prompt Template</label>'
        + '<textarea class="prop-input" rows="5" style="font-family:monospace;font-size:11px" '
        + 'data-action="updateNodeParam" data-param-key="prompt" '
        + 'placeholder="Use $ref:node_id.output_key to inject upstream values">'
        + _esc(p.prompt || "") + '</textarea>'
        + '<div class="prop-desc">Use <code>$ref:nodeId.outputKey</code> to inject upstream values.</div>'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">Max Tokens</label>'
        + '<input type="number" class="prop-input" value="' + _esc(String(p.max_tokens || 1000)) + '" '
        + 'data-action="updateNodeParamNumber" data-param-key="max_tokens">'
        + '</div>';

    if (p.provider === "http") {
        html += '<div class="prop-group"><label class="prop-label">HTTP URL</label>'
            + '<input type="text" class="prop-input" value="' + _esc(p.url || "") + '" '
            + 'placeholder="https://&#x2026;/v1/chat/completions" '
            + 'data-action="updateNodeParam" data-param-key="url">'
            + '</div>';
    }

    html += '<div class="prop-group"><label class="prop-label">Output File Path (optional)</label>'
        + '<input type="text" class="prop-input" value="' + _esc(p.output_file || "") + '" '
        + 'placeholder="leave empty to pass via memory" '
        + 'data-action="updateNodeParam" data-param-key="output_file">'
        + '</div>';
    return html;
}

function _renderPause(node, currentRunId) {
    const p              = node.params || {};
    const onTimeoutOpts  = ["fail", "skip", "continue"];
    let html = '<h3 style="margin-top:14px">&#x23F8; Pause / Approval Gate</h3>';
    html += '<div class="prop-desc" style="margin-bottom:8px">Stops workflow execution and waits for a manual '
        + 'approval via the UI or API before continuing downstream nodes.</div>';

    html += '<div class="prop-group"><label class="prop-label">Message (shown to approver)</label>'
        + '<textarea class="prop-input" rows="3" '
        + 'data-action="updateNodeParam" data-param-key="message">'
        + _esc(p.message || "") + '</textarea>'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">Timeout (seconds, 0 = no timeout)</label>'
        + '<input type="number" class="prop-input" value="' + _esc(String(p.timeout_s || 0)) + '" '
        + 'data-action="updateNodeParamNumber" data-param-key="timeout_s">'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">On Timeout</label>'
        + '<select class="prop-input" data-action="updateNodeParam" data-param-key="on_timeout">';
    for (const opt of onTimeoutOpts)
        html += '<option value="' + opt + '"' + (p.on_timeout === opt ? " selected" : "") + '>' + opt + '</option>';
    html += '</select></div>';

    html += '<div class="prop-group"><label class="prop-label">Auto-Approve</label>'
        + '<input type="checkbox" ' + (p.auto_approve ? "checked" : "") + ' '
        + 'data-action="updateNodeParamBool" data-param-key="auto_approve">'
        + '<span class="prop-desc" style="display:inline;margin-left:6px">Skip manual step in automated runs</span>'
        + '</div>';

    if (currentRunId) {
        html += '<div style="margin-top:10px">'
            + '<button class="btn-small" style="background:var(--success)" '
            + 'data-action="approvePause" data-run-id="' + _esc(currentRunId) + '" data-node-id="' + _esc(node.id) + '" data-approved="true">&#x2714; Approve</button> '
            + '<button class="btn-small" style="background:var(--error)" '
            + 'data-action="approvePause" data-run-id="' + _esc(currentRunId) + '" data-node-id="' + _esc(node.id) + '" data-approved="false">&#x274C; Reject</button>'
            + '</div>';
    }
    return html;
}

function _renderLoop(node) {
    const p = node.params || {};
    let html = '<h3 style="margin-top:14px">&#x21BA; Loop</h3>';
    html += '<div class="prop-desc" style="margin-bottom:8px">Iterates a body node over a list of items. '
        + 'Results are collected and merged as semicolon-joined strings in outputs.</div>';

    html += '<div class="prop-group"><label class="prop-label">Items Source</label>'
        + '<input type="text" class="prop-input" value="' + _esc(p.items || "") + '" '
        + 'placeholder="item1;item2;item3  or  $ref:node.key  or  {from:0,to:10,step:1}" '
        + 'data-action="updateNodeParam" data-param-key="items">'
        + '<div class="prop-desc">Semicolon list, <code>$ref:node.key</code> upstream ref, or range object.</div>'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">Body Node ID</label>'
        + '<input type="text" class="prop-input" value="' + _esc(p.body_node || "") + '" '
        + 'placeholder="node_id to execute per item (optional)" '
        + 'data-action="updateNodeParam" data-param-key="body_node">'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">Parallel</label>'
        + '<input type="checkbox" ' + (p.parallel ? "checked" : "") + ' '
        + 'data-action="updateNodeParamBool" data-param-key="parallel">'
        + '<span class="prop-desc" style="display:inline;margin-left:6px">Run iterations concurrently</span>'
        + '</div>';

    html += '<div class="prop-group"><label class="prop-label">Fail Fast</label>'
        + '<input type="checkbox" ' + (p.fail_fast !== false ? "checked" : "") + ' '
        + 'data-action="updateNodeParamBool" data-param-key="fail_fast">'
        + '<span class="prop-desc" style="display:inline;margin-left:6px">Abort on first iteration failure</span>'
        + '</div>';
    return html;
}

function _esc(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
*/

/* ════════════════════════════════════════════════════════════
   Condition update helpers — pure functions (sem GF global)
   ════════════════════════════════════════════════════════════ */

export function updateConditionRule(node, field, val) {
    if (!node) return;
    if (!node.params.condition) node.params.condition = {};
    node.params.condition[field] = val;
}

export function updateConditionBranch(node, branch, val) {
    if (!node) return;
    node.params[branch] = val.split(",").map(s => s.trim()).filter(Boolean);
}

export default {
    SPECIAL_NODE_DEFS,
    SpecialNodesSidebar,
    SpecialNodeProperties,
    updateConditionRule,
    updateConditionBranch,
};