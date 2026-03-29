/**
 * modules/settings-core.jsx — SeqNode-OS Settings Core
 *
 * Exports:
 * createSettingsModule(api, store, showModal, closeModal)  — factory
 * SettingsModal                                            — React component
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createSettingsPluginsModule } from "./settings-plugins.js";
import { createSettingsRefsModule }    from "./settings-refs.js";
import { openFileBrowserOverlay }      from "./props-io.js";
import { UserProfileModal }            from "./user-profile/index.jsx";

const _esc = (s) => String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ════════════════════════════════════════════════════════════
   createSettingsModule — factory
   ════════════════════════════════════════════════════════════ */

export function createSettingsModule(api, store, showModal, closeModal) {
    const pluginsMod = createSettingsPluginsModule(api, store);
    let   refsMod    = null; // lazy-initialized when refs tab opens

    function _getRefsMod() {
        if (!refsMod) refsMod = createSettingsRefsModule(api, store, showModal, closeModal);
        return refsMod;
    }

    // force=true skips directory access check (admin override)
    // originalDirs should be captured at modal-open time to detect actual changes
    async function applyAndSaveSettings(force = false, originalDirs = null) {
        if (!force) {
            try {
                const currentDirs = store.getState().settings.dirs || {};
                const refDirs     = originalDirs || {};
                const changedDirs = {};
                for (const key in currentDirs) {
                    if (currentDirs[key] !== refDirs[key]) changedDirs[key] = currentDirs[key];
                }
                if (Object.keys(changedDirs).length > 0) {
                    const dirCheck = await api.validateDirs({ dirs: changedDirs });
                    if (dirCheck?.warnings?.length > 0) {
                        return { needsConfirm: true, warnings: dirCheck.warnings };
                    }
                }
            } catch (_) { /* VPS offline — skip dir validation */ }
        }

        const s = store.getState().settings;

        // ── Step 1: Save user prefs to PHP/MySQL (always available) ──
        let phpSaved = false;
        try {
            await api.saveUserPreferences({
                sections: {
                    ui:              s.ui              || {},
                    plugin_defaults: s.plugin_defaults || {},
                    plugin_paths:    s.plugin_paths    || {},
                    llm_config:      s.llm_config      || {},
                    dirs:            s.dirs            || {},
                    auth:            s.auth            || {},
                },
            });
            phpSaved = true;
        } catch (_) { /* MySQL unavailable — unusual */ }

        // ── Step 2: Apply theme immediately ──
        applyTheme(s.ui?.theme || "dark");

        // ── Step 3: Try saving full settings to VPS (optional) ──
        let vpsSaved = false;
        try {
            await api.saveSettings(s);
            vpsSaved = true;
            try {
                const data = await api.createDirs();
                const created = data?.created || [];
                if (created.length) console.info("Created directories:", created.join(", "));
            } catch (_) {}
        } catch (_) { /* VPS offline — settings saved to MySQL only */ }

        closeModal();
        return { saved: phpSaved || vpsSaved, phpSaved, vpsSaved };
    }

    /* ── Reset dirs ── */
    async function settingsResetDirs() {
        if (!confirm("Reset all directory paths to defaults?")) return;
        try {
            const data = await api.resetSettings();
            if (data.settings) store.getState().applySettings(data.settings);
        } catch (e) { console.error("Reset error:", e); }
    }

    /* ── Theme ── */
    function applyTheme(theme) {
        document.body.className = "theme-" + (theme || "dark");
    }

    /* ── Fetch conda envs ── */
    async function fetchCondaEnvs(selEl) {
        if (!selEl) selEl = document.getElementById("si-conda-env-select");
        if (!selEl) return;
        selEl.innerHTML = '<option>Loading...</option>';
        try {
            const data = await api.getCondaEnvs();
            selEl.innerHTML = '<option value="">-- Select environment --</option>';
            if (data.envs && data.envs.length > 0) {
                const currentVal = store.getState().settings.execution.conda_env || "";
                for (const env of data.envs) {
                    const opt        = document.createElement("option");
                    opt.value        = env.name;
                    opt.textContent  = env.name + " (" + env.path + ")";
                    if (env.name === currentVal) opt.selected = true;
                    selEl.appendChild(opt);
                }
            } else {
                selEl.innerHTML = '<option value="">No conda environments found</option>';
            }
        } catch (e) {
            selEl.innerHTML = '<option value="">Error fetching envs</option>';
        }
    }

    /* ── Fetch LLM models ── */
    async function fetchLLMModels() {
        const prov = document.getElementById("llm-provider-select")?.value;
        const key  = document.getElementById("llm-key-input")?.value;
        const base = document.getElementById("llm-base-input")?.value;
        const sel  = document.getElementById("llm-model-select");
        if (!sel) return;
        sel.innerHTML = '<option>Loading...</option>';
        try {
            const data = await api.getLLMModels(prov, key, base);
            sel.innerHTML = '';
            if (data.models && data.models.length > 0) {
                data.models.forEach(m => {
                    const opt = document.createElement("option");
                    opt.value = opt.textContent = m;
                    if (m === (store.getState().settings.llm_config || {}).model) opt.selected = true;
                    sel.appendChild(opt);
                });
                store.getState().updateSetting("llm_config.model", sel.value);
            } else {
                sel.innerHTML = '<option value="">No models found</option>';
            }
        } catch (e) {
            sel.innerHTML = '<option value="">Error fetching models</option>';
        }
    }

    /* ── Test LLM connection ── */
    async function testLLMConnection() {
        const prov   = document.getElementById("llm-provider-select")?.value;
        const key    = document.getElementById("llm-key-input")?.value;
        const base   = document.getElementById("llm-base-input")?.value;
        const status = document.getElementById("llm-conn-status");
        const btn    = document.getElementById("llm-test-btn");
        if (!status) return;
        if (btn) btn.disabled = true;
        status.innerHTML = '<span style="color:var(--text-secondary)">&#x23F3; Testing connection\u2026</span>';
        try {
            const data = await api.aiTestConnection(prov, key, base);
            if (data.ok) {
                status.innerHTML = '<span style="color:var(--success,#4ade80)">&#x2705; ' + data.message + '</span>';
            } else {
                status.innerHTML = '<span style="color:var(--error,#f87171)">&#x274C; ' + data.message + '</span>';
            }
        } catch (e) {
            status.innerHTML = '<span style="color:var(--error,#f87171)">&#x274C; ' + (e.message || 'Connection failed') + '</span>';
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    /* ── Handle LLM provider change ── */
    function handleLLMProviderChange() {
        const prov       = document.getElementById("llm-provider-select")?.value;
        const baseInput  = document.getElementById("llm-base-input");
        const oauthBtn   = document.getElementById("llm-oauth-btn");
        const oauthMsg   = document.getElementById("llm-oauth-msg");
        const oauthInput = document.getElementById("llm-oauth-input");
        if (!prov || !baseInput) return;

        if (prov === "ollama") {
            if (!baseInput.value) {
                baseInput.value = "http://localhost:11434/v1";
                store.getState().updateSetting("llm_config.api_base", baseInput.value);
            }
        } else if (["openai","anthropic","gemini","grok","azure"].includes(prov)) {
            if (baseInput.value === "http://localhost:11434/v1") {
                baseInput.value = "";
                store.getState().updateSetting("llm_config.api_base", "");
            }
        }

        if (prov === "gemini" || prov === "azure") {
            if (oauthBtn)   oauthBtn.style.display   = "inline-block";
            if (oauthInput) oauthInput.disabled       = false;
            if (oauthMsg)   oauthMsg.innerHTML = '<span style="color:var(--success)">&#x2705; Native OAuth supported.</span>';
        } else if (["openai","anthropic","grok"].includes(prov)) {
            if (oauthBtn)   oauthBtn.style.display    = "none";
            if (oauthInput) { oauthInput.disabled = true; oauthInput.value = ""; }
            if (oauthMsg)   oauthMsg.innerHTML = '<span style="color:var(--error)">&#x274C; OAuth not supported for ' + prov.toUpperCase() + '. Use API Key.</span>';
        } else {
            if (oauthBtn)   oauthBtn.style.display    = "none";
            if (oauthInput) oauthInput.disabled       = false;
            if (oauthMsg)   oauthMsg.innerHTML = 'OAuth capability depends on custom configuration.';
        }
    }

    /* ── Create SQLite database ── */
    async function initSqlite() {
        const statusEl = document.getElementById("migration-status");
        const btn      = document.getElementById("btn-init-sqlite");
        if (statusEl) { statusEl.innerHTML = '&#x23F3; Creating SQLite database&#x2026;'; statusEl.style.color = "var(--text-secondary)"; }
        if (btn) btn.disabled = true;
        try {
            const data = await api.initSqlite();
            if (statusEl) { statusEl.innerHTML = '&#x2705; ' + data.message; statusEl.style.color = "var(--success, #4ade80)"; }
        } catch (e) {
            if (statusEl) { statusEl.innerHTML = '&#x274C; ' + _esc(e.message); statusEl.style.color = "var(--error)"; }
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    /* ── Migrate state ── */
    async function migrateState(direction) {
        const statusEl  = document.getElementById("migration-status");
        const btnSqlite = document.getElementById("btn-migrate-to-sqlite");
        const btnJson   = document.getElementById("btn-migrate-to-json");
        const label = direction === "json_to_sqlite" ? "JSON &#x2192; SQLite" : "SQLite &#x2192; JSON";

        if (statusEl) { statusEl.innerHTML = '&#x23F3; Migrating ' + label + '&#x2026;'; statusEl.style.color = "var(--text-secondary)"; }
        if (btnSqlite) btnSqlite.disabled = true;
        if (btnJson)   btnJson.disabled   = true;

        try {
            const data = await api.migrateState(direction);
            let msg = '&#x2705; Migration ' + label + ' complete: '
                + data.migrated + ' / ' + data.total + ' runs migrated.';
            if (data.errors && data.errors.length) {
                msg += ' &#x26A0;&#xFE0F; ' + data.errors.length + ' error(s): '
                    + data.errors.slice(0, 3).join('; ') + (data.errors.length > 3 ? '&#x2026;' : '');
            }
            if (statusEl) { statusEl.innerHTML = msg; statusEl.style.color = data.errors?.length ? "var(--warning, orange)" : "var(--success)"; }
        } catch (e) {
            if (statusEl) { statusEl.innerHTML = '&#x274C; Migration failed: ' + _esc(e.message); statusEl.style.color = "var(--error)"; }
        } finally {
            if (btnSqlite) btnSqlite.disabled = false;
            if (btnJson)   btnJson.disabled   = false;
        }
    }

    return {
        applyAndSaveSettings,
        settingsResetDirs,
        applyTheme,
        fetchCondaEnvs,
        fetchLLMModels,
        handleLLMProviderChange,
        testLLMConnection,
        initSqlite,
        migrateState,
        pluginsMod,
        getRefsMod: _getRefsMod,
    };
}

/* ════════════════════════════════════════════════════════════
   SettingsModal — main React component
   ════════════════════════════════════════════════════════════ */

export function SettingsModal({ api, store, showModal, closeModal, logMsg }) {
    const mod = useRef(null);
    if (!mod.current) mod.current = createSettingsModule(api, store, showModal, closeModal);

    const [activeTab,       setActiveTab]       = useState("tab-dirs");
    const [settings,        setSettings]        = useState(() => store.getState().settings);
    const [dirWarnings,     setDirWarnings]     = useState([]);
    const [saveMsg,         setSaveMsg]         = useState(null); // { type:"ok"|"warn"|"err", text }
    const [localPluginsDir, setLocalPluginsDirState] = useState(
        () => store.getState().localPluginsDir || ""
    );

    const handleLocalPluginsDirChange = useCallback((val) => {
        setLocalPluginsDirState(val);
        store.getState().setLocalPluginsDir(val);
    }, [store]);

    // Capture dirs at modal-open time so we only warn about dirs the user actually changed
    const originalDirsRef = useRef(null);
    useEffect(() => {
        originalDirsRef.current = JSON.parse(JSON.stringify(store.getState().settings.dirs || {}));

        // Load user prefs from PHP/MySQL on modal open and merge into store/form
        api.getUserPreferences().then(prefs => {
            if (!prefs || !Object.keys(prefs).length) return;
            const patch = {};
            if (prefs.ui)              patch.ui              = prefs.ui;
            if (prefs.plugin_defaults) patch.plugin_defaults = prefs.plugin_defaults;
            if (prefs.plugin_paths)    patch.plugin_paths    = prefs.plugin_paths;
            if (prefs.llm_config)      patch.llm_config      = prefs.llm_config;
            if (prefs.dirs)            patch.dirs            = prefs.dirs;
            if (prefs.auth)            patch.auth            = prefs.auth;
            if (Object.keys(patch).length) {
                store.getState().applySettings(patch);
                setSettings({ ...store.getState().settings });
            }
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep settings in sync with store
    useEffect(() => {
        const unsub = store.subscribe(() => setSettings({ ...store.getState().settings }));
        return unsub;
    }, [store]);

    // Listen for external "go to tab" events (e.g. from AI Builder "Configure" link)
    useEffect(() => {
        const handler = (e) => {
            if (e.detail) setActiveTab(e.detail);
        };
        window.addEventListener("seqnode:settings-goto", handler);
        return () => window.removeEventListener("seqnode:settings-goto", handler);
    }, []);

    // Re-run LLM provider logic when tab changes to auth
    useEffect(() => {
        if (activeTab === "tab-auth") {
            setTimeout(() => mod.current.handleLLMProviderChange(), 50);
        }
        if (activeTab === "tab-refs") {
            setTimeout(() => mod.current.getRefsMod().loadReferencesTab(), 50);
        }
        if (activeTab === "tab-plugin-paths") {
            setTimeout(() => {
                mod.current.pluginsMod.syncAllPluginPaths();
                setSettings({ ...store.getState().settings });
            }, 50);
        }
        if (activeTab === "tab-plugin-defaults") {
            setTimeout(() => {
                mod.current.pluginsMod.syncAllPluginDefaults();
                setSettings({ ...store.getState().settings });
            }, 50);
        }
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateSetting = useCallback((dotPath, value) => {
        store.getState().updateSetting(dotPath, value);
        setSettings({ ...store.getState().settings });
    }, [store]);

    const handleApplySave = useCallback(async () => {
        setSaveMsg(null);
        try {
            const result = await mod.current.applyAndSaveSettings(false, originalDirsRef.current);
            if (result?.needsConfirm) {
                setDirWarnings(result.warnings);
            } else {
                setDirWarnings([]);
                mod.current.applyTheme(store.getState().settings.ui.theme);
                if (result?.vpsSaved) {
                    setSaveMsg({ type: "ok", text: "Settings saved." });
                } else if (result?.phpSaved) {
                    setSaveMsg({ type: "warn", text: "UI preferences saved. Engine settings not saved (VPS offline)." });
                } else {
                    setSaveMsg({ type: "err", text: "Could not save settings. Check connection." });
                }
                // Auto-hide success message after 4 s
                if (result?.phpSaved || result?.vpsSaved) {
                    setTimeout(() => setSaveMsg(null), 4000);
                }
            }
        } catch (e) {
            setSaveMsg({ type: "err", text: "Save error: " + e.message });
        }
    }, [store]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleForceSave = useCallback(async () => {
        setSaveMsg(null);
        setDirWarnings([]);
        try {
            const result = await mod.current.applyAndSaveSettings(true);
            mod.current.applyTheme(store.getState().settings.ui.theme);
            if (result?.vpsSaved) {
                setSaveMsg({ type: "ok", text: "Settings force-saved." });
            } else if (result?.phpSaved) {
                setSaveMsg({ type: "warn", text: "UI preferences saved (VPS offline)." });
            }
            if (result?.phpSaved || result?.vpsSaved) setTimeout(() => setSaveMsg(null), 4000);
        } catch (e) {
            setSaveMsg({ type: "err", text: "Save error: " + e.message });
        }
    }, [store]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleResetDirs = useCallback(async () => {
        await mod.current.settingsResetDirs();
        setSettings({ ...store.getState().settings });
    }, [store]);


    const s  = settings;
    const sc = s.slurm_config || {};
    const auth = s.auth || {};
    const llm  = s.llm_config || {};

    const TABS = [
        { id: "tab-dirs",            label: "&#x1F4C1; Directories" },
        { id: "tab-exec",            label: "&#x2699; Execution" },
        { id: "tab-runner",          label: "&#x1F680; Runner" },
        { id: "tab-ui",              label: "&#x1F3A8; Interface" },
        { id: "tab-plugin-paths",    label: "&#x1F9E9; Plugin Paths" },
        { id: "tab-plugin-defaults", label: "&#x1F527; Plugin Defaults" },
        { id: "tab-refs",            label: "&#x1F9EC; References" },
        { id: "tab-auth",            label: "&#x1F512; Auth" },
        { id: "tab-profile",         label: "&#x1F464; Profile" },
        { id: "tab-agent",           label: "&#x1F916; Agent" },
    ];

    return (
        <div className="settings-modal-inner">
            {/* Tabs */}
            <div className="settings-tabs">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={"settings-tab" + (activeTab === t.id ? " active" : "")}
                        dangerouslySetInnerHTML={{ __html: t.label }}
                        onClick={() => setActiveTab(t.id)}
                    />
                ))}
            </div>

            {/* ── Scrollable body — all tab content lives here ── */}
            <div className="settings-body">

            {/* ── Directories ── */}
            {activeTab === "tab-dirs" && (
                <div className="settings-section active">
                    <div className="settings-group-title">System Directories</div>
                    <div className="settings-desc">Define default directories. They will be created automatically on Apply &amp; Save.</div>
                    {_dirRows(s.dirs, updateSetting, api)}

                    <div className="settings-group-title" style={{ marginTop: 18 }}>My Plugins Directory</div>
                    <div className="settings-desc">
                        Path on <strong>your local machine</strong> where your personal plugin YAML files live.
                        Requires the SeqNode Agent to be connected. Changes take effect immediately —
                        plugins appear in the sidebar tagged&nbsp;
                        <span style={{
                            fontSize: "9px", padding: "1px 5px",
                            background: "rgba(74,158,255,.2)", color: "#4a9eff", borderRadius: 3,
                        }}>MY</span>.
                    </div>
                    <div className="settings-row">
                        <label>My Plugins Directory</label>
                        <input
                            type="text"
                            id="si-local-plugins-dir"
                            value={localPluginsDir}
                            onChange={e => handleLocalPluginsDirChange(e.target.value)}
                            placeholder="e.g. ~/seqnode-plugins"
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn-small btn-browse"
                            title="Browse (agent filesystem)"
                            onClick={() => openFileBrowserOverlay(
                                api,
                                { mode: "dir", initialPath: localPluginsDir || "" },
                                (p) => handleLocalPluginsDirChange(p)
                            )}
                        >&#x1F4C2;</button>
                    </div>
                </div>
            )}

            {/* ── Execution ── */}
            {activeTab === "tab-exec" && (
                <div className="settings-section active">
                    <div className="settings-group-title">Execution Engine</div>
                    <div className="settings-desc">Resource limits and runtime behavior.</div>
                    {_numRow("Max Threads",          "execution.max_threads",       s.execution.max_threads,       updateSetting)}
                    {_numRow("Max Memory (GB)",       "execution.max_memory_gb",     s.execution.max_memory_gb,     updateSetting)}
                    {_selRow("Container Runtime",     "execution.container_runtime", s.execution.container_runtime, updateSetting, ["auto","docker","singularity","podman","none"])}
                    {_textRow("Shell",                "execution.shell",             s.execution.shell,             updateSetting)}
                    {_numRow("Timeout (min, 0=none)", "execution.timeout_minutes",   s.execution.timeout_minutes,   updateSetting)}
                    {_boolRow("Retry Failed Steps",   "execution.retry_failed",      s.execution.retry_failed,      updateSetting)}
                    {_numRow("Retry Count",           "execution.retry_count",       s.execution.retry_count,       updateSetting)}

                    <div className="settings-group-title" style={{ marginTop: "14px" }}>Execution Mode</div>
                    <div className="settings-desc">
                        <b>System</b>: tools must be in the server PATH.{" "}
                        <b>Conda</b>: every command is wrapped with <code>conda run -n &lt;env&gt;</code>.
                    </div>
                    {_selRow("Run Mode", "execution.run_mode", s.execution.run_mode || "system", updateSetting, ["system","conda"])}

                    <div className="settings-row">
                        <label>Global Conda Environment</label>
                        <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                            <select id="si-conda-env-select" style={{ flex: 1 }}
                                value={s.execution.conda_env || ""}
                                onChange={e => updateSetting("execution.conda_env", e.target.value)}>
                                <option value="">-- Select or fetch envs --</option>
                                {s.execution.conda_env && (
                                    <option value={s.execution.conda_env}>{s.execution.conda_env}</option>
                                )}
                            </select>
                            <button className="btn-small" onClick={() => mod.current.fetchCondaEnvs()} style={{ whiteSpace: "nowrap" }}>&#x1F504; Fetch Envs</button>
                        </div>
                    </div>

                    {_dirRow("Conda/Mamba Base Path", "execution.conda_path", s.execution.conda_path || "", updateSetting, api)}
                    <div className="settings-desc" style={{ marginTop: "-6px", marginBottom: "12px" }}>
                        Path to the conda or mamba binary. Leave empty to use <code>conda</code> from PATH.
                    </div>
                </div>
            )}

            {/* ── Runner ── */}
            {activeTab === "tab-runner" && (
                <div className="settings-section active">
                    <div className="settings-group-title">Execution Runner</div>
                    <div className="settings-desc">Select how SeqNode executes workflow nodes.</div>
                    {_selRow("Runner Type",   "runner_type",   s.runner_type   || "local", updateSetting, ["local","slurm"])}
                    <div className="settings-group-title" style={{ marginTop: "14px" }}>State Backend</div>
                    {_selRow("State Backend", "state_backend", s.state_backend || "json",  updateSetting, ["json","sqlite"])}

                    <div className="settings-group-title" style={{ marginTop: "14px" }}>&#x1F5C4; SQLite Database</div>
                    <div className="settings-desc">Create the SQLite database before migrating or switching to the SQLite backend.</div>
                    <div style={{ marginTop: "8px" }}>
                        <button className="btn-small" id="btn-init-sqlite"
                            style={{ background: "var(--bg-secondary, #2a2a3e)", border: "1px solid var(--accent)", color: "var(--accent)", padding: "5px 14px" }}
                            onClick={() => mod.current.initSqlite()}>
                            &#x1F5C3; Create SQLite Database
                        </button>
                    </div>

                    <div className="settings-group-title" style={{ marginTop: "14px" }}>&#x1F504; State Migration</div>
                    <div className="settings-desc">Migrate execution history between backends. Create the database first if switching to SQLite.</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        <button className="btn-small" id="btn-migrate-to-sqlite"
                            style={{ background: "var(--accent)", color: "#fff", padding: "5px 12px" }}
                            onClick={() => mod.current.migrateState("json_to_sqlite")}>
                            &#x1F4E6; JSON &rarr; SQLite
                        </button>
                        <button className="btn-small" id="btn-migrate-to-json"
                            style={{ background: "var(--bg-tertiary)", padding: "5px 12px" }}
                            onClick={() => mod.current.migrateState("sqlite_to_json")}>
                            &#x1F4C4; SQLite &rarr; JSON
                        </button>
                    </div>
                    <div id="migration-status" style={{ marginTop: "8px", fontSize: "12px", minHeight: "18px", color: "var(--text-secondary)" }} />

                    <div style={{ marginTop: "14px" }}>
                        <div className="settings-group-title">Slurm Configuration</div>
                        {_textRow("Partition",    "slurm_config.partition",     sc.partition     || "batch",    updateSetting)}
                        {_textRow("Time Limit",   "slurm_config.time_limit",    sc.time_limit    || "24:00:00", updateSetting)}
                        {_numRow("CPUs per Task", "slurm_config.cpus_per_task", sc.cpus_per_task || 1,          updateSetting)}
                        {_numRow("Memory (GB)",   "slurm_config.mem_gb",        sc.mem_gb        || 4,          updateSetting)}
                    </div>
                </div>
            )}

            {/* ── Interface ── */}
            {activeTab === "tab-ui" && (
                <div className="settings-section active">
                    <div className="settings-group-title">User Interface</div>
                    <div className="settings-row">
                        <label>Theme</label>
                        <select value={s.ui.theme || "dark"} onChange={e => { updateSetting("ui.theme", e.target.value); mod.current.applyTheme(e.target.value); }}>
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </div>
                    {_numRow("Grid Size (px)",         "ui.grid_size",          s.ui.grid_size,          updateSetting)}
                    {_boolRow("Snap to Grid",           "ui.snap_to_grid",       s.ui.snap_to_grid,       updateSetting)}
                    {_boolRow("Auto Save",              "ui.auto_save",          s.ui.auto_save,          updateSetting)}
                    {_numRow("Auto Save Interval (s)", "ui.auto_save_interval", s.ui.auto_save_interval, updateSetting)}
                    {_boolRow("Show Minimap",           "ui.show_minimap",       s.ui.show_minimap,       updateSetting)}
                    {_numRow("Log Max Lines",           "ui.log_max_lines",      s.ui.log_max_lines,      updateSetting)}
                </div>
            )}

            {/* ── Plugin Paths ── */}
            {activeTab === "tab-plugin-paths" && (
                <div className="settings-section active">
                    <div className="settings-group-title">Plugin Binary &amp; Reference Paths</div>
                    <div className="settings-desc">Set per-plugin executable paths and reference library directories.</div>
                    <PluginPathsSettings settings={settings} store={store} mod={mod} updateSetting={updateSetting} api={api} />
                </div>
            )}

            {/* ── Plugin Defaults ── */}
            {activeTab === "tab-plugin-defaults" && (
                <div className="settings-section active">
                    <div className="settings-group-title">Plugin Default Parameter Overrides</div>
                    <div className="settings-desc">Override default parameter values for specific plugins globally.</div>
                    <PluginDefaultsSettings settings={settings} store={store} mod={mod} updateSetting={updateSetting} />
                </div>
            )}

            {/* ── References (loaded lazily by useEffect) ── */}
            {activeTab === "tab-refs" && (
                <div className="settings-section active">
                    <div id="refs-content">
                        <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Loading catalog...</p>
                    </div>
                </div>
            )}

            {/* ── Auth & LLM ── */}
            {activeTab === "tab-auth" && (
                <div className="settings-section active">
                    <AuthSettings settings={settings} updateSetting={updateSetting} />
                    <LLMSettings settings={settings} updateSetting={updateSetting} mod={mod} />
                </div>
            )}

            {/* ── Profile ── */}
            {activeTab === "tab-profile" && (
                <div className="settings-section active" style={{ padding: 0 }}>
                    <UserProfileModal store={store} closeModal={closeModal} hideFooter={true} />
                </div>
            )}

            {/* ── Agent ── */}
            {activeTab === "tab-agent" && (
                <div className="settings-section active">
                    <AgentSettings api={api} store={store} />
                </div>
            )}

            {/* Directory access warning panel */}
            {dirWarnings.length > 0 && (
                <div style={{ margin: "8px 0 0", padding: "12px 14px", background: "var(--bg-tertiary)", border: "1px solid #f59e0b", borderRadius: "6px" }}>
                    <div style={{ fontWeight: 600, color: "#f59e0b", marginBottom: "8px" }}>
                        &#x26A0; Directory Access Issues — review before saving
                    </div>
                    {dirWarnings.map(w => (
                        <div key={w.key} style={{ marginBottom: "8px", fontSize: "12px", lineHeight: "1.5" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "11px" }}>{w.key}</span>
                            {" — "}
                            <code style={{ fontSize: "11px", color: "var(--accent)" }}>{w.path}</code>
                            <br />
                            <span style={{ color: "var(--text-secondary)" }}>{w.reason}</span>
                        </div>
                    ))}
                    <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                        As administrator, you can force-save these paths. SeqNode will attempt to create them at runtime,
                        or you can create them manually (e.g. <code>sudo mkdir -p &lt;path&gt;</code>).
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={handleForceSave}
                            style={{ background: "#f59e0b", color: "#000", fontWeight: 600 }}>
                            &#x1F512; Force Save (Admin Override)
                        </button>
                        <button onClick={() => setDirWarnings([])}>&#x2715; Cancel</button>
                    </div>
                </div>
            )}

            </div>{/* end .settings-body */}

            {/* ── Footer — always pinned to the bottom of the modal ── */}
            <div className="settings-footer">
                {saveMsg && (
                    <div style={{
                        marginBottom: 8, padding: "7px 12px", borderRadius: 5, fontSize: 12,
                        background: saveMsg.type === "ok"   ? "rgba(34,197,94,.12)"  :
                                    saveMsg.type === "warn" ? "rgba(245,158,11,.12)" : "rgba(239,68,68,.12)",
                        color:      saveMsg.type === "ok"   ? "var(--success,#22c55e)" :
                                    saveMsg.type === "warn" ? "var(--warning,#f59e0b)" : "var(--error,#ef4444)",
                        border: `1px solid ${
                                    saveMsg.type === "ok"   ? "var(--success,#22c55e)" :
                                    saveMsg.type === "warn" ? "var(--warning,#f59e0b)" : "var(--error,#ef4444)"}`,
                        width: "100%",
                    }}>
                        {saveMsg.type === "ok"   ? "✔ " :
                         saveMsg.type === "warn" ? "⚠ " : "✖ "}
                        {saveMsg.text}
                    </div>
                )}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
                    {activeTab === "tab-profile" ? (
                        <>
                            <button onClick={closeModal}>Cancel</button>
                            <button form="user-profile-form" type="submit" style={{ background: "var(--success)" }}>
                                &#x2714; Save Profile
                            </button>
                        </>
                    ) : activeTab === "tab-agent" ? (
                        <button onClick={closeModal}>&#x2715; Close</button>
                    ) : (
                        <>
                            <button onClick={closeModal}>Cancel</button>
                            <button onClick={handleResetDirs} style={{ marginRight: "auto", background: "var(--bg-tertiary)" }} title="Reset directories to defaults">
                                &#x21BA; Reset Dirs
                            </button>
                            <button onClick={handleApplySave} style={{ background: "var(--success)" }}>&#x2714; Apply &amp; Save</button>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════════ */

const _MASKED = "__MASKED__";

function AuthSettings({ settings, updateSetting }) {
    const auth = settings.auth || {};
    const [showJwt, setShowJwt] = useState(false);
    const rawJwt = auth.jwt_secret || "";
    const jwtVal = rawJwt === _MASKED ? "" : rawJwt;
    return (
        <>
            <div className="settings-group-title">Authentication</div>
            <div className="settings-desc">Controls access to the SeqNode API.</div>
            {_boolRow("Enable Auth",      "auth.enabled",      !!auth.enabled,        updateSetting)}
            {_selRow("Auth Mode",         "auth.mode",         auth.mode || "api_key", updateSetting, ["api_key","jwt"])}
            <div className="settings-row">
                <label>JWT Secret</label>
                <div style={{ display: "flex", gap: "6px", flex: 1, alignItems: "center" }}>
                    <input type={showJwt ? "text" : "password"}
                        defaultValue={jwtVal}
                        placeholder="Enter JWT secret..."
                        autoComplete="new-password"
                        style={{ flex: 1 }}
                        onBlur={e => { if (e.target.value) updateSetting("auth.jwt_secret", e.target.value); }}
                    />
                    <button className="btn-icon-eye" title={showJwt ? "Hide secret" : "Show secret"}
                        onClick={() => setShowJwt(v => !v)}
                        style={{ flexShrink: 0 }}>
                        {showJwt ? "🙈" : "👁"}
                    </button>
                </div>
            </div>
            {_numRow("Token TTL (hours)", "auth.token_ttl_h",  auth.token_ttl_h || 24, updateSetting)}
        </>
    );
}

function LLMSettings({ settings, updateSetting, mod }) {
    const llm = settings.llm_config || {};
    const [showKey, setShowKey]     = useState(false);
    const [showOauth, setShowOauth] = useState(false);
    const apiKeyVal   = (llm.api_key    === _MASKED || !llm.api_key)   ? "" : llm.api_key;
    const oauthVal    = (llm.oauth_token === _MASKED || !llm.oauth_token) ? "" : llm.oauth_token;
    return (
        <>
            <div className="settings-group-title" style={{ marginTop: "24px" }}>AI Workflow Builder — LLM</div>
            <div className="settings-desc">
                Configure the LLM provider used by the <strong>AI Workflow Builder</strong> to generate bioinformatics pipelines from natural language.
                Supports cloud providers (Anthropic, OpenAI, Gemini, Grok) and local inference via Ollama.
            </div>

            <div className="settings-row">
                <label>Provider</label>
                <select id="llm-provider-select"
                    value={llm.provider || "openai"}
                    onChange={e => { updateSetting("llm_config.provider", e.target.value); setTimeout(() => mod.current.handleLLMProviderChange(), 10); }}>
                    <option value="openai">OpenAI (Online)</option>
                    <option value="anthropic">Anthropic (Online)</option>
                    <option value="gemini">Google Gemini (Online)</option>
                    <option value="grok">Grok / xAI (Online)</option>
                    <option value="azure">Microsoft Azure OpenAI</option>
                    <option value="ollama">Ollama (Offline/Local)</option>
                    <option value="custom">Custom / OpenAI Compatible</option>
                </select>
            </div>

            <div className="settings-row" id="row-llm-base">
                <label>API Base URL</label>
                <input type="text" id="llm-base-input"
                    value={llm.api_base || ""}
                    onChange={e => updateSetting("llm_config.api_base", e.target.value)}
                    placeholder="e.g. http://localhost:11434/v1" />
            </div>

            <div className="settings-row">
                <label>API Key</label>
                <div style={{ display: "flex", gap: "6px", flex: 1, alignItems: "center" }}>
                    <input type={showKey ? "text" : "password"} id="llm-key-input" style={{ flex: 1 }}
                        value={apiKeyVal}
                        onChange={e => updateSetting("llm_config.api_key", e.target.value)}
                        placeholder="sk-ant-... / sk-..." autoComplete="new-password" />
                    <button className="btn-icon-eye" title={showKey ? "Hide key" : "Show key"}
                        onClick={() => setShowKey(v => !v)}
                        style={{ flexShrink: 0 }}>
                        {showKey ? "🙈" : "👁"}
                    </button>
                </div>
            </div>

            <div className="settings-row">
                <label>OAuth Token</label>
                <div style={{ display: "flex", gap: "8px", flex: 1, flexDirection: "column" }}>
                    <div style={{ display: "flex", gap: "6px", width: "100%", alignItems: "center" }}>
                        <input type={showOauth ? "text" : "password"} id="llm-oauth-input" style={{ flex: 1 }}
                            value={oauthVal}
                            onChange={e => updateSetting("llm_config.oauth_token", e.target.value)}
                            placeholder="Bearer ..." />
                        <button className="btn-icon-eye" title={showOauth ? "Hide token" : "Show token"}
                            onClick={() => setShowOauth(v => !v)}
                            style={{ flexShrink: 0 }}>
                            {showOauth ? "🙈" : "👁"}
                        </button>
                        <button className="btn-small" id="llm-oauth-btn"
                            onClick={() => alert("OAuth flow initiated. Connecting to authentication provider...")}
                            style={{ whiteSpace: "nowrap" }}>
                            &#x1F511; Login via OAuth
                        </button>
                    </div>
                    <span id="llm-oauth-msg" style={{ fontSize: "11px", color: "var(--text-secondary)" }} />
                </div>
            </div>

            <div className="settings-row">
                <label>Model</label>
                <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                    <select id="llm-model-select" style={{ flex: 1 }}
                        value={llm.model || ""}
                        onChange={e => updateSetting("llm_config.model", e.target.value)}>
                        <option value={llm.model || ""}>{llm.model || "Select provider and fetch..."}</option>
                    </select>
                    <button className="btn-small" onClick={() => mod.current.fetchLLMModels()} style={{ whiteSpace: "nowrap" }}>
                        &#x1F504; Fetch Models
                    </button>
                </div>
            </div>

            {/* Connection test row */}
            <div className="settings-row" style={{ alignItems: "flex-start", gap: "10px" }}>
                <label style={{ paddingTop: "6px" }}>Connection</label>
                <div style={{ display: "flex", gap: "10px", flex: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <button className="btn-small btn-test-conn" id="llm-test-btn"
                        onClick={() => mod.current.testLLMConnection()}
                        style={{ whiteSpace: "nowrap" }}>
                        &#x1F50C; Test Connection
                    </button>
                    <span id="llm-conn-status" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        Not tested yet — click Test Connection to verify.
                    </span>
                </div>
            </div>

            {/* AI Builder launch shortcut */}
            <div className="ai-builder-launch-box">
                <div className="ai-builder-launch-desc">
                    <span className="ai-builder-launch-icon">&#x1F916;</span>
                    <div>
                        <strong>AI Workflow Builder</strong>
                        <p>Use AI to generate complete bioinformatics pipelines from a natural language description. The workflow will be placed directly on the canvas.</p>
                    </div>
                </div>
                <button
                    className="ai-builder-launch-btn"
                    onClick={() => window.dispatchEvent(new CustomEvent("seqnode:open-ai-builder"))}
                >
                    &#x2728; Launch AI Builder
                </button>
            </div>
        </>
    );
}

function PluginPathsSettings({ settings, store, mod, updateSetting, api }) {
    const plugins = store(s => s.plugins || []);
    const paths = settings.plugin_paths || {};

    return (
        <>
            <div style={{ marginBottom: 10 }}>
                <button className="btn-small" onClick={() => mod.current.pluginsMod.verifyAllPlugins()}>
                    &#x1F50D; Verify All Installations
                </button>{" "}
                <button className="btn-small" title="Sync all installed plugins into paths config" onClick={() => {
                    mod.current.pluginsMod.syncAllPluginPaths();
                    updateSetting("plugin_paths", store.getState().settings.plugin_paths);
                }}>
                    &#x1F504; Sync Installed Plugins
                </button>
            </div>
            <div id="plugin-paths-list">
                {plugins.map(plugin => {
                    const pp = paths[plugin.id] || {};
                    const statusId = "pstatus-" + plugin.id;
                    return (
                        <details key={plugin.id} style={{ marginBottom: 6 }}>
                            <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", padding: "4px 0" }}>
                                {plugin.name} <code style={{ fontSize: 10, color: "var(--text-secondary)" }}>({plugin.id})</code>
                                <span id={statusId} style={{ marginLeft: 8 }}></span>
                            </summary>
                            <div style={{ padding: "6px 0 4px 12px" }}>
                                <PathRow label="Binary / Exec Path" dotPath={`plugin_paths.${plugin.id}.bin_path`} value={pp.bin_path || ""} updateSetting={updateSetting} api={api} />
                                <PathRow label="References Path" dotPath={`plugin_paths.${plugin.id}.refs_path`} value={pp.refs_path || ""} updateSetting={updateSetting} api={api} />
                                <PathRow label="Library / DB Path" dotPath={`plugin_paths.${plugin.id}.lib_path`} value={pp.lib_path || ""} updateSetting={updateSetting} api={api} />
                                <button className="btn-small" style={{ marginTop: 4 }} onClick={() => mod.current.pluginsMod.verifySinglePlugin(plugin.id, statusId)}>
                                    &#x1F50D; Verify
                                </button>
                            </div>
                        </details>
                    );
                })}
            </div>
        </>
    );
}

function PathRow({ label, dotPath, value, updateSetting, api }) {
    return (
        <div className="settings-row">
            <label style={{ minWidth: 140 }}>{label}</label>
            <input type="text" value={value} onChange={e => updateSetting(dotPath, e.target.value)} style={{ flex: 1 }} />
            <button className="btn-small btn-browse" title="Browse"
                onClick={() => openFileBrowserOverlay(api, { mode: "dir", initialPath: value || "" },
                    (p) => updateSetting(dotPath, p))}>
                &#x1F4C2;
            </button>
        </div>
    );
}

function PluginDefaultsSettings({ settings, store, mod, updateSetting }) {
    const plugins = store(s => s.plugins || []);
    const defaults = settings.plugin_defaults || {};

    const handleSync = () => {
        mod.current.pluginsMod.syncAllPluginDefaults();
        updateSetting("plugin_defaults", store.getState().settings.plugin_defaults);
    };

    const updatePluginDefault = (pluginId, paramKey, val) => {
        store.getState().updatePluginDefault(pluginId, paramKey, val);
        updateSetting(`plugin_defaults.${pluginId}.${paramKey}`, val); 
    };

    return (
        <>
            <div style={{ marginBottom: 10 }}>
                <button className="btn-small" title="Populate defaults from all installed plugin YAMLs" onClick={handleSync}>
                    &#x1F504; Sync from YAMLs
                </button>
            </div>
            {plugins.map(plugin => {
                const paramKeys = Object.keys(plugin.params || {});
                if (!paramKeys.length) return null;

                return (
                    <details key={plugin.id} style={{ marginBottom: 8 }}>
                        <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                            {plugin.name} <code style={{ fontSize: 10, color: "var(--text-secondary)" }}>({plugin.id})</code>
                        </summary>
                        <div style={{ padding: "6px 0 4px 16px" }}>
                            {paramKeys.map(pk => {
                                const schema = plugin.params[pk];
                                const overrideV = (defaults[plugin.id] || {})[pk];
                                const displayVal = overrideV !== undefined ? overrideV : (schema.default !== undefined ? schema.default : "");

                                if (schema.type === "bool") {
                                    const chk = overrideV !== undefined ? !!overrideV : !!schema.default;
                                    return (
                                        <div key={pk} className="settings-row settings-row-check">
                                            <label>{schema.label || pk}</label>
                                            <input type="checkbox" checked={chk} onChange={e => updatePluginDefault(plugin.id, pk, e.target.checked)} />
                                        </div>
                                    );
                                } else if (schema.choices && schema.choices.length) {
                                    return (
                                        <div key={pk} className="settings-row">
                                            <label>{schema.label || pk}</label>
                                            <select value={displayVal} onChange={e => updatePluginDefault(plugin.id, pk, e.target.value)}>
                                                {schema.choices.map(ch => (
                                                    <option key={ch} value={ch}>{ch}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                } else if (schema.type === "int" || schema.type === "float") {
                                    return (
                                        <div key={pk} className="settings-row">
                                            <label>{schema.label || pk}</label>
                                            <input type="number" value={displayVal} style={{ flex: 1 }} onChange={e => updatePluginDefault(plugin.id, pk, Number(e.target.value))} />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={pk} className="settings-row">
                                            <label>{schema.label || pk}</label>
                                            <input type="text" value={displayVal} style={{ flex: 1 }} onChange={e => updatePluginDefault(plugin.id, pk, e.target.value)} />
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </details>
                );
            })}
        </>
    );
}

/* ── CodeBlock helper ────────────────────────────────────────────────────── */
function CodeBlock({ cmd, onCopy, label }) {
    const [copied, setCopied] = useState(false);
    return (
        <div style={{ position: "relative", marginBottom: 8 }}>
            {label && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 3 }}>{label}</div>}
            <pre style={{
                background: "var(--bg-tertiary)", borderRadius: 5, padding: "8px 40px 8px 12px",
                fontSize: 11, fontFamily: "monospace", margin: 0, overflowX: "auto",
                lineHeight: 1.6, color: "var(--text)", border: "1px solid var(--border)",
                whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>{cmd}</pre>
            <button onClick={() => { onCopy(cmd); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
                style={{
                    position: "absolute", top: label ? 20 : 4, right: 4,
                    background: "var(--bg-secondary)", border: "1px solid var(--border)",
                    borderRadius: 4, padding: "2px 7px", fontSize: 10, cursor: "pointer",
                    color: copied ? "var(--success)" : "var(--text-secondary)",
                }}>
                {copied ? "✓" : "📋"}
            </button>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   AgentSettings — SeqNode Agent connection configuration
   ════════════════════════════════════════════════════════════ */

const AGENT_SERVER = "wss://api.seqnode.onnetweb.com/ws/agent";

function AgentSettings({ api, store }) {
    const [tokenInfo,       setTokenInfo]       = useState(null);
    const [connectedAgents, setConnectedAgents] = useState([]);
    const [loadingToken,    setLoadingToken]    = useState(true);
    const [loadingAgents,   setLoadingAgents]   = useState(false);
    const [generating,      setGenerating]      = useState(false);
    const [label,           setLabel]           = useState("My Workstation");
    const [copied,          setCopied]          = useState(false);
    const [tab,             setTab]             = useState("token");   // "token" | "agents" | "install"
    const [msg,             setMsg]             = useState(null);

    // ── Load token on mount ───────────────────────────────────────────────────
    useEffect(() => {
        setLoadingToken(true);
        api.getAgentToken()
            .then(d => { setTokenInfo(d?.token ? d : null); if (d?.label) setLabel(d.label); })
            .catch(() => setMsg({ type: "err", text: "Could not load agent token." }))
            .finally(() => setLoadingToken(false));
    }, [api]);

    // ── Poll connected agents when on agents tab ──────────────────────────────
    useEffect(() => {
        if (tab !== "agents") return;
        let alive = true;
        const load = () => {
            setLoadingAgents(true);
            api.getConnectedAgents()
                .then(d => { if (alive) setConnectedAgents(d?.agents || []); })
                .catch(() => { if (alive) setConnectedAgents([]); })
                .finally(() => { if (alive) setLoadingAgents(false); });
        };
        load();
        const tid = setInterval(load, 8000);
        return () => { alive = false; clearInterval(tid); };
    }, [tab, api]);

    // ── Token actions ─────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (tokenInfo && !confirm("Generate a new token? The existing token and any connected agents will be invalidated.")) return;
        setGenerating(true);
        setMsg(null);
        try {
            const d = await api.regenerateAgentToken(label);
            setTokenInfo(d);
            setMsg({ type: "ok", text: "Token generated successfully." });
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async () => {
        if (!confirm("Revoke the agent token? All connected agents will disconnect immediately.")) return;
        try {
            await api.revokeAgentToken();
            setTokenInfo(null);
            setMsg({ type: "ok", text: "Token revoked." });
        } catch (e) {
            setMsg({ type: "err", text: e.message });
        }
    };

    const copyToken = () => {
        if (!tokenInfo?.token) return;
        navigator.clipboard.writeText(tokenInfo.token).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const copyCmd = (cmd) => navigator.clipboard.writeText(cmd).catch(() => {});

    const token  = "<YOUR-AGENT-TOKEN>";
    const st     = { fontSize: 12 };
    const tabSty = (id) => ({
        padding: "6px 14px", background: "none", border: "none",
        borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent",
        color: tab === id ? "var(--text)" : "var(--text-secondary)",
        cursor: "pointer", fontSize: 13, fontWeight: tab === id ? 600 : 400,
    });

    const initCmdLinux = `# Replace <YOUR-AGENT-TOKEN> with the token from the Token tab above
python agent.py init \\
  --server ${AGENT_SERVER} \\
  --token  ${token} \\
  --workspace ~/seqnode-workspace \\
  --label  "${label || "My Workstation"}"`;

    const initCmdWindows = `:: Replace <YOUR-AGENT-TOKEN> with the token from the Token tab above
python agent.py init --server ${AGENT_SERVER} --token ${token} --workspace %USERPROFILE%\\seqnode-workspace --label "${label || "My Workstation"}"`;

    return (
        <>
            <div className="settings-group-title">&#x1F916; SeqNode Agent</div>
            <div className="settings-desc" style={{ marginBottom: 12 }}>
                The SeqNode Agent runs on your local computer or lab server.
                It opens a secure reverse WebSocket connection to SeqNode-OS, allowing you to
                orchestrate bioinformatics pipelines <strong>on your own machine</strong> — your
                raw data (FASTQ, BAM, VCF) never leaves your environment.
            </div>

            {/* Sub-tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
                <button style={tabSty("token")}   onClick={() => setTab("token")}>&#x1F511; Token</button>
                <button style={tabSty("agents")}  onClick={() => setTab("agents")}>&#x1F4F6; Connected Agents</button>
                <button style={tabSty("install")} onClick={() => setTab("install")}>&#x1F4E6; Installation</button>
            </div>

            {msg && (
                <div style={{
                    margin: "0 0 10px", padding: "8px 12px", borderRadius: 5, fontSize: 12,
                    background: msg.type === "ok" ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
                    color:      msg.type === "ok" ? "var(--success, #22c55e)" : "var(--error, #ef4444)",
                    border:     `1px solid ${msg.type === "ok" ? "var(--success, #22c55e)" : "var(--error, #ef4444)"}`,
                }}>{msg.type === "ok" ? "✔ " : "✖ "}{msg.text}</div>
            )}

            {/* ── Token tab ── */}
            {tab === "token" && (
                <>
                    {loadingToken ? (
                        <div style={{ ...st, color: "var(--text-secondary)", padding: "6px 0" }}>Loading…</div>
                    ) : tokenInfo ? (
                        <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
                            <div className="settings-row">
                                <label>Token</label>
                                <div style={{ display: "flex", gap: 6, flex: 1 }}>
                                    <input type="text" readOnly value={tokenInfo.token}
                                        style={{ flex: 1, fontFamily: "monospace", fontSize: 11 }} />
                                    <button className="btn-small" onClick={copyToken}>
                                        {copied ? "✓ Copied" : "📋 Copy"}
                                    </button>
                                </div>
                            </div>
                            <div className="settings-row">
                                <label>Label</label>
                                <input type="text" value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g. Home Workstation"
                                    style={{ flex: 1 }} />
                            </div>
                            <div className="settings-row">
                                <label>Created</label>
                                <span style={{ ...st, flex: 1, color: "var(--text-secondary)", padding: "5px 0" }}>
                                    {tokenInfo.created_at || "—"}
                                </span>
                            </div>
                            {tokenInfo.last_seen && (
                                <div className="settings-row">
                                    <label>Last Agent Seen</label>
                                    <span style={{ ...st, flex: 1, color: "var(--success, #22c55e)", padding: "5px 0" }}>
                                        {tokenInfo.last_seen}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                <button className="btn-small" onClick={handleGenerate} disabled={generating}>
                                    &#x1F504; Regenerate Token
                                </button>
                                <button className="btn-small"
                                    style={{ color: "var(--error, #f87171)" }}
                                    onClick={handleRevoke}>
                                    &#x1F5D1; Revoke
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
                            <div className="settings-desc" style={{ marginBottom: 12 }}>
                                No agent token yet. Generate one to connect your first agent.
                            </div>
                            <div className="settings-row">
                                <label>Label</label>
                                <input type="text" value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g. Home Workstation, Lab Server"
                                    style={{ flex: 1 }} />
                            </div>
                            <button
                                style={{ background: "var(--success, #22c55e)", color: "#000",
                                         padding: "6px 18px", marginTop: 8, fontWeight: 600 }}
                                onClick={handleGenerate} disabled={generating}>
                                {generating ? "Generating…" : "+ Generate Agent Token"}
                            </button>
                        </div>
                    )}

                    <div className="settings-desc" style={{ marginTop: 4 }}>
                        <strong>Security:</strong> Each token is unique to your account and is validated
                        server-side. Commands sent to your agent are signed with HMAC-SHA256.
                        The agent refuses to execute any command that fails signature verification
                        or accesses paths outside your configured workspace.
                    </div>
                </>
            )}

            {/* ── Connected Agents tab ── */}
            {tab === "agents" && (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ ...st, color: "var(--text-secondary)" }}>
                            {loadingAgents ? "Refreshing…" : `${connectedAgents.length} agent(s) connected`}
                        </div>
                        <button className="btn-small" onClick={() => setTab("agents")}>&#x1F504; Refresh</button>
                    </div>

                    {connectedAgents.length === 0 ? (
                        <div style={{
                            background: "var(--bg-tertiary)", borderRadius: 6, padding: "20px",
                            textAlign: "center", color: "var(--text-secondary)", fontSize: 13,
                        }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
                            No agents connected.<br />
                            Install and start the SeqNode Agent on your workstation, then switch to the{" "}
                            <button style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13 }}
                                onClick={() => setTab("install")}>Installation</button> tab.
                        </div>
                    ) : connectedAgents.map(ag => (
                        <div key={ag.agent_id} style={{
                            background: "var(--bg-tertiary)", borderRadius: 6, padding: "10px 14px",
                            marginBottom: 8, fontSize: 12,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{
                                    display: "inline-block", width: 9, height: 9, borderRadius: "50%",
                                    background: "var(--success, #22c55e)",
                                    boxShadow: "0 0 5px var(--success, #22c55e)",
                                }} />
                                <strong>{ag.info?.hostname || "Unknown Host"}</strong>
                                {ag.run_id && (
                                    <span style={{ marginLeft: 6, padding: "1px 7px", borderRadius: 10,
                                        background: "rgba(59,130,246,.15)", color: "var(--accent)", fontSize: 11 }}>
                                        running
                                    </span>
                                )}
                            </div>
                            <div style={{ color: "var(--text-secondary)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                                {ag.info?.os       && <span>OS: {ag.info.os}</span>}
                                {ag.info?.cpu_cores && <span>CPU: {ag.info.cpu_cores} cores ({ag.info.cpu_pct?.toFixed(0)}%)</span>}
                                {ag.info?.ram_avail_gb != null && <span>RAM avail: {ag.info.ram_avail_gb} GB</span>}
                                {ag.info?.disk_free_gb != null && <span>Disk free: {ag.info.disk_free_gb} GB</span>}
                                <span>Last seen: {ag.last_seen}s ago</span>
                                <span style={{ fontFamily: "monospace", fontSize: 10 }}>ID: {ag.agent_id.slice(0, 8)}…</span>
                            </div>
                        </div>
                    ))}
                </>
            )}

            {/* ── Installation tab ── */}
            {tab === "install" && (
                <>
                    {/* ─── Overview ─────────────────────────────────────────────────────── */}
                    <div className="settings-group-title" style={{ marginTop: 0 }}>Overview</div>
                    <div className="settings-desc" style={{ lineHeight: 1.8 }}>
                        The SeqNode Agent is a small daemon that runs on your local workstation or
                        lab server. It opens an <strong>outbound-only WebSocket tunnel</strong> to
                        SeqNode-OS — no inbound firewall rules or open ports are needed on your
                        machine. Your raw data (FASTQ, BAM, VCF, etc.) never leaves your environment.
                        <br /><br />
                        <strong>① </strong>Go to the <strong>Token</strong> tab above and generate
                        your Agent Token.<br />
                        <strong>② </strong>Choose <strong>Option A</strong> (Python script — requires
                        Python 3.10+) or <strong>Option B</strong> (standalone binary — no Python
                        needed).<br />
                        <strong>③ </strong>Follow the platform-specific steps below to install and
                        start the agent.<br />
                        <strong>④ </strong>Return to the <strong>Connected Agents</strong> tab to
                        confirm the connection appears.
                    </div>

                    {/* ─── Option A ─────────────────────────────────────────────────────── */}
                    <div className="settings-group-title" style={{ marginTop: 18 }}>
                        Option A — Python Script
                        <span style={{ ...st, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 8 }}>
                            Python 3.10+ required &nbsp;·&nbsp; Linux, macOS &amp; Windows
                        </span>
                    </div>
                    <div className="settings-desc" style={{ marginBottom: 10 }}>
                        Recommended if Python 3.10 or later is already installed on your machine.
                        Download the zip archive, install two lightweight pip dependencies, and
                        initialise the agent with a single command. No compilation required.
                    </div>

                    {/* Option A — downloads */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                        <a href="https://seqnode.onnetweb.com/downloads/agent/seqnode-agent-python.zip"
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "7px 16px",
                                background: "var(--accent)", borderRadius: 5,
                                color: "#fff", fontSize: 12, fontWeight: 600,
                                textDecoration: "none",
                            }}>
                            &#x2B07; seqnode-agent-python.zip
                        </a>
                        <a href="https://seqnode.onnetweb.com/downloads/agent/README.txt"
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "7px 14px",
                                background: "var(--bg-tertiary)", borderRadius: 5,
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)", fontSize: 12, fontWeight: 600,
                                textDecoration: "none",
                            }}>
                            &#x1F4C4; README.txt — Security bypass guide
                        </a>
                    </div>

                    {/* Option A — Linux / macOS */}
                    <div style={{ ...st, color: "var(--text-secondary)", marginBottom: 4 }}>
                        &#x1F427; Linux &nbsp;/&nbsp; &#x1F34E; macOS
                    </div>
                    <CodeBlock cmd={`# Step 1 — Extract the archive and enter the folder
unzip seqnode-agent-python.zip
cd seqnode-agent

# Step 2 — Install the two required dependencies (one-time only)
pip install websockets psutil`} onCopy={copyCmd} label="Steps 1 – 2 · Extract &amp; Install" />
                    <CodeBlock cmd={initCmdLinux} onCopy={copyCmd} label="Step 3 — Initialize (run once to save your configuration)" />
                    <CodeBlock cmd={`# Step 4 — Start the agent

# Foreground mode — shows live logs in the terminal
python agent.py start

# Background daemon — keeps running after you close the terminal (Linux / macOS)
python agent.py start --daemon

# Useful management commands
python agent.py status    # check if the agent is running
python agent.py stop      # graceful shutdown`} onCopy={copyCmd} label="Step 4 — Start" />

                    {/* Option A — Windows */}
                    <div style={{ ...st, color: "var(--text-secondary)", marginBottom: 4, marginTop: 14 }}>
                        &#x1FA9F; Windows (cmd.exe)
                    </div>
                    <CodeBlock cmd={`:: Step 1 — Extract the zip
::   Right-click seqnode-agent-python.zip > "Extract All"
::   Then open cmd.exe inside the extracted seqnode-agent folder

:: Step 2 — Install the two required dependencies (one-time only)
pip install websockets psutil`} onCopy={copyCmd} label="Steps 1 – 2 · Extract &amp; Install" />
                    <CodeBlock cmd={initCmdWindows} onCopy={copyCmd} label="Step 3 — Initialize (run once to save your configuration)" />
                    <CodeBlock cmd={`:: Step 4 — Start the agent

:: Foreground mode — shows live logs in the window
python agent.py start

:: Minimised background window
start /min python agent.py start

:: Auto-start at Windows login (Task Scheduler — run once)
schtasks /create /tn "SeqNodeAgent" /tr "python %CD%\\agent.py start" /sc onlogon /ru %USERNAME% /f`} onCopy={copyCmd} label="Step 4 — Start" />

                    {/* ─── Option B ─────────────────────────────────────────────────────── */}
                    <div className="settings-group-title" style={{ marginTop: 22 }}>
                        Option B — Standalone Executable
                        <span style={{ ...st, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 8 }}>
                            No Python needed &nbsp;·&nbsp; pre-built for all platforms
                        </span>
                    </div>
                    <div className="settings-desc" style={{ marginBottom: 10 }}>
                        Self-contained binaries bundled with their own Python runtime — no Python
                        installation or pip commands required. Download the binary for your platform,
                        grant execute permission if needed (Linux), and run. Available for Linux
                        (x86_64), macOS (Universal — Intel + Apple Silicon), and Windows.
                    </div>

                    {/* Option B — download buttons */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 10px" }}>
                        {[
                            { label: "🐧 Linux (x86_64)",                             file: "seqnode-agent-v1.0.0-linux-x86_64"  },
                            { label: "🍎 macOS — Universal (Intel + Apple Silicon)",   file: "seqnode-agent-v1.0.0-macOS.dmg"     },
                            { label: "🪟 Windows (.exe)",                              file: "seqnode-agent-v1.0.0-windows.exe"   },
                        ].map(p => (
                            <a key={p.file}
                                href={`https://seqnode.onnetweb.com/downloads/agent/${p.file}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{
                                    padding: "6px 14px", background: "var(--accent)",
                                    border: "1px solid var(--accent)", borderRadius: 5,
                                    color: "#fff", fontSize: 12, fontWeight: 600,
                                    textDecoration: "none", display: "inline-block",
                                }}>
                                &#x2B07; {p.label}
                            </a>
                        ))}
                    </div>
                    <div className="settings-desc" style={{ marginBottom: 12 }}>
                        Also available:{" "}
                        <a href="https://seqnode.onnetweb.com/downloads/agent/README.txt"
                            target="_blank" rel="noopener noreferrer"
                            style={{ color: "var(--accent)" }}>
                            README.txt
                        </a>{" "}
                        — full security bypass guide for macOS Gatekeeper and Windows SmartScreen.
                    </div>

                    {/* Option B — Linux */}
                    <div style={{ ...st, color: "var(--text-secondary)", marginBottom: 4 }}>
                        &#x1F427; Linux (x86_64)
                    </div>
                    <CodeBlock cmd={`# Step 1 — Grant execute permission (required on Linux)
chmod +x seqnode-agent-v1.0.0-linux-x86_64

# Step 2 — Initialize (run once to save your configuration)
#   Replace <YOUR-AGENT-TOKEN> with the token from the Token tab above
./seqnode-agent-v1.0.0-linux-x86_64 init \\
  --server wss://api.seqnode.onnetweb.com/ws/agent \\
  --token  <YOUR-AGENT-TOKEN> \\
  --workspace ~/seqnode-workspace \\
  --label  "My Workstation"

# Step 3 — Start the agent
./seqnode-agent-v1.0.0-linux-x86_64 start`} onCopy={copyCmd} label="Linux — after download" />

                    {/* Option B — macOS */}
                    <div style={{ ...st, color: "var(--text-secondary)", marginBottom: 4, marginTop: 14 }}>
                        &#x1F34E; macOS — Universal (Intel &amp; Apple Silicon)
                    </div>
                    <div className="settings-desc" style={{ marginBottom: 6 }}>
                        The <code style={{ fontSize: 11 }}>.dmg</code> is a single universal binary
                        compatible with both Intel and Apple Silicon (M1 / M2 / M3) Macs.{" "}
                        <strong>macOS Gatekeeper will block unsigned apps by default</strong> — always
                        use <strong>Right-Click → Open</strong> instead of double-clicking (one-time
                        bypass, described below).
                    </div>
                    <CodeBlock cmd={`# Step 1 — Open the disk image
#   Double-click seqnode-agent-v1.0.0-macOS.dmg to mount it in Finder

# Step 2 — Bypass macOS Gatekeeper (one-time only)
#   In Finder, Right-Click (or Control-Click) the SeqNodeAgent icon
#   Select "Open" from the context menu
#   Click "Open" again in the Gatekeeper confirmation dialog
#   The agent will launch and the bypass is remembered permanently

# Step 3 — Initialize from Terminal (run once to save your configuration)
#   Replace <YOUR-AGENT-TOKEN> with the token from the Token tab above
./SeqNodeAgent init \\
  --server wss://api.seqnode.onnetweb.com/ws/agent \\
  --token  <YOUR-AGENT-TOKEN> \\
  --workspace ~/seqnode-workspace \\
  --label  "My Workstation"

# Step 4 — Start the agent
./SeqNodeAgent start`} onCopy={copyCmd} label="macOS — after download" />

                    {/* Option B — Windows */}
                    <div style={{ ...st, color: "var(--text-secondary)", marginBottom: 4, marginTop: 14 }}>
                        &#x1FA9F; Windows
                    </div>
                    <div className="settings-desc" style={{ marginBottom: 6 }}>
                        <strong>Windows SmartScreen</strong> may display a warning for unsigned
                        executables. Click <strong>"More info"</strong> → <strong>"Run anyway"</strong>{" "}
                        to proceed. This is expected behaviour for specialised tools distributed
                        outside the Microsoft Store.
                    </div>
                    <CodeBlock cmd={`:: Step 1 — SmartScreen bypass (if a warning dialog appears)
::   A blue "Windows protected your PC" dialog may appear.
::   Click "More info" (small link below the warning text)
::   Then click "Run anyway" — the agent will start normally

:: Step 2 — Initialize (open cmd.exe and run once to save your configuration)
::   Replace <YOUR-AGENT-TOKEN> with the token from the Token tab above
seqnode-agent-v1.0.0-windows.exe init --server wss://api.seqnode.onnetweb.com/ws/agent --token <YOUR-AGENT-TOKEN> --workspace %USERPROFILE%\\seqnode-workspace --label "My Workstation"

:: Step 3 — Start the agent
seqnode-agent-v1.0.0-windows.exe start`} onCopy={copyCmd} label="Windows — after download" />

                    {/* ─── How It Works ─────────────────────────────────────────────────── */}
                    <div className="settings-group-title" style={{ marginTop: 20 }}>How It Works</div>
                    <div className="settings-desc" style={{ lineHeight: 1.8 }}>
                        <strong>1. Reverse connection:</strong> The agent connects <em>outbound</em> to{" "}
                        <code style={{ fontSize: 11 }}>wss://api.seqnode.onnetweb.com/ws/agent</code> —
                        no inbound firewall rules or open ports are needed on your machine.<br />
                        <strong>2. HMAC-SHA256 security:</strong> Every command sent by the server is
                        cryptographically signed. The agent refuses to execute any command that fails
                        signature verification — preventing replay attacks and man-in-the-middle
                        tampering.<br />
                        <strong>3. Workspace sandbox:</strong> The agent enforces a workspace path set
                        at initialisation time. Commands cannot read or write files outside your
                        configured directory.<br />
                        <strong>4. Real-time log streaming:</strong> stdout and stderr of every tool
                        are streamed line-by-line back to your SeqNode dashboard as they are
                        produced.<br />
                        <strong>5. Automatic reconnection:</strong> If the connection drops (network
                        blip, server restart), the agent reconnects automatically with exponential
                        back-off. Running local processes are not interrupted.
                    </div>
                </>
            )}

        </>
    );
}

/* ════════════════════════════════════════════════════════════
   Row helpers — React components
   ════════════════════════════════════════════════════════════ */

function _dirRows(dirs, updateSetting, api) {
    const entries = [
        ["Plugins Directory",    "dirs.plugins",    dirs.plugins],
        ["Workflows Directory",  "dirs.workflows",  dirs.workflows],
        ["References Directory", "dirs.references", dirs.references],
        ["Working Directory",    "dirs.working",    dirs.working],
        ["Output Directory",     "dirs.output",     dirs.output],
        ["Temp Directory",       "dirs.temp",       dirs.temp],
        ["Logs Directory",       "dirs.logs",       dirs.logs],
        ["State Directory",      "dirs.state",      dirs.state],
    ];
    return entries.map(([label, key, val]) => _dirRow(label, key, val, updateSetting, api));
}

function _dirRow(label, key, val, updateSetting, api) {
    const inputId = "si-" + key.replace(/\./g, "-");
    return (
        <div key={key} className="settings-row">
            <label>{label}</label>
            <input type="text" id={inputId} defaultValue={val || ""}
                onBlur={e => updateSetting(key, e.target.value)} />
            <button className="btn-small btn-browse" title="Browse"
                onClick={() => openFileBrowserOverlay(api, { mode: "dir", initialPath: val || "" },
                    (p) => { updateSetting(key, p); const el = document.getElementById(inputId); if (el) el.value = p; })}>
                &#x1F4C2;
            </button>
        </div>
    );
}

function _textRow(label, key, val, updateSetting) {
    return (
        <div key={key} className="settings-row">
            <label>{label}</label>
            <input type="text" defaultValue={val || ""} onBlur={e => updateSetting(key, e.target.value)} />
        </div>
    );
}

function _numRow(label, key, val, updateSetting) {
    return (
        <div key={key} className="settings-row">
            <label>{label}</label>
            <input type="number" defaultValue={val || 0} onBlur={e => updateSetting(key, Number(e.target.value))} />
        </div>
    );
}

function _boolRow(label, key, val, updateSetting) {
    return (
        <div key={key} className="settings-row settings-row-check">
            <label>{label}</label>
            <input type="checkbox" defaultChecked={!!val} onChange={e => updateSetting(key, e.target.checked)} />
        </div>
    );
}

function _selRow(label, key, val, updateSetting, options) {
    return (
        <div key={key} className="settings-row">
            <label>{label}</label>
            <select value={val} onChange={e => updateSetting(key, e.target.value)}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

