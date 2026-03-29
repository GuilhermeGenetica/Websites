/**
 * modules/offline.js — SeqNode-OS Offline / Desktop API Bridge
 *
 * Exports createOfflineApi(onLog) which returns an api object compatible
 * with modules/api.js — can be used as a drop-in replacement.
 *
 * Supports:
 *   a) Native bridge (window.__GF_BRIDGE__) — Electron, Qt WebEngine, Java WebView
 *   b) localStorage as fallback for settings and workflows
 *   c) Offline responses with notification via onLog for server-dependent features
 */

const STORAGE_PREFIX = "gf_offline_";

function _lsGet(key) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

function _lsSet(key, val) {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val)); } catch (_) {}
}

const _offlineDefaultSettings = {
    dirs: {
        plugins:    "plugins",
        workflows:  "workflows",
        references: "/data/references",
        working:    "/data/working",
        output:     "/data/output",
        temp:       "/tmp/seqnode",
        logs:       "logs",
    },
    execution: {
        max_threads:       8,
        max_memory_gb:     16,
        container_runtime: "none",
        shell:             "/bin/bash",
        timeout_minutes:   0,
        retry_failed:      false,
        retry_count:       1,
    },
    ui: {
        theme:              "dark",
        grid_size:          20,
        snap_to_grid:       false,
        auto_save:          true,
        auto_save_interval: 60,
        show_minimap:       true,
        log_max_lines:      2000,
    },
    plugin_defaults:  {},
    plugin_overrides: {},
    plugin_paths:     {},
};

const _offlineSnippets = {
    script:    '\n\ncommand:\n  template: |\n    #!/bin/bash\n    set -euo pipefail\n    echo "Running script"\n    {input_file} > {output_file}\n  shell: "/bin/bash"\n',
    conda:     '\nruntime:\n  type: "conda"\n  conda_env: "my_env"\n  conda_packages:\n    - "samtools=1.17"\n',
    container: '\nruntime:\n  type: "docker"\n  image: "biocontainers/samtools:v1.9-4-deb_cv1"\n',
    rscript:   '\ncommand:\n  template: |\n    Rscript --vanilla -e \'\n    library(ggplot2)\n    \'\n',
    python:    '\ncommand:\n  template: |\n    python3 -c "\n    import pandas as pd\n    "\n',
};

function _getOfflineWorkflows()      { return _lsGet("workflows") || {}; }
function _saveOfflineWorkflow(wf)    { const wfs = _getOfflineWorkflows(); wfs[wf.id] = wf; _lsSet("workflows", wfs); }
function _deleteOfflineWorkflow(id)  { const wfs = _getOfflineWorkflows(); delete wfs[id]; _lsSet("workflows", wfs); }

/**
 * Cria um objecto api offline.
 * @param {function} onLog  (nodeId, level, message) — opcional, para notificações
 */
