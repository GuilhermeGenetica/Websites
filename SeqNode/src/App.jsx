/**
 * App.jsx — SeqNode-OS React Application Root
 */

import { useState, useEffect, useRef, useCallback, isValidElement } from "react";

// Store
import useStore from "./store/index.js";

// Modules
import api                                                  from "./modules/api.js";
import { registerHandlers, setupWebSocket }                 from "./modules/websocket.js";
import { createWorkflowModule }                             from "./modules/workflow.jsx";
import { createPluginsModule, PluginSidebar }               from "./modules/plugins.jsx";
import { SpecialNodesSidebar }                              from "./modules/node-types.jsx";
import { WorkflowCanvas, addNodeFromPlugin, addSpecialNode } from "./modules/canvas.jsx";
import { PropertiesPanel }                                  from "./modules/props-update.jsx";
import { useModal, Modal, LogPanel, StatusBadge }           from "./modules/ui.jsx";
import { SettingsModal }                                    from "./modules/settings-core.jsx";
import { DepcheckButton }                                   from "./modules/depcheck.jsx";
import { UserProfileModal }                                 from "./modules/user-profile/index.jsx";
import { AUTH_URL, API_URL }                               from "./config.js";

// Fase 2 — AI Builder
import { AIWorkflowBuilder }                               from "./modules/ai-builder/index.jsx";

// Fase 5 — Engine Auth
import { JWTLogin }                                        from "./pages/JWTLogin.jsx";
import { SetupWizard }                                     from "./pages/SetupWizard.jsx";

/* ════════════════════════════════════════════════════════════
   App
   ════════════════════════════════════════════════════════════ */

