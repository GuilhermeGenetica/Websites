/**
 * modules/workflow.jsx — SeqNode-OS Workflow Operations
 *
 * Exports pure functions that receive api, store and callbacks as parameters.
 */

import React from "react";

/**
 * @param {object} api      — módulo api/index.js
 * @param {object} store    — instância do Zustand store (getState())
 * @param {object} cb       — { onLog, onShowModal, onCloseModal, onSetBadge, onRender }
 */
export function createWorkflowModule(api, store, cb) {
    const { onLog, onShowModal, onCloseModal, onSetBadge, onRender } = cb;

    function esc(s) {
        const d = document.createElement("div");
        d.textContent = String(s || "");
        return d.innerHTML;
    }

    function getWorkflowPayload() {
        return JSON.parse(JSON.stringify(store.getState().workflow));
    }

    function newWorkflow() {
        store.getState().setWorkflow({
            id:            "wf_" + Math.random().toString(36).substr(2, 8),
            name:          "Untitled Workflow",
            description:   "",
            version:       "1.0.0",
            nodes:         [],
            global_params: {},
            tags:          [],
        });
        store.getState().clearSelection();
        store.getState().clearNodeStatuses();
        onRender?.();
    }

    async function saveWorkflow() {
        try {
            const payload = getWorkflowPayload();
            const content = JSON.stringify(payload, null, 2);
            if (window.showSaveFilePicker) {
                const fh = await window.showSaveFilePicker({
                    suggestedName: (payload.name || "workflow").replace(/\s+/g, "_") + ".json",
                    types: [{ description: "SeqNode JSON", accept: { "application/json": [".json"] } }],
                });
                const writable = await fh.createWritable();
                await writable.write(content);
                await writable.close();
                onLog("engine", "INFO", "Workflow saved via native dialog.");
            } else {
                const data = await api.saveWorkflow(payload);
                onLog("engine", "INFO", "Workflow saved: " + (data.workflow_id || "ok"));
            }
        } catch (e) {
            if (e.name !== "AbortError") onLog("engine", "ERROR", "Save error: " + e);
        }
    }

    async function loadWorkflowDialog() {
        try {
            if (window.showOpenFilePicker) {
                const [fh]  = await window.showOpenFilePicker({
                    types: [{ description: "SeqNode JSON", accept: { "application/json": [".json"] } }],
                });
                const file    = await fh.getFile();
                const content = await file.text();
                _applyWorkflowData(JSON.parse(content));
                onLog("engine", "INFO", "Workflow loaded via native dialog.");
            } else {
                const wfs = await api.getWorkflowList();
                
                /*
                // OLD STATIC HTML
                let html = '<div style="max-height:400px;overflow-y:auto">';
                if (!wfs.length) html += '<p style="color:var(--text-secondary)">No saved workflows found.</p>';
                for (const w of wfs) {
                    html += `<div class="workflow-list-item" data-wf-id="${esc(w.id)}" style="cursor:pointer;padding:8px;border-bottom:1px solid var(--border)">`
                          + `<strong>${esc(w.name)}</strong>`
                          + ` <span style="color:var(--text-secondary);font-size:11px">(${w.nodes_count} nodes)</span>`
                          + `<br><small style="color:var(--text-secondary)">${esc(w.id)}</small></div>`;
                }
                html += '</div>';
                onShowModal("Load Workflow", html, '<button id="modal-close-btn">Close</button>', (container) => {
                    container.querySelectorAll("[data-wf-id]").forEach(el => {
                        el.addEventListener("click", () => loadWorkflow(el.dataset.wfId));
                    });
                    container.querySelector("#modal-close-btn")?.addEventListener("click", onCloseModal);
                });
                */

                // NEW REACT COMPONENT
                const WorkflowList = () => (
                    <div style={{ maxHeight: 400, overflowY: "auto" }}>
                        {!wfs.length && <p style={{ color: "var(--text-secondary)" }}>No saved workflows found.</p>}
                        {wfs.map(w => (
                            <div key={w.id} className="workflow-list-item" onClick={() => loadWorkflow(w.id)} style={{ cursor: "pointer", padding: 8, borderBottom: "1px solid var(--border)" }}>
                                <strong>{w.name}</strong> <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>({w.nodes_count} nodes)</span><br/>
                                <small style={{ color: "var(--text-secondary)" }}>{w.id}</small>
                            </div>
                        ))}
                    </div>
                );

                const Footer = () => <button onClick={onCloseModal}>Close</button>;

                onShowModal(
                    "Load Workflow", 
                    <WorkflowList />, 
                    <Footer />, 
                    null, null, true
                );
            }
        } catch (e) {
            if (e.name !== "AbortError") onLog("engine", "ERROR", "Load error: " + e);
        }
    }

    async function loadWorkflow(wfId) {
        try {
            const data = await api.loadWorkflow(wfId);
            _applyWorkflowData(data);
            onCloseModal?.();
            onLog("engine", "INFO", "Loaded workflow: " + data.name);
        } catch (e) { onLog("engine", "ERROR", "Load error: " + e); }
    }

    /**
     * Normalise a workflow that came from the AI Builder.
     * The LLM returns a slightly different schema — fix it to match the canvas format.
     */
    function _normalizeAiWorkflow(wf) {
        if (!wf || typeof wf !== "object") return wf;

        // Build incoming-edge counts for topological layout
        const edgeList   = wf.edges || [];   // [{source, target, label}]
        const nodeIds    = (wf.nodes || []).map(n => n.id);
        const inDegree   = Object.fromEntries(nodeIds.map(id => [id, 0]));
        const adjList    = Object.fromEntries(nodeIds.map(id => [id, []]));

        for (const e of edgeList) {
            if (e.source && e.target) {
                adjList[e.source] = adjList[e.source] || [];
                adjList[e.source].push(e.target);
                inDegree[e.target] = (inDegree[e.target] || 0) + 1;
            }
        }

        // BFS topological levels for auto-layout
        const levels = {};
        const queue  = nodeIds.filter(id => (inDegree[id] || 0) === 0);
        queue.forEach(id => { levels[id] = 0; });
        let q = [...queue];
        while (q.length) {
            const next = [];
            for (const id of q) {
                for (const tgt of (adjList[id] || [])) {
                    if (levels[tgt] === undefined) {
                        levels[tgt] = (levels[id] || 0) + 1;
                        next.push(tgt);
                    }
                }
            }
            q = next;
        }

        // Count how many nodes are at each level (for Y staggering)
        const levelCounts = {};
        const levelIndex  = {};
        nodeIds.forEach(id => {
            const lv = levels[id] ?? 0;
            levelCounts[lv] = (levelCounts[lv] || 0) + 1;
        });
        nodeIds.forEach(id => {
            const lv = levels[id] ?? 0;
            levelIndex[id] = levelIndex[id] !== undefined ? levelIndex[id] : 0;
        });
        // Assign Y index per level
        const levelPos = {};
        nodeIds.forEach(id => {
            const lv = levels[id] ?? 0;
            levelPos[lv] = (levelPos[lv] ?? -1) + 1;
            levelIndex[id] = levelPos[lv];
        });

        const STEP_X = 230, STEP_Y = 110, OFF_X = 80, OFF_Y = 80;

        const nodes = (wf.nodes || []).map(n => {
            const lv  = levels[n.id] ?? 0;
            const idx = levelIndex[n.id] ?? 0;
            const cnt = levelCounts[lv] || 1;
            // Centre the column vertically
            const yBase = OFF_Y + (idx - (cnt - 1) / 2) * STEP_Y;
            return {
                // Fill in all required canvas fields with defaults
                params:           {},
                inputs_map:       {},
                outputs_map:      {},
                enabled:          true,
                notes:            "",
                plugin_paths:     {},
                custom_command:   "",
                runtime_override: {},
                // Override with AI-supplied values
                ...n,
                // Normalise field names
                tool_id:   n.tool_id   || n.plugin_id || n.id,
                node_type: n.node_type || n.type       || "tool",
                // Convert the top-level edges array to per-node adjacency list
                edges: (adjList[n.id] || []),
                // Auto-layout position (preserved if already set)
                position: n.position && typeof n.position.x === "number"
                    ? n.position
                    : { x: OFF_X + lv * STEP_X, y: yBase },
            };
        });

        return {
            id:          wf.id          || ("wf_ai_" + Date.now()),
            name:        wf.name        || "AI Workflow",
            description: wf.description || "",
            nodes,
            // edges at top level are no longer needed (stored per-node),
            // but keep the array for compatibility with the server validator
            edges: edgeList,
        };
    }

    function _applyWorkflowData(data) {
        if (Array.isArray(data)) {
            store.getState().updateWorkflowField("nodes", data);
        } else {
            store.getState().setWorkflow(_normalizeAiWorkflow(data));
        }
        store.getState().clearSelection();
        onRender?.();
    }

    function exportWorkflow() {
        const payload = getWorkflowPayload();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const a    = document.createElement("a");
        a.href     = URL.createObjectURL(blob);
        a.download = (payload.name || "workflow").replace(/\s+/g, "_") + ".json";
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function importWorkflow() {
        document.getElementById("file-import")?.click();
    }

    function handleImportFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                _applyWorkflowData(JSON.parse(e.target.result));
                onLog("engine", "INFO", "Imported workflow from file.");
            } catch (err) {
                /*
                // OLD STATIC HTML
                onShowModal("Import Error",
                    `<p style="color:var(--error)">Invalid JSON: ${esc(String(err))}</p>`,
                    '<button id="modal-close-btn">OK</button>',
                    (c) => c.querySelector("#modal-close-btn")?.addEventListener("click", onCloseModal));
                */

                // NEW REACT COMPONENT
                onShowModal(
                    "Import Error",
                    <p style={{ color: "var(--error)" }}>Invalid JSON: {String(err)}</p>,
                    <button onClick={onCloseModal}>OK</button>,
                    null, null, true
                );
            }
        };
        reader.readAsText(file);
    }

    async function validateWorkflow() {
        try {
            const data = await api.validateWorkflow(getWorkflowPayload());
            if (data.valid) {
                onLog("engine", "INFO", "Validation PASSED.");
                /*
                // OLD STATIC HTML
                onShowModal("Validation",
                    '<p style="color:var(--success);font-size:16px">&#x2714; Validation PASSED</p>',
                    '<button id="modal-close-btn">OK</button>',
                    (c) => c.querySelector("#modal-close-btn")?.addEventListener("click", onCloseModal));
                */
               
                // NEW REACT COMPONENT
                onShowModal(
                    "Validation",
                    <p style={{ color: "var(--success)", fontSize: 16 }}>&#x2714; Validation PASSED</p>,
                    <button onClick={onCloseModal}>OK</button>,
                    null, null, true
                );
            } else {
                onLog("engine", "ERROR", "Validation FAILED: " + (data.errors || []).join("; "));
                /*
                // OLD STATIC HTML
                const errHtml = '<ul style="color:var(--error)">' +
                    (data.errors || []).map(e => `<li>${esc(e)}</li>`).join("") + '</ul>';
                onShowModal("Validation FAILED", errHtml,
                    '<button id="modal-close-btn">OK</button>',
                    (c) => c.querySelector("#modal-close-btn")?.addEventListener("click", onCloseModal));
                */

                // NEW REACT COMPONENT
                onShowModal(
                    "Validation FAILED",
                    <ul style={{ color: "var(--error)" }}>
                        {(data.errors || []).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>,
                    <button onClick={onCloseModal}>OK</button>,
                    null, null, true
                );
            }
        } catch (e) { onLog("engine", "ERROR", "Validate error: " + e); }
    }

    async function validateWorkflowLocal(workflow) {
        const wf = workflow || getWorkflowPayload();
        try {
            return await api.validateWorkflowBasic(wf);
        } catch (_) {
            const errors = [];
            if (!wf.id)                    errors.push("Workflow 'id' is required.");
            if (!wf.name)                  errors.push("Workflow 'name' is required.");
            if (!Array.isArray(wf.nodes))  errors.push("Workflow 'nodes' must be an array.");
            return { valid: errors.length === 0, errors };
        }
    }

    async function executeWorkflow() {
        const state = store.getState();
        if (state.executing) { onLog("engine", "WARN", "Execution already in progress."); return; }
        try {
            state.setExecuting(true);
            state.clearNodeStatuses();
            onSetBadge?.("RUNNING", "running");
            const data = await api.executeWorkflow(getWorkflowPayload());
            if (data && !data.offline) {
                state.setCurrentRunId(data.run_id || null);
                onLog("engine", "INFO", "Execution started. Run ID: " + (data.run_id || "?"));
            } else {
                onLog("engine", "ERROR", "Execute failed: " + JSON.stringify(data));
                onSetBadge?.("ERROR", "failed");
                state.setExecuting(false);
            }
        } catch (e) {
            onLog("engine", "ERROR", "Execute error: " + e);
            onSetBadge?.("ERROR", "failed");
            store.getState().setExecuting(false);
        }
    }

    async function cancelExecution() {
        try {
            await api.cancelExecution();
            onLog("engine", "WARN", "Cancel requested.");
        } catch (e) { onLog("engine", "ERROR", "Cancel error: " + e); }
    }

    function handleStatusChange(status, runId) {
        store.getState().setExecuting(status === "RUNNING");
        const cls = status === "COMPLETED" ? "badge-success"
                  : status === "FAILED"    ? "badge-error"
                  : status === "RUNNING"   ? "badge-running"
                  : status === "CANCELLED" ? "badge-warn"
                  : "";
        onSetBadge?.(status, cls);
        if (["COMPLETED", "FAILED", "CANCELLED"].includes(status)) onRender?.();
    }

    async function approvePause(runId, nodeId, approved) {
        try {
            await api.approvePause(runId, nodeId, approved);
            onLog("engine", "INFO", "Pause " + (approved ? "approved" : "rejected") + " for node " + nodeId);
            onCloseModal?.();
        } catch (e) { onLog("engine", "ERROR", "Approve pause error: " + e); }
    }

    function showPauseApprovalDialog(runId, nodeId, message) {
        /*
        // OLD STATIC HTML
        const html = `<p style="font-size:14px;margin-bottom:16px">${esc(message)}</p>
                      <p style="color:var(--text-secondary);font-size:12px">Node: <code>${esc(nodeId)}</code></p>
                      <p style="color:var(--text-secondary);font-size:12px">Run: <code>${esc(runId)}</code></p>`;
        onShowModal("&#x23F8; Workflow Paused", html,
            '<button id="pause-reject">&#x274C; Reject</button> <button id="pause-approve">&#x2714; Approve</button>',
            (c) => {
                c.querySelector("#pause-reject")?.addEventListener("click",  () => approvePause(runId, nodeId, false));
                c.querySelector("#pause-approve")?.addEventListener("click", () => approvePause(runId, nodeId, true));
            });
        */

        // NEW REACT COMPONENT
        const Body = () => (
            <>
                <p style={{ fontSize: 14, marginBottom: 16 }}>{message}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Node: <code>{nodeId}</code></p>
                <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Run: <code>{runId}</code></p>
            </>
        );

        const Footer = () => (
            <>
                <button onClick={() => approvePause(runId, nodeId, false)}>&#x274C; Reject</button>{" "}
                <button onClick={() => approvePause(runId, nodeId, true)} style={{ background: "var(--success)" }}>&#x2714; Approve</button>
            </>
        );

        onShowModal(
            "&#x23F8; Workflow Paused", 
            <Body />, 
            <Footer />, 
            null, null, true
        );
    }

    return {
        getWorkflowPayload,
        newWorkflow,
        saveWorkflow,
        loadWorkflowDialog,
        loadWorkflow,
        loadWorkflowData: _applyWorkflowData,  // used by AI Builder
        exportWorkflow,
        importWorkflow,
        handleImportFile,
        validateWorkflow,
        validateWorkflowLocal,
        executeWorkflow,
        cancelExecution,
        handleStatusChange,
        approvePause,
        showPauseApprovalDialog,
    };
}

export default createWorkflowModule;