export function createOfflineApi(onLog = () => {}) {
    const BRIDGE = (typeof window !== "undefined" && window.__GF_BRIDGE__) || null;

    function _notAvailable(method) {
        const msg = "Offline mode: '" + method + "' is not available without a native bridge.";
        console.warn("[GF-OFFLINE]", msg);
        return Promise.reject(new Error(msg));
    }

    function _notify(feature) {
        onLog("engine", "WARN", "Offline mode: " + feature + " requires a server or native bridge.");
        return Promise.resolve({ offline: true, message: "Feature requires server connection: " + feature });
    }

    function _bo(method, fallback) {
        if (BRIDGE && typeof BRIDGE[method] === "function") {
            return (...args) => Promise.resolve(BRIDGE[method](...args));
        }
        return fallback || (() => _notAvailable(method));
    }

    console.info("[GF-OFFLINE] Offline API bridge active. Native bridge:", BRIDGE ? "detected" : "absent (localStorage fallbacks)");

    return {
        getSystemInfo: _bo("getSystemInfo", () => Promise.resolve({
            seqnode_version: "0.3.0-offline",
            platform:        navigator.platform,
            python_version:  "N/A (offline mode)",
            cpu_count:       navigator.hardwareConcurrency || 1,
            memory_total_gb: 0, memory_available_gb: 0, disk_free_gb: 0,
            runtimes: { docker: false, singularity: false, podman: false },
        })),

        getSettings:         _bo("getSettings",         () => Promise.resolve(_lsGet("settings") || JSON.parse(JSON.stringify(_offlineDefaultSettings)))),
        saveSettings:        _bo("saveSettings",        (data) => { _lsSet("settings", data); return Promise.resolve({ status: "saved", settings: data }); }),
        getSettingsDefaults: _bo("getSettingsDefaults", () => Promise.resolve(JSON.parse(JSON.stringify(_offlineDefaultSettings)))),
        resetSettings:       _bo("resetSettings",       () => { const f = JSON.parse(JSON.stringify(_offlineDefaultSettings)); _lsSet("settings", f); return Promise.resolve({ status: "reset", settings: f }); }),
        createDirs:          _bo("createDirs",          () => _notify("Directory creation")),
        migrateState:        _bo("migrateState",        () => _notify("State migration")),
        validateDirs:        _bo("validateDirs",        () => _notify("Directory validation")),

        browseDir:           _bo("browseDir",           () => _notify("Server filesystem browser")),
        browseDirWithFiles:  _bo("browseDirWithFiles",  () => _notify("Server filesystem browser")),
        pathExists:          _bo("pathExists",          () => _notify("Server path check")),
        pathStat:            _bo("pathStat",            () => _notify("Server path stat")),
        mkdir:               _bo("mkdir",               () => _notify("Server directory creation")),
        mkdirBatch:          _bo("mkdirBatch",          () => _notify("Server directory batch creation")),
        listDirFiles:        _bo("listDirFiles",        () => _notify("Server directory listing")),

        getPlugins:              _bo("getPlugins",              () => Promise.resolve(_lsGet("plugins") || [])),
        getPlugin:               _bo("getPlugin",               (id) => { const p = (_lsGet("plugins") || []).find(x => x.id === id); return p ? Promise.resolve(p) : Promise.reject(new Error("Plugin not found: " + id)); }),
        getPluginCategories:     _bo("getPluginCategories",     () => { const cats = {}; (_lsGet("plugins") || []).forEach(p => { if (p.category) cats[p.category] = true; }); return Promise.resolve(Object.keys(cats).sort()); }),
        getPluginTemplate:       _bo("getPluginTemplate",       () => Promise.resolve({ template: "name: My Tool\nid: my_tool\nversion: 1.0.0\ncategory: Processing\n" })),
        getPluginSnippets:       _bo("getPluginSnippets",       () => Promise.resolve(JSON.parse(JSON.stringify(_offlineSnippets)))),
        getPluginSnippetTypes:   _bo("getPluginSnippetTypes",   () => Promise.resolve({ types: Object.keys(_offlineSnippets) })),
        reloadPlugins:           _bo("reloadPlugins",           () => _notify("Plugin reload (requires server)")),
        getPluginRaw:            _bo("getPluginRaw",            () => _notify("Raw YAML read")),
        savePluginRaw:           _bo("savePluginRaw",           () => _notify("Plugin YAML save (requires server)")),
        deletePlugin:            _bo("deletePlugin",            () => _notify("Plugin delete (requires server)")),
        getPluginInstallStatus:  _bo("getPluginInstallStatus",  () => _notify("Plugin install status (requires server)")),
        installPlugin:           _bo("installPlugin",           () => _notify("Plugin installation (requires server)")),
        getPluginInstallLogs:    _bo("getPluginInstallLogs",    () => _notify("Plugin install logs (requires server)")),
        cancelPluginInstall:     _bo("cancelPluginInstall",     () => _notify("Plugin install cancel (requires server)")),
        verifyPlugin:            _bo("verifyPlugin",            () => _notify("Plugin verification (requires server)")),
        verifyAllPlugins:        _bo("verifyAllPlugins",        () => _notify("Plugin verification (requires server)")),

        getWorkflowList: _bo("getWorkflowList", () => Promise.resolve(
            Object.values(_getOfflineWorkflows()).map(w => ({ id: w.id, name: w.name, description: w.description || "", nodes_count: (w.nodes || []).length }))
        )),
        saveWorkflow:          _bo("saveWorkflow",          (wf)  => { _saveOfflineWorkflow(wf); return Promise.resolve({ status: "saved", workflow_id: wf.id }); }),
        loadWorkflow:          _bo("loadWorkflow",          (id)  => { const wf = _getOfflineWorkflows()[id]; return wf ? Promise.resolve(wf) : Promise.reject(new Error("Workflow not found: " + id)); }),
        deleteWorkflow:        _bo("deleteWorkflow",        (id)  => { _deleteOfflineWorkflow(id); return Promise.resolve({ status: "deleted" }); }),
        validateWorkflow:      _bo("validateWorkflow",      ()    => _notify("Full server-side validation")),
        validateWorkflowBasic: _bo("validateWorkflowBasic", (wf) => {
            const errors = [];
            if (!wf.id)   errors.push("Workflow 'id' is required.");
            if (!wf.name) errors.push("Workflow 'name' is required.");
            const nodeIds = new Set((wf.nodes || []).map(n => n.id));
            const seen    = new Set();
            (wf.nodes || []).forEach(node => {
                if (!node.id)      errors.push("Node missing 'id'.");
                if (!node.tool_id) errors.push("Node '" + (node.id || "?") + "': 'tool_id' required.");
                if (node.id && seen.has(node.id)) errors.push("Duplicate node id: " + node.id);
                if (node.id) seen.add(node.id);
                (node.edges || []).forEach(e => { if (!nodeIds.has(e)) errors.push("Node '" + node.id + "': edge '" + e + "' missing."); });
            });
            return Promise.resolve({ valid: errors.length === 0, errors });
        }),
        getWorkflowSchema:  _bo("getWorkflowSchema",  () => Promise.resolve({ title: "SeqNode Workflow", type: "object", required: ["id", "name", "nodes"] })),
        preflightWorkflow:  _bo("preflightWorkflow",  () => _notify("Preflight check (requires server)")),
        buildCommandPreview:_bo("buildCommandPreview",() => _notify("Command preview (requires server)")),

        executeWorkflow:    _bo("executeWorkflow",    () => _notify("Workflow execution (requires engine)")),
        getExecutionStatus: _bo("getExecutionStatus", () => Promise.resolve({ status: "idle" })),
        cancelExecution:    _bo("cancelExecution",    () => _notify("Execution cancel (requires engine)")),

        listRuns:   _bo("listRuns",   () => Promise.resolve([])),
        getRun:     _bo("getRun",     () => _notify("Run details (requires server)")),
        getRunLogs: _bo("getRunLogs", () => _notify("Run logs (requires server)")),
        deleteRun:  _bo("deleteRun",  () => _notify("Run delete (requires server)")),

        getPendingPauses: _bo("getPendingPauses", () => Promise.resolve([])),
        approvePause:     _bo("approvePause",     () => _notify("Pause approval (requires server)")),

        getCacheStats:   _bo("getCacheStats",   () => Promise.resolve({ entries: 0, size_mb: 0 })),
        invalidateCache: _bo("invalidateCache", () => _notify("Cache invalidation (requires server)")),
        clearCache:      _bo("clearCache",      () => _notify("Cache clear (requires server)")),

        getRunnerConfig: _bo("getRunnerConfig", () => Promise.resolve({ runner_type: "local" })),
        setRunnerConfig: _bo("setRunnerConfig", () => _notify("Runner config (requires server)")),

        getReferences:             _bo("getReferences",             () => Promise.resolve({})),
        addCustomReference:        _bo("addCustomReference",        () => _notify("Reference catalog write (requires server)")),
        removeCustomReference:     _bo("removeCustomReference",     () => _notify("Reference catalog write (requires server)")),
        configureReference:        _bo("configureReference",        () => _notify("Reference configuration (requires server)")),
        startDownload:             _bo("startDownload",             () => _notify("Reference download (requires server)")),
        cancelDownload:            _bo("cancelDownload",            () => _notify("Download cancel (requires server)")),
        getDownloadProgress:       _bo("getDownloadProgress",       () => Promise.resolve({})),
        getSingleDownloadProgress: _bo("getSingleDownloadProgress", () => Promise.resolve({ status: "idle", progress: 0, message: "" })),
        verifyReferenceIndexFiles: _bo("verifyReferenceIndexFiles", () => _notify("Reference index verification (requires server)")),

        getLLMModels: _bo("getLLMModels", () => _notify("LLM model list (requires server)")),
        getCondaEnvs: _bo("getCondaEnvs", () => _notify("Conda envs (requires server)")),
    };
}

export default createOfflineApi;
