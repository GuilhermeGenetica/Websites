/**
 * modules/depcheck.jsx — SeqNode-OS Dependency Analyzer
 *
 * AI-driven dependency identification, verification and installation.
 *
 * Exports:
 * createDepcheckModule(api, store)  — factory with all functions
 * DepcheckButton                    — React button for toolbar
 *
 * React pattern: all UI logic previously done via innerHTML
 * is now managed by React state.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "../config.js";
import { getToken, getUserId } from "../utils/auth.js";
import { openFileBrowserOverlay } from "./props-io.js";

function _authHeaders(extra = {}) {
    const token = getToken();
    const h = { "Content-Type": "application/json", ...extra };
    if (token) h["Authorization"] = "Bearer " + token;
    const uid = getUserId();
    if (uid != null) h["X-Seqnode-User-Id"] = String(uid);
    return h;
}

async function _apiPost(path, body) {
    const res = await fetch(API_URL + path, {
        method: "POST",
        headers: _authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
}

async function _apiGet(path) {
    const res = await fetch(API_URL + path, { headers: _authHeaders() });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
}

async function _apiDelete(path) {
    const res = await fetch(API_URL + path, { method: "DELETE", headers: _authHeaders() });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
}

const POLL_MS = 1400;

/* ════════════════════════════════════════════════════════════
   Pure React Components
   ════════════════════════════════════════════════════════════ */