export default function App() {

    // Modal
    const { modal, showModal, closeModal } = useModal();

    // Status badge
    const [statusBadge, setStatusBadge] = useState("IDLE");

    // Log via store
    const logMsg = useCallback((source, level, message) => {
        useStore.getState().addLog({ source, level, message, ts: Date.now() });
    }, []);

    // Module refs (singleton, created once)
    const wfMod  = useRef(null);
    const plgMod = useRef(null);

    if (!wfMod.current) {
        wfMod.current = createWorkflowModule(api, useStore, {
            onLog:        logMsg,
            onShowModal:  showModal,
            onCloseModal: closeModal,
            onSetBadge:   setStatusBadge,
            onRender:     () => {},
        });
    }

    if (!plgMod.current) {
        plgMod.current = createPluginsModule(api, useStore);
    }

    // ── Initialise on mount ──
    useEffect(() => {
        // Apply theme immediately from localStorage (fastest source), then backend
        const storedTheme = localStorage.getItem("seqnode-theme") ||
                            useStore.getState().settings.ui.theme || "dark";
        document.body.className = "theme-" + storedTheme;

        // Load settings from both sources in parallel; PHP prefs win for persistent sections
        Promise.all([
            api.getUserPreferences().catch(() => null),
            api.getSettings().catch(() => null),
        ]).then(([prefs, vpsData]) => {
            // Apply VPS first (lower priority — may be stale or missing llm_config)
            if (vpsData) useStore.getState().applySettings(vpsData);

            // Apply PHP prefs on top — they are the authoritative source for
            // llm_config (API keys), dirs, auth, and UI preferences.
            if (prefs) {
                const patch = {};
                if (prefs.ui)              patch.ui              = prefs.ui;
                if (prefs.plugin_defaults) patch.plugin_defaults = prefs.plugin_defaults;
                if (prefs.plugin_paths)    patch.plugin_paths    = prefs.plugin_paths;
                if (prefs.llm_config)      patch.llm_config      = prefs.llm_config;
                if (prefs.dirs)            patch.dirs            = prefs.dirs;
                if (prefs.auth)            patch.auth            = prefs.auth;
                if (Object.keys(patch).length) useStore.getState().applySettings(patch);
            }

            // Apply theme from PHP prefs (preferred) or VPS fallback
            const theme = prefs?.ui?.theme || vpsData?.ui?.theme || "dark";
            document.body.className = "theme-" + theme;
            setTheme(theme);
            localStorage.setItem("seqnode-theme", theme);
        });

        // Load plugins + snippets
        plgMod.current.fetchPlugins().then(() => {
            plgMod.current.loadSnippets();
        });

        // Connect WebSocket
        registerHandlers({
            onLog:          (source, level, msg) => logMsg(source, level, msg),
            onStatusChange: (status, runId)       => {
                setStatusBadge(status);
                wfMod.current.handleStatusChange(status, runId);
            },
            onNodeStatus:   (nodeId, status)      => useStore.getState().updateNodeStatus(nodeId, status),
            onPauseRequest:    (runId, nodeId, msg) => wfMod.current.showPauseApprovalDialog(runId, nodeId, msg),
            onDownloadProgress: (d) => {
                // Forward to settings-refs if open (DOM elements may exist)
                const barEl = document.getElementById("dl-bar-"    + d.ref_id);
                const msgEl = document.getElementById("dl-msg-"    + d.ref_id);
                const stEl  = document.getElementById("dl-status-" + d.ref_id);
                if (barEl) barEl.style.width = Math.min(100, d.progress || 0) + "%";
                if (msgEl) msgEl.textContent  = d.message || "";
                if (stEl)  stEl.textContent   = d.status  || "";
                if (d.message) logMsg("refs", d.status === "error" ? "ERROR" : "INFO",
                    "[Download " + d.ref_id + "] " + d.message);
            },
        });
        setupWebSocket();

        // Auto-save
        const autoSaveInterval = setInterval(() => {
            const s = useStore.getState();
            if (s.settings.ui.auto_save) {
                api.saveWorkflow(s.workflow).catch(() => {});
            }
        }, (useStore.getState().settings.ui.auto_save_interval || 60) * 1000);

        return () => clearInterval(autoSaveInterval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Panel resizers ──
    useEffect(() => {
        // Sidebar (ew-resize)
        const sbResizer = document.getElementById("sidebar-resizer");
        const sidebar   = document.getElementById("sidebar");
        let sbActive = false, sbStartX = 0, sbStartW = 0;
        const sbDown = (e) => {
            sbActive = true; sbStartX = e.clientX; sbStartW = sidebar.offsetWidth;
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
            e.preventDefault();
        };
        const sbMove = (e) => {
            if (!sbActive) return;
            const nw = sbStartW + (e.clientX - sbStartX);
            if (nw >= 160 && nw <= 500) sidebar.style.width = nw + "px";
        };
        const sbUp = () => {
            if (sbActive) { sbActive = false; document.body.style.cursor = document.body.style.userSelect = ""; }
        };
        if (sbResizer) sbResizer.addEventListener("mousedown", sbDown);

        // Properties panel (ew-resize, direita → esquerda)
        const ppResizer = document.getElementById("properties-resizer");
        const ppPanel   = document.getElementById("properties-panel");
        let ppActive = false, ppStartX = 0, ppStartW = 0;
        const ppDown = (e) => {
            ppActive = true; ppStartX = e.clientX; ppStartW = ppPanel.offsetWidth;
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
            e.preventDefault();
        };
        const ppMove = (e) => {
            if (!ppActive) return;
            const nw = ppStartW + (ppStartX - e.clientX);
            if (nw >= 200 && nw <= 700) ppPanel.style.width = nw + "px";
        };
        const ppUp = () => {
            if (ppActive) { ppActive = false; document.body.style.cursor = document.body.style.userSelect = ""; }
        };
        if (ppResizer) ppResizer.addEventListener("mousedown", ppDown);

        document.addEventListener("mousemove", sbMove);
        document.addEventListener("mouseup",   sbUp);
        document.addEventListener("mousemove", ppMove);
        document.addEventListener("mouseup",   ppUp);

        return () => {
            if (sbResizer) sbResizer.removeEventListener("mousedown", sbDown);
            if (ppResizer) ppResizer.removeEventListener("mousedown", ppDown);
            document.removeEventListener("mousemove", sbMove);
            document.removeEventListener("mouseup",   sbUp);
            document.removeEventListener("mousemove", ppMove);
            document.removeEventListener("mouseup",   ppUp);
        };
    }, []);

    // ── Panel collapse state ──
    const [sidebarCollapsed,    setSidebarCollapsed]    = useState(false);
    const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);

    // ── Mobile navigation menu ──
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // ── Theme toggle ──
    const [theme, setTheme] = useState(() => {
        // localStorage is the fastest source on reload — API response arrives later
        const saved = localStorage.getItem("seqnode-theme");
        return saved || useStore.getState().settings.ui.theme || "dark";
    });

    const handleToggleTheme = useCallback(() => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        document.body.className = "theme-" + newTheme;
        localStorage.setItem("seqnode-theme", newTheme);
        useStore.getState().updateSetting("ui.theme", newTheme);
        // Persist to PHP/MySQL (always available) and VPS (may fail)
        const uiSettings = { ...useStore.getState().settings.ui, theme: newTheme };
        api.saveUserPreferences({ section: "ui", data: uiSettings }).catch(() => {});
        api.saveSettings({ ui: { theme: newTheme } }).catch(() => {});
    }, [theme]);

    // ── Workflow name from store ──
    const [wfName, setWfName] = useState(() => useStore.getState().workflow.name);
    useEffect(() => {
        const unsub = useStore.subscribe(() => {
            setWfName(useStore.getState().workflow.name);
        });
        return unsub;
    }, []);

    const handleWfNameChange = useCallback((e) => {
        const val = e.target.value;
        useStore.getState().updateWorkflowField("name", val);
        setWfName(val);
    }, []);

    // ── Toolbar actions ──
    const handleNew      = useCallback(() => wfMod.current.newWorkflow(),        []);
    const handleSave     = useCallback(() => wfMod.current.saveWorkflow(),       []);
    const handleLoad     = useCallback(() => wfMod.current.loadWorkflowDialog(), []);
    const handleExport   = useCallback(() => wfMod.current.exportWorkflow(),     []);
    const handleImport   = useCallback(() => wfMod.current.importWorkflow(),     []);
    const handleValidate = useCallback(() => wfMod.current.validateWorkflow(),   []);
    const handleExecute  = useCallback(() => wfMod.current.executeWorkflow(),    []);
    const handleCancel   = useCallback(() => wfMod.current.cancelExecution(),    []);

    const handleImportFileChange = useCallback((e) => {
        wfMod.current.handleImportFile(e.target.files[0]);
        e.target.value = "";
    }, []);

    // ── Sidebar callbacks ──
    const handleAddNode = useCallback((toolId) => {
        addNodeFromPlugin(toolId, undefined, undefined, useStore, useStore.getState().plugins);
    }, []);

    const handleAddSpecialNode = useCallback((nodeType) => {
        addSpecialNode(nodeType, undefined, undefined, useStore);
    }, []);

    // ── Settings ──
    const handleOpenSettings = useCallback(() => {
        showModal("SeqNode-OS Settings", null, null, null, null, true);
    }, [showModal]);

    // ── Auth: current user (PHP) ──
    const authUser = useStore(s => s.authUser);

    // ── Fase 2 — AI Builder ──
    const [aiBuilderOpen, setAiBuilderOpen] = useState(false);

    // ── Fase 5 — Engine auth state ──
    const engineToken   = useStore(s => s.engineToken);
    const engineUser    = useStore(s => s.engineUser);
    const engineLogout  = useStore(s => s.engineLogout);
    const setEngineToken = useStore(s => s.setEngineToken);
    const setEngineUser  = useStore(s => s.setEngineUser);

    const [engineAuthEnabled, setEngineAuthEnabled] = useState(false);
    const [engineNeedsSetup,  setEngineNeedsSetup]  = useState(false);

    // Check engine auth state on mount
    useEffect(() => {
        fetch(API_URL + "/api/system/info")
            .then(r => r.json())
            .then(info => {
                const enabled = info?.auth_enabled ?? false;
                setEngineAuthEnabled(enabled);
                if (enabled && !info?.has_users) {
                    setEngineNeedsSetup(true);
                }
            })
            .catch(() => { /* VPS offline — skip auth check */ });

        // Listen for 401 from engine
        const onUnauth = () => {
            setEngineToken(null);
            setEngineUser(null);
        };
        window.addEventListener("seqnode:engine-unauthorized", onUnauth);
        return () => window.removeEventListener("seqnode:engine-unauthorized", onUnauth);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Engine logout handler
    const handleEngineLogout = useCallback(() => {
        engineLogout();
    }, [engineLogout]);

    // ── Execution target: poll agent status for current user ──
    const [execTarget, setExecTarget] = useState(null); // null | { connected, info }
    useEffect(() => {
        if (!authUser?.id) return;
        let alive = true;
        const poll = () => {
            api.getAgentForUser(authUser.id)
                .then(d => { if (alive) setExecTarget(d); })
                .catch(() => { if (alive) setExecTarget(null); });
        };
        poll();
        const tid = setInterval(poll, 10000);
        return () => { alive = false; clearInterval(tid); };
    }, [authUser?.id]);

    // ── User profile ──
    const handleOpenProfile = useCallback(() => {
        showModal(
            "My Profile",
            <UserProfileModal store={useStore} closeModal={closeModal} />,
            null, null, null, true
        );
    }, [showModal, closeModal]);

    // ── Logout ──
    const handleLogout = useCallback(async () => {
        const refreshToken = localStorage.getItem("seqnode_refresh_token");
        try {
            await fetch(AUTH_URL + "/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken || "" }),
            });
        } catch (_) { /* silencia erro de rede — limpa tokens de qualquer forma */ }
        useStore.getState().clearAuth();
        window.location.href = "https://seqnode.onnetweb.com/";
    }, []);

    // ── System info ──
    const handleSystemInfo = useCallback(async () => {
        try {
            const info = await api.getSystemInfo();
            const esc  = s => { const d = document.createElement("div"); d.textContent = String(s || ""); return d.innerHTML; };
            let html = '<table style="width:100%;border-collapse:collapse">';
            for (const k of Object.keys(info)) {
                html += `<tr><td style="padding:4px 8px;font-weight:600;white-space:nowrap">${esc(k)}</td>`
                      + `<td style="padding:4px;font-family:var(--font-mono);font-size:12px;word-break:break-all">${esc(JSON.stringify(info[k]))}</td></tr>`;
            }
            html += "</table>";
            showModal("System Information", html,
                '<button id="_si_close">Close</button>',
                (el) => el?.querySelector("#_si_close")?.addEventListener("click", closeModal));
        } catch (e) {
            showModal("Error", `<p style="color:var(--error)">${e.message}</p>`,
                '<button id="_si_close">OK</button>',
                (el) => el?.querySelector("#_si_close")?.addEventListener("click", closeModal));
        }
    }, [showModal, closeModal]);

    // ── Fase 2 — AI Builder: load workflow into canvas ──
    const handleAiLoadWorkflow = useCallback((wfData) => {
        wfMod.current.loadWorkflowData(wfData);
    }, []);

    // Open AI Builder via custom event (dispatched from Settings → Auth tab)
    useEffect(() => {
        const handlerAi = () => {
            closeModal();
            setAiBuilderOpen(true);
            setPropertiesCollapsed(false);
        };
        // Open Settings modal on Auth tab (dispatched from AI Builder "Configure" link)
        const handlerAuth = () => {
            handleOpenSettings();
            // The SettingsModal defaults to tab-dirs; switch to tab-auth after render
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("seqnode:settings-goto", { detail: "tab-auth" }));
            }, 80);
        };
        window.addEventListener("seqnode:open-ai-builder",   handlerAi);
        window.addEventListener("seqnode:open-settings-auth", handlerAuth);
        return () => {
            window.removeEventListener("seqnode:open-ai-builder",   handlerAi);
            window.removeEventListener("seqnode:open-settings-auth", handlerAuth);
        };
    }, [closeModal, handleOpenSettings]);

    // ── Log panel state ──
    const logs            = useStore(s => s.logs);
    const logExpanded     = useStore(s => s.logExpanded);
    const logExpandedFull = useStore(s => s.logExpandedFull);

    // ── Fase 5 — Engine auth gate ──
    if (engineAuthEnabled && engineNeedsSetup) {
        return <SetupWizard onComplete={() => { setEngineNeedsSetup(false); }} />;
    }
    if (engineAuthEnabled && !engineToken) {
        return <JWTLogin onSuccess={() => { /* auth state updated via store */ }} />;
    }

    return (
        <div id="app">
            {/* ── Toolbar ── */}
            <header id="toolbar" className={mobileMenuOpen ? "mobile-open" : ""}>
                <div className="toolbar-left">
                    <span className="logo">&#x1F9EC; SeqNode-OS</span>
                    {/* Hamburger — visible only on small screens via CSS */}
                    <button
                        className="toolbar-hamburger btn-small"
                        title="Toggle menu"
                        onClick={() => setMobileMenuOpen(o => !o)}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? "\u2715" : "\u2630"}
                    </button>
                    {/* Desktop nav buttons — hidden on mobile, shown in dropdown when open */}
                    <div className="toolbar-nav-items">
                        <button onClick={handleNew}    title="New Workflow">&#x1F4C4; New</button>
                        <button onClick={handleSave}   title="Save Workflow">&#x1F4BE; Save</button>
                        <button onClick={handleLoad}   title="Load Workflow">&#x1F4C2; Load</button>
                        <button onClick={handleExport} title="Export JSON">&#x2B07; Export</button>
                        <DepcheckButton store={useStore} showModal={showModal} closeModal={closeModal} api={api} />
                        <button className="btn-small" title="Settings" onClick={() => { handleOpenSettings(); setMobileMenuOpen(false); }}>&#x2699; Settings</button>
                        <button className="btn-small" title="System Info" onClick={() => { handleSystemInfo(); setMobileMenuOpen(false); }}>&#x2139; Info</button>
                        {/* Fase 2 — AI Builder */}
                        <button
                            className="btn-small btn-ai-builder"
                            title="Build workflow with AI"
                            onClick={() => { setAiBuilderOpen(true); setPropertiesCollapsed(false); setMobileMenuOpen(false); }}
                        >&#x1F916; Build with AI</button>
                    </div>
                </div>
                <div className="toolbar-center">
                    <input
                        type="text"
                        id="wf-name"
                        placeholder="Workflow Name"
                        value={wfName}
                        onChange={handleWfNameChange}
                    />
                </div>
                <div className="toolbar-right">
                    <div className="toolbar-nav-items">
                        <button className="btn-validate" onClick={handleValidate} title="Validate Workflow">&#x2714; Validate</button>
                        <button className="btn-execute"  onClick={handleExecute}  title="Execute Workflow">&#x25B6; Execute</button>
                        <button className="btn-cancel"   onClick={handleCancel}   title="Cancel Execution">&#x25A0; Cancel</button>
                    </div>
                    <StatusBadge status={statusBadge} />
                    {/* Execution target badge */}
                    {execTarget !== null && (
                        <span title={execTarget.connected
                            ? `Executing on: ${execTarget.info?.hostname || "Local Agent"} (${execTarget.info?.os || ""})`
                            : "No agent connected — executing on VPS server (admin only)"}
                            style={{
                                fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600,
                                background: execTarget.connected ? "rgba(34,197,94,.15)" : "rgba(245,158,11,.15)",
                                color:      execTarget.connected ? "var(--success,#22c55e)" : "var(--warning,#f59e0b)",
                                border:     `1px solid ${execTarget.connected ? "var(--success,#22c55e)" : "var(--warning,#f59e0b)"}`,
                                whiteSpace: "nowrap", cursor: "default",
                            }}>
                            {execTarget.connected
                                ? `\uD83D\uDDA5 ${execTarget.info?.hostname || "Agent"}`
                                : "\u2601 VPS Server"}
                        </span>
                    )}
                    <button className="btn-small" title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
                        onClick={handleToggleTheme}>
                        {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
                    </button>
                    <button className="btn-small" title="Help & Documentation"
                        onClick={() => window.open("/help", "_blank")}>
                        &#x2753; Help
                    </button>
                    {authUser && (
                        <button
                            className="btn-small btn-user"
                            title={`Profile: ${authUser.full_name || authUser.email}`}
                            onClick={handleOpenProfile}
                            style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            &#x1F464; {authUser.display_name || authUser.full_name || authUser.email}
                        </button>
                    )}
                    <button
                        className="btn-small btn-logout"
                        title="Sign out"
                        onClick={handleLogout}
                        style={{ color: "var(--error, #f87171)" }}
                    >
                        &#x23FB; Sign out
                    </button>
                    {/* Fase 5 — Engine user badge */}
                    {engineAuthEnabled && engineUser && (
                        <span className="engine-user-badge" style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600,
                            background: "rgba(99,102,241,.15)",
                            color: "var(--accent, #6366f1)",
                            border: "1px solid var(--accent, #6366f1)",
                            whiteSpace: "nowrap",
                        }}>
                            &#x1F512; {engineUser.username} ({engineUser.role})
                            <button
                                onClick={handleEngineLogout}
                                style={{ marginLeft: 4, background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 10 }}
                                title="Sign out of engine"
                            >&times;</button>
                        </span>
                    )}
                </div>
            </header>

            {/* ── Main area ── */}
            <div id="main-area">
                {/* Sidebar */}
                <aside id="sidebar" style={sidebarCollapsed ? { width: 0, minWidth: 0, overflow: "hidden", borderRight: "none" } : {}}>
                    <PluginSidebar
                        api={api}
                        store={useStore}
                        showModal={showModal}
                        closeModal={closeModal}
                        onAddNode={handleAddNode}
                        logMsg={logMsg}
                    />
                    <SpecialNodesSidebar onAddNode={handleAddSpecialNode} />
                    <div className="sidebar-footer">
                        {/* Settings and System Info moved to top toolbar */}
                    </div>
                </aside>

                <div id="sidebar-resizer" className="panel-resizer panel-resizer-v">
                    <button
                        className="panel-collapse-btn panel-collapse-btn-left"
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => setSidebarCollapsed(c => !c)}
                    >
                        {sidebarCollapsed ? "\u25B6" : "\u25C4"}
                    </button>
                </div>

                {/* Canvas */}
                <div id="canvas-container" style={{ flex: 1, overflow: "hidden", position: "relative", height: "100%" }}>
                    <WorkflowCanvas store={useStore} />
                </div>

                <div id="properties-resizer" className="panel-resizer panel-resizer-v">
                    <button
                        className="panel-collapse-btn panel-collapse-btn-right"
                        title={propertiesCollapsed ? "Expand properties" : "Collapse properties"}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => setPropertiesCollapsed(c => !c)}
                    >
                        {propertiesCollapsed ? "\u25C4" : "\u25B6"}
                    </button>
                </div>

                {/* Properties panel — also hosts the AI Builder when open */}
                <aside id="properties-panel" style={propertiesCollapsed && !aiBuilderOpen ? { width: 0, minWidth: 0, overflow: "hidden", borderLeft: "none" } : {}}>
                    {aiBuilderOpen ? (
                        <AIWorkflowBuilder
                            onLoadWorkflow={handleAiLoadWorkflow}
                            onClose={() => setAiBuilderOpen(false)}
                            api={api}
                            store={useStore}
                        />
                    ) : (
                        <PropertiesPanel
                            store={useStore}
                            api={api}
                            showModal={showModal}
                            closeModal={closeModal}
                        />
                    )}
                </aside>
            </div>

            {/* ── Log panel (inclui #log-resizer interno) ── */}
            <LogPanel
                logs={logs}
                expanded={logExpanded}
                expandedFull={logExpandedFull}
                onToggle={() => useStore.getState().setLogExpanded(!logExpanded)}
                onExpand={() => useStore.getState().setLogExpandedFull(!logExpandedFull)}
                onClear={() => useStore.getState().clearLogs()}
            />

            {/* ── Modal HTML ── */}
            {modal.open && !modal.useComponent && (
                <Modal
                    title={modal.title}
                    body={modal.body}
                    footer={modal.footer}
                    onClose={closeModal}
                    onSetup={modal.onSetup}
                />
            )}

            {/* ── Component modal (body is a React element) ── */}
            {modal.open && modal.useComponent && (
                <Modal
                    title={modal.title}
                    body={
                        isValidElement(modal.body) ? modal.body : (
                            <SettingsModal
                                api={api}
                                store={useStore}
                                showModal={showModal}
                                closeModal={closeModal}
                                logMsg={logMsg}
                            />
                        )
                    }
                    footer={isValidElement(modal.footer) ? modal.footer : null}
                    onClose={closeModal}
                    useComponent={true}
                />
            )}

            {/* AI Builder is rendered inside #properties-panel above */}

            {/* Hidden file inputs */}
            <input type="file" id="file-import" accept=".json" style={{ display: "none" }}
                onChange={handleImportFileChange} />
            <input type="file" id="gf-native-file-picker"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }} />
            <input type="file" id="gf-native-dir-picker"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
                webkitdirectory="true" />
        </div>
    );
}