function InstallLogViewer({ logs, onCancel }) {
    const endRef = useRef(null);

    useEffect(() => {
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [logs]);

    return (
        <div className="depcheck-install-log-wrap" style={{ marginTop: 10 }}>
            <div className="depcheck-install-header">
                &#x1F4E6; Installing...
            </div>
            <pre className="depcheck-install-log" style={{ maxHeight: 200, overflowY: "auto" }}>
                {logs.map((line, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                ))}
                <div ref={endRef} />
            </pre>
            <div style={{ marginTop: 8, textAlign: "right" }}>
                <button onClick={onCancel} className="btn-cancel-job">&#x23F9; Cancel</button>
            </div>
        </div>
    );
}

function PathEditor({ tid, result, onSavePaths, onBrowsePath }) {
    // Intentionally NOT pre-filling from YAML default_paths —
    // paths must be either auto-detected or explicitly set by the user.
    const [binPath, setBinPath] = useState("");
    const [libPath, setLibPath] = useState("");
    const [refsPath, setRefsPath] = useState("");

    return (
        <div className="depcheck-path-editor" id={`patheditor-${tid}`}>
            <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", color: "var(--accent)", fontSize: 12 }}>
                    &#x1F4C1; Manual path configuration
                </summary>
                <div className="depcheck-path-form" style={{ marginTop: 8 }}>
                    
                    <div className="depcheck-path-row">
                        <label style={{ fontSize: 12, color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>Binary dir</label>
                        <input type="text" value={binPath} onChange={e => setBinPath(e.target.value)} placeholder="Auto-detected — override only if needed" style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-mono)" }} />
                        <button onClick={() => onBrowsePath(tid, "bin_path", setBinPath)} style={{ fontSize: 11, padding: "3px 8px", marginLeft: 4 }} title="Browse">&#x1F4C2;</button>
                    </div>

                    <div className="depcheck-path-row">
                        <label style={{ fontSize: 12, color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>Library dir</label>
                        <input type="text" value={libPath} onChange={e => setLibPath(e.target.value)} placeholder="e.g. ~/R/library" style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-mono)" }} />
                        <button onClick={() => onBrowsePath(tid, "lib_path", setLibPath)} style={{ fontSize: 11, padding: "3px 8px", marginLeft: 4 }} title="Browse">&#x1F4C2;</button>
                    </div>

                    <div className="depcheck-path-row">
                        <label style={{ fontSize: 12, color: "var(--text-secondary)", width: 110, flexShrink: 0 }}>References dir</label>
                        <input type="text" value={refsPath} onChange={e => setRefsPath(e.target.value)} placeholder="e.g. ~/data/references" style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-mono)" }} />
                        <button onClick={() => onBrowsePath(tid, "refs_path", setRefsPath)} style={{ fontSize: 11, padding: "3px 8px", marginLeft: 4 }} title="Browse">&#x1F4C2;</button>
                    </div>

                    <div style={{ marginTop: 8, textAlign: "right" }}>
                        <button onClick={() => onSavePaths(tid, { bin_path: binPath, lib_path: libPath, refs_path: refsPath })} className="btn-save-paths">
                            &#x1F4BE; Save Paths &amp; Re-check
                        </button>
                    </div>
                </div>
            </details>
        </div>
    );
}

function PluginCard({ tid, result, activeJobId, logs, onInstall, onCancelJob, onRecheck, onSavePaths, onBrowsePath }) {
    const [expanded, setExpanded] = useState(false);

    const status = result.status || "unknown";
    const statusIcon = { ok: "\u2705", partial: "\u26A0\uFE0F", missing: "\u274C", unknown_plugin: "\u2753" }[status] || "\u2753";
    const statusLabel = { ok: "Installed", partial: "Partial", missing: "Missing", unknown_plugin: "Plugin not loaded" }[status] || status;

    return (
        <div className={`depcheck-card depcheck-card-${status}`} id={`depcard-${tid}`}>
            <div className="depcheck-card-header" onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer" }}>
                <span className="depcheck-card-status">{statusIcon}</span>
                <span className="depcheck-card-name">
                    <strong>{result.plugin_name || tid}</strong>
                    <small style={{ color: "var(--text-secondary)", fontWeight: "normal" }}> [{tid}]</small>
                </span>
                <span className={`depcheck-card-statuslabel depcheck-status-${status}`}>{statusLabel}</span>
                <span className="depcheck-card-expand">&#x25BC;</span>
            </div>

            {expanded && (
                <div className="depcheck-card-body">
                    {result.binary && (
                        <div className="depcheck-row">
                            <span className="depcheck-row-label">Binary</span>
                            <span className="depcheck-row-val">
                                {result.binary_found ? "\u2705" : "\u274C"} <code>{result.binary}</code>
                                {result.binary_path && <> &#x2192; <code style={{ color: "var(--text-secondary)", fontSize: 11 }}>{result.binary_path}</code></>}
                                {result.version && <> <em style={{ color: "var(--accent)", fontSize: 11 }}>({result.version.split("\n")[0].substring(0, 80)})</em></>}
                            </span>
                        </div>
                    )}

                    {result.install_mode && result.install_mode !== "not_found" && (
                        <div className="depcheck-row">
                            <span className="depcheck-row-label">Mode</span>
                            <span className="depcheck-row-val depcheck-mode-badge">{result.install_mode}</span>
                        </div>
                    )}

                    {result.conda_env && (
                        <div className="depcheck-row">
                            <span className="depcheck-row-label">Conda env</span>
                            <span className="depcheck-row-val">
                                {result.conda_env_exists ? "\u2705" : "\u274C"} <code>{result.conda_env}</code>
                                {result.conda_env_path && <> <small style={{ color: "var(--text-secondary)" }}>{result.conda_env_path}</small></>}
                            </span>
                        </div>
                    )}

                    {Object.keys(result.r_packages || {}).length > 0 && (
                        <div className="depcheck-row depcheck-row-sub">
                            <span className="depcheck-row-label">R packages</span>
                            <span className="depcheck-row-val">
                                {Object.keys(result.r_packages).map(pkg => {
                                    const ok = result.r_packages[pkg];
                                    return <span key={pkg} className={`depcheck-pkg-tag ${ok ? "pkg-ok" : "pkg-missing"}`}>{ok ? "\u2713" : "\u2717"} {pkg}</span>;
                                })}
                            </span>
                        </div>
                    )}

                    {Object.keys(result.py_modules || {}).length > 0 && (
                        <div className="depcheck-row depcheck-row-sub">
                            <span className="depcheck-row-label">Python modules</span>
                            <span className="depcheck-row-val">
                                {Object.keys(result.py_modules).map(mod => {
                                    const ok = result.py_modules[mod];
                                    return <span key={mod} className={`depcheck-pkg-tag ${ok ? "pkg-ok" : "pkg-missing"}`}>{ok ? "\u2713" : "\u2717"} {mod}</span>;
                                })}
                            </span>
                        </div>
                    )}

                    {Object.keys(result.sub_binaries || {}).length > 0 && (
                        <div className="depcheck-row depcheck-row-sub">
                            <span className="depcheck-row-label">Sub-tools</span>
                            <span className="depcheck-row-val">
                                {Object.keys(result.sub_binaries).map(sb => {
                                    const info = result.sub_binaries[sb];
                                    return (
                                        <span key={sb} className={`depcheck-pkg-tag ${info.found ? "pkg-ok" : "pkg-missing"}`}>
                                            {info.found ? "\u2713" : "\u2717"} {sb}
                                            {info.path && <small> ({info.path})</small>}
                                        </span>
                                    );
                                })}
                            </span>
                        </div>
                    )}

                    {result.issues && result.issues.length > 0 && (
                        <div className="depcheck-issues">
                            <span className="depcheck-issues-title">&#x26A0; Issues detected:</span>
                            <ul>{result.issues.map((iss, i) => <li key={i}>{iss}</li>)}</ul>
                        </div>
                    )}

                    <PathEditor tid={tid} result={result} onSavePaths={onSavePaths} onBrowsePath={onBrowsePath} />

                    {activeJobId ? (
                        <InstallLogViewer logs={logs} onCancel={() => onCancelJob(tid)} />
                    ) : (
                        status !== "ok" && (
                            <div className="depcheck-card-actions">
                                <button onClick={() => onInstall(tid, true)} className="btn-install-one">&#x1F916; AI Install</button>
                                <button onClick={() => onInstall(tid, false)} className="btn-install-fallback">&#x1F4E6; Standard Install</button>
                                <button onClick={() => onRecheck(tid)} className="btn-recheck">&#x1F504; Re-check</button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

function AnalysisResults({ analysis, activeJobs, logs, handlers }) {
    if (!analysis) return null;

    const results   = analysis.results  || {};
    const summary   = analysis.summary  || {};
    const ids       = Object.keys(results);
    const hasMissing = summary.missing > 0 || summary.partial > 0;
    const viaAgent  = analysis.via_agent === true;

    return (
        <div className="depcheck-modal">
            {viaAgent && (
                <div style={{
                    margin: "0 0 10px", padding: "6px 12px", borderRadius: 5, fontSize: 11,
                    background: "rgba(34,197,94,.08)", color: "var(--success, #22c55e)",
                    border: "1px solid var(--success, #22c55e)",
                }}>
                    &#x1F916; Verified on your local machine via SeqNode Agent
                </div>
            )}
            {!viaAgent && (
                <div style={{
                    margin: "0 0 10px", padding: "6px 12px", borderRadius: 5, fontSize: 11,
                    background: "rgba(234,179,8,.08)", color: "var(--warning, #eab308)",
                    border: "1px solid var(--warning, #eab308)",
                }}>
                    &#x26A0;&#xFE0F; No agent connected — verified on server (may differ from your machine).
                    Connect the SeqNode Agent to verify your local installation.
                </div>
            )}
            <div className="depcheck-summary-bar">
                <div className="depcheck-chip depcheck-chip-total">
                    <span className="depcheck-chip-count">{summary.total || 0}</span>
                    <span className="depcheck-chip-label">&#x1F50E; Total</span>
                </div>
                <div className="depcheck-chip depcheck-chip-ok">
                    <span className="depcheck-chip-count">{summary.ok || 0}</span>
                    <span className="depcheck-chip-label">&#x2705; OK</span>
                </div>
                <div className="depcheck-chip depcheck-chip-partial">
                    <span className="depcheck-chip-count">{summary.partial || 0}</span>
                    <span className="depcheck-chip-label">&#x26A0; Partial</span>
                </div>
                <div className="depcheck-chip depcheck-chip-missing">
                    <span className="depcheck-chip-count">{summary.missing || 0}</span>
                    <span className="depcheck-chip-label">&#x274C; Missing</span>
                </div>
            </div>

            <div className="depcheck-sys-info">
                <span>&#x1F40D; Conda manager: <strong>{summary.conda_manager || "none"}</strong></span>
                <span style={{ marginLeft: 16 }}>&#x1F4E6; Environments: <strong>{(summary.available_envs || []).join(", ") || "none"}</strong></span>
            </div>

            {ids.map(tid => (
                <PluginCard
                    key={tid}
                    tid={tid}
                    result={results[tid]}
                    activeJobId={activeJobs[tid]}
                    logs={logs[activeJobs[tid]] || []}
                    onInstall={handlers.onInstall}
                    onCancelJob={handlers.onCancelJob}
                    onRecheck={handlers.onRecheck}
                    onSavePaths={handlers.onSavePaths}
                    onBrowsePath={handlers.onBrowsePath}
                />
            ))}

            <div className="depcheck-actions">
                <button onClick={handlers.onReanalyze} className="btn-secondary">&#x1F504; Re-analyse</button>
                {hasMissing && (
                    <button onClick={handlers.onInstallAll} className="btn-install-all">&#x1F680; Install All Missing</button>
                )}
            </div>
        </div>
    );
}

function DepcheckManager({ toolIds, store, api }) {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [activeJobs, setActiveJobs] = useState({});
    const [logs, setLogs] = useState({});
    const pollTimers = useRef({});

    const runAnalysis = useCallback(async () => {
        setLoading(true);
        try {
            const data = await _apiPost("/api/depcheck/analyze", { tool_ids: toolIds });
            setAnalysis(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [toolIds]);

    useEffect(() => {
        runAnalysis();
        return () => {
            Object.values(pollTimers.current).forEach(clearInterval);
        };
    }, [runAnalysis]);

    const appendLog = useCallback((jobId, text) => {
        setLogs(prev => ({
            ...prev,
            [jobId]: [...(prev[jobId] || []), text]
        }));
    }, []);

    const pollInstallLogs = useCallback((pluginId, jobId, initialOffset) => {
        let offset = initialOffset;
        const handle = setInterval(async () => {
            try {
                const data = await _apiGet("/api/depcheck/install-logs/" + encodeURIComponent(jobId) + "?offset=" + offset);
                offset = data.offset;
                data.lines.forEach(line => appendLog(jobId, line));
                
                if (data.status !== "running" && data.status !== "pending") {
                    clearInterval(handle);
                    delete pollTimers.current[jobId];
                    const doneMsg = data.status === "success"
                        ? "\n&#x2705; Done. Run 'Re-analyse' to verify."
                        : "\n&#x274C; Install ended with status: " + data.status;
                    appendLog(jobId, doneMsg);
                    setActiveJobs(prev => {
                        const newJobs = { ...prev };
                        delete newJobs[pluginId];
                        return newJobs;
                    });
                }
            } catch (e) {
                // ignore poll errors
            }
        }, POLL_MS);
        pollTimers.current[jobId] = handle;
    }, [appendLog]);

    const handleInstallOne = useCallback(async (pluginId, useAi = true) => {
        const condaEnv = analysis?.results?.[pluginId]?.conda_env || null;
        if (!window.confirm(`Install dependencies for ${pluginId}?\n\n${useAi ? "The AI agent will determine and execute the required installation commands." : "Standard (non-AI) install will use the plugin's YAML configuration."}`)) return;

        try {
            let data;
            try {
                data = await _apiPost("/api/depcheck/install", { plugin_id: pluginId, target_env: condaEnv, use_ai: useAi });
            } catch (e) {
                alert(`Error: ${e.message}`);
                return;
            }

            if (data.status === "already_ok") {
                alert("Already installed — nothing to do.");
                return;
            }

            const jobId = data.job_id;
            setActiveJobs(prev => ({ ...prev, [pluginId]: jobId }));
            
            if (data.plan_notes) appendLog(jobId, `&#x1F4CB; ${data.plan_notes}`);
            if (data.commands && data.commands.length) appendLog(jobId, `Commands to run:\n${data.commands.join("\n")}`);

            pollInstallLogs(pluginId, jobId, 0);
        } catch (e) {
            alert(e);
        }
    }, [analysis, appendLog, pollInstallLogs]);

    const handleInstallAll = useCallback(async () => {
        if (!analysis) return;
        const toInstall = Object.keys(analysis.results || {}).filter(tid => analysis.results[tid].status === "missing" || analysis.results[tid].status === "partial");
        if (toInstall.length === 0) { alert("All dependencies are already installed!"); return; }
        if (!window.confirm(`Install ALL missing/partial dependencies?\n\n${toInstall.length} tool(s) will be processed.`)) return;

        for (let i = 0; i < toInstall.length; i++) {
            await handleInstallOne(toInstall[i], true);
            await new Promise(res => setTimeout(res, 500));
        }
    }, [analysis, handleInstallOne]);

    const handleCancelJob = useCallback(async (pluginId) => {
        const jobId = activeJobs[pluginId];
        if (!jobId) return;
        try {
            await _apiDelete("/api/depcheck/install/" + encodeURIComponent(jobId));
            appendLog(jobId, "\n&#x23F9; Installation cancelled by user.");
        } catch (e) {
            // ignore
        }
        if (pollTimers.current[jobId]) {
            clearInterval(pollTimers.current[jobId]);
            delete pollTimers.current[jobId];
        }
        setActiveJobs(prev => {
            const newJobs = { ...prev };
            delete newJobs[pluginId];
            return newJobs;
        });
    }, [activeJobs, appendLog]);

    const handleRecheck = useCallback(async (pluginId) => {
        try {
            const result = await _apiPost("/api/depcheck/recheck", { plugin_id: pluginId });
            setAnalysis(prev => {
                if (!prev) return prev;
                return { ...prev, results: { ...prev.results, [pluginId]: result } };
            });
        } catch (e) {
            alert("Re-check failed: " + e);
        }
    }, []);

    const handleSavePaths = useCallback(async (pluginId, paths) => {
        const payload = { plugin_id: pluginId };
        Object.entries(paths).forEach(([k, v]) => {
            if (v && v.trim()) payload[k] = v.trim();
        });
        try {
            await _apiPost("/api/depcheck/set-path", payload);
            await handleRecheck(pluginId);
        } catch (e) {
            alert("Error saving paths: " + e);
        }
    }, [handleRecheck]);

    // Browse opens the agent-aware file browser overlay (routes to user's machine if agent connected)
    const handleBrowsePath = useCallback((pluginId, fieldKey, setter) => {
        openFileBrowserOverlay(
            api,
            { mode: "dir", initialPath: "" },
            (selectedPath) => {
                if (selectedPath) setter(selectedPath);
            }
        );
    }, [api]);

    const handlers = {
        onInstall: handleInstallOne,
        onCancelJob: handleCancelJob,
        onRecheck: handleRecheck,
        onSavePaths: handleSavePaths,
        onBrowsePath: handleBrowsePath,
        onReanalyze: runAnalysis,
        onInstallAll: handleInstallAll
    };

    if (loading) {
        return (
            <div className="depcheck-modal">
                <div className="depcheck-phase-header phase-scan">
                    <span className="depcheck-phase-icon">&#x23F3;</span>
                    <span>Phase 1 — Scanning {toolIds.length} tool(s)...</span>
                </div>
                <div className="depcheck-loading-grid">
                    {toolIds.map(id => (
                        <div key={id} className="depcheck-loading-row">
                            <span className="depcheck-spinner"></span>
                            <span>{id}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return <AnalysisResults analysis={analysis} activeJobs={activeJobs} logs={logs} handlers={handlers} />;
}


/* ════════════════════════════════════════════════════════════
   createDepcheckModule — factory
   ════════════════════════════════════════════════════════════ */

export function createDepcheckModule(store, showModal, closeModal, api) {

    /* ── Entry point ── */
    function openDepAnalysis() {
        const nodes   = (store.getState().workflow && store.getState().workflow.nodes) || [];
        const toolIds = [];
        nodes.forEach(n => {
            if (n.tool_id && !toolIds.includes(n.tool_id)) toolIds.push(n.tool_id);
        });

        if (toolIds.length === 0) {
            showModal(
                "Dependency Analysis",
                '<div class="depcheck-empty"><p>&#x1F4CB; The current board has no nodes.</p>'
                + '<p style="color:var(--text-secondary);margin-top:8px">Add tool nodes to the workflow canvas first, then run dependency analysis.</p></div>',
                '<button data-close-modal>Close</button>',
                (modalEl) => { modalEl?.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", () => closeModal())); }
            );
            return;
        }

        showModal(
            "Automated Dependency Analysis",
            <DepcheckManager toolIds={toolIds} store={store} api={api} />,
            null,
            null,
            null,
            true // useComponent
        );
    }


    return { openDepAnalysis };
}

/* ════════════════════════════════════════════════════════════
   DepcheckButton — React button to inject into toolbar
   ════════════════════════════════════════════════════════════ */

export function DepcheckButton({ store, showModal, closeModal, api }) {
    const moduleRef = useRef(null);
    if (!moduleRef.current) {
        moduleRef.current = createDepcheckModule(store, showModal, closeModal, api);
    }

    const handleClick = useCallback(() => {
        moduleRef.current.openDepAnalysis();
    }, []);

    return (
        <button
            id="btn-depcheck"
            title="Automated Dependency Analysis"
            onClick={handleClick}
        >
            &#x1F50D; Dep. Analysis
        </button>
    );
}

/* ════════════════════════════════════════════════════════════
   Helper
   ════════════════════════════════════════════════════════════ */


export default { createDepcheckModule, DepcheckButton };