/**
 * modules/api.js — SeqNode-OS API Abstraction Layer
 *
 * Only change from original: var BASE = "" → imports API_URL from config.js.
 * No other module calls fetch() directly.
 */

import { API_URL, AUTH_URL } from "../config.js";
import { MASKED_SENTINEL } from "../store/index.js";
import { getToken, getUserId } from "../utils/auth.js";

function _authHeaders(extra = {}) {
    const token = getToken();
    const h = { "Content-Type": "application/json", ...extra };
    if (token) h["Authorization"] = "Bearer " + token;
    return h;
}

// ── Fase 5 — Engine JWT auth header ──────────────────────────────────────
// Returns the engine token (Python backend JWT) if stored, to send alongside PHP token.
function _getEngineAuthHeaders(extra = {}) {
    // Lazy import to avoid circular deps — useStore is a module-level singleton
    let engineToken = null;
    try {
        engineToken = localStorage.getItem("seqnode_engine_token");
    } catch (_) { /* ignore */ }
    const h = { "Content-Type": "application/json", ...extra };
    // Prefer engine token if present (Python JWT), otherwise fall back to PHP token
    if (engineToken) {
        h["Authorization"] = "Bearer " + engineToken;
    } else {
        const phpToken = getToken();
        if (phpToken) h["Authorization"] = "Bearer " + phpToken;
    }
    return h;
}

// Intercepts 401 from engine API and triggers engine logout
function _handleEngineUnauthorized() {
    localStorage.removeItem("seqnode_engine_token");
    localStorage.removeItem("seqnode_engine_user");
    // Re-check auth state — the App.jsx engine auth effect will pick this up
    window.dispatchEvent(new CustomEvent("seqnode:engine-unauthorized"));
}

async function _getEngine(url) {
    const res = await fetch(API_URL + url, { headers: _getEngineAuthHeaders() });
    if (res.status === 401) { _handleEngineUnauthorized(); return null; }
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

async function _postEngine(url, body) {
    const res = await fetch(API_URL + url, {
        method: "POST",
        headers: _getEngineAuthHeaders(),
        body:    JSON.stringify(body),
    });
    if (res.status === 401) { _handleEngineUnauthorized(); return null; }
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}
// ── FIM Engine JWT ────────────────────────────────────────────────────────

// Headers that include user identity so the VPS can route to the right agent
function _authHeadersWithUser(extra = {}) {
    const h = _authHeaders(extra);
    const uid = getUserId();
    if (uid != null) h["X-Seqnode-User-Id"] = String(uid);
    return h;
}

async function _getAsUser(url) {
    const res = await fetch(API_URL + url, { headers: _authHeadersWithUser() });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

async function _postAsUser(url, body) {
    const res = await fetch(API_URL + url, {
        method:  "POST",
        headers: _authHeadersWithUser(),
        body:    JSON.stringify(body),
    });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

async function _get(url) {
    const res = await fetch(API_URL + url, { headers: _authHeaders() });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

async function _post(url, body) {
    const res = await fetch(API_URL + url, {
        method:  "POST",
        headers: _authHeaders(),
        body:    JSON.stringify(body),
    });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

async function _delete(url) {
    const res = await fetch(API_URL + url, { method: "DELETE", headers: _authHeaders() });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

// ── PHP/MySQL helpers (Hostinger — AUTH_URL) ─────────────────────────────────
// User preferences, agent token and auth routes live on the PHP backend,
// not on the Python VPS. These helpers use AUTH_URL as the base.
async function _phpGet(path) {
    const res = await fetch(AUTH_URL + path, { headers: _authHeaders() });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

async function _phpPost(path, body) {
    const res = await fetch(AUTH_URL + path, {
        method:  "POST",
        headers: _authHeaders(),
        body:    JSON.stringify(body),
    });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

async function _phpDelete(path) {
    const res = await fetch(AUTH_URL + path, { method: "DELETE", headers: _authHeaders() });
    if (!res.ok) {
        let detail = "";
        try { const d = await res.json(); detail = d.detail || d.message || JSON.stringify(d); } catch (_) {}
        throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
    }
    return res.json();
}

const api = {

    /* ── User Preferences (PHP/MySQL — Hostinger) ── */
    getUserPreferences:         ()       => _phpGet("/user/preferences"),
    saveUserPreferences:        (data)   => _phpPost("/user/preferences", data),

    /* ── Agent Token (PHP/MySQL — Hostinger) ── */
    getAgentToken:              ()       => _phpGet("/user/agent-token"),
    regenerateAgentToken:       (label)  => _phpPost("/user/agent-token/regenerate", { label }),
    revokeAgentToken:           ()       => _phpDelete("/user/agent-token"),

    /* ── Auth (PHP/MySQL — Hostinger) ── */
    login:          (data) => _phpPost("/auth/login", data),
    register:       (data) => _phpPost("/auth/register", data),
    logout:         (data) => _phpPost("/auth/logout", data),
    refresh:        (data) => _phpPost("/auth/refresh", data),

    /* ── System ── */
    getSystemInfo:       () => _get("/api/system/info"),

    /* ── Settings ── */
    getSettings:         () => _get("/api/settings"),
    saveSettings:        (data) => _post("/api/settings", data),
    getSettingsDefaults: () => _get("/api/settings/defaults"),
    resetSettings:       () => _post("/api/settings/reset", {}),
    createDirs:          () => _post("/api/settings/create-dirs", {}),
    migrateState:        (direction) => _post("/api/settings/migrate-state", { direction }),
    initSqlite:          ()          => _post("/api/settings/init-sqlite", {}),
    validateDirs:        (data) => _post("/api/settings/validate-dirs", data),

    /* ── Filesystem ── */
    browseDir: (path) =>
        _get("/api/fs/browse?path=" + encodeURIComponent(path)),

    browseDirWithFiles: (path, extensions) => {
        let url = "/api/fs/browse-files?path=" + encodeURIComponent(path);
        if (extensions) url += "&extensions=" + encodeURIComponent(extensions);
        return _get(url);
    },

    pathExists:  (path) => _get("/api/fs/exists?path=" + encodeURIComponent(path)),
    pathStat:    (path) => _get("/api/fs/stat?path="   + encodeURIComponent(path)),
    mkdir:       (path) => _post("/api/fs/mkdir",       { path }),
    mkdirBatch:  (paths) => _post("/api/fs/mkdir-batch", { paths }),

    listDirFiles: (dirPath, extensions) => {
        let url = "/api/fs/list-dir?path=" + encodeURIComponent(dirPath || "");
        if (extensions) url += "&extensions=" + encodeURIComponent(extensions);
        return _get(url);
    },

    /* ── Plugins ── */
    getPlugins: (category, search) => {
        let url = "/api/plugins";
        const params = [];
        if (category) params.push("category=" + encodeURIComponent(category));
        if (search)   params.push("search="   + encodeURIComponent(search));
        if (params.length) url += "?" + params.join("&");
        // Forward user identity so server can merge user plugins
        return _getAsUser(url);
    },

    getPlugin:              (toolId) => _get("/api/plugins/" + encodeURIComponent(toolId)),
    getPluginCategories:    () => _get("/api/plugins/categories"),
    getPluginTemplate:      () => _get("/api/plugins/template/yaml"),
    getPluginSnippets:      () => _get("/api/plugins/snippets"),
    getPluginSnippetTypes:  () => _get("/api/plugins/snippets/types"),
    reloadPlugins:          () => _post("/api/plugins/reload", {}),
    getPluginRaw:           (toolId) => _get("/api/plugins/raw/" + encodeURIComponent(toolId)),
    savePluginRaw:          (toolId, filename, content) =>
        _post("/api/plugins/raw", { tool_id: toolId, filename, content }),
    deletePlugin:           (toolId) => _delete("/api/plugins/" + encodeURIComponent(toolId)),
    getPluginInstallStatus: (toolId) =>
        _get("/api/plugins/" + encodeURIComponent(toolId) + "/install-status"),
    installPlugin: (toolId, condaEnv, extraArgs) =>
        _post("/api/plugins/" + encodeURIComponent(toolId) + "/install", {
            tool_id:    toolId,
            conda_env:  condaEnv  || null,
            extra_args: extraArgs || null,
        }),
    getPluginInstallLogs: (toolId, offset) =>
        _get("/api/plugins/" + encodeURIComponent(toolId) + "/install-logs?offset=" + (offset || 0)),
    cancelPluginInstall: (toolId) =>
        _delete("/api/plugins/" + encodeURIComponent(toolId) + "/install"),
    verifyPlugin: (pluginId, path) => {
        const body = { plugin_id: pluginId };
        if (path) body.path = path;
        return _post("/api/settings/plugins/verify", body);
    },
    verifyAllPlugins: () => _post("/api/settings/plugins/verify", {}),

    /* ── Workflow ── */
    getWorkflowList:      () => _get("/api/workflow/list"),
    saveWorkflow:         (workflow) => _post("/api/workflow/save", { workflow }),
    loadWorkflow:         (wfId) => _get("/api/workflow/load/" + encodeURIComponent(wfId)),
    deleteWorkflow:       (wfId) => _delete("/api/workflow/" + encodeURIComponent(wfId)),
    validateWorkflow:     (workflow) => _post("/api/workflow/validate",       { workflow }),
    validateWorkflowBasic:(workflow) => _post("/api/workflow/validate/basic", { workflow }),
    getWorkflowSchema:    () => _get("/api/workflow/schema"),
    preflightWorkflow:    (workflow) => _post("/api/workflow/preflight", { workflow }),

    buildCommandPreview: (toolId, params, inputsMap, outputsMap, customCommand) =>
        _post("/api/build-command", {
            tool_id:        toolId,
            params:         params        || {},
            inputs_map:     inputsMap     || {},
            outputs_map:    outputsMap    || {},
            custom_command: customCommand || null,
        }),

    /* ── User Plugins (agent-side storage) ── */
    userPluginScan:  (pluginsDir) => _postAsUser("/api/plugins/user/scan",  { plugins_dir: pluginsDir }),
    userPluginWrite: (pluginsDir, filename, content) =>
        _postAsUser("/api/plugins/user/write", { plugins_dir: pluginsDir, filename, content }),

    /* ── Execution ── */
    executeWorkflow:    (workflow) => _postAsUser("/api/execute", { workflow }),
    getExecutionStatus: () => _get("/api/execute/status"),
    cancelExecution:    () => _post("/api/execute/cancel", {}),

    /* ── Runs ── */
    listRuns:   () => _get("/api/runs"),
    getRun:     (runId) => _get("/api/runs/" + encodeURIComponent(runId)),
    getRunLogs: (runId, nodeId, level) => {
        let url = "/api/runs/" + encodeURIComponent(runId) + "/logs";
        const params = [];
        if (nodeId) params.push("node_id=" + encodeURIComponent(nodeId));
        if (level)  params.push("level="   + encodeURIComponent(level));
        if (params.length) url += "?" + params.join("&");
        return _get(url);
    },
    deleteRun: (runId) => _delete("/api/runs/" + encodeURIComponent(runId)),

    /* ── Pause / Approval ── */
    getPendingPauses: () => _get("/api/execute/pause/pending"),
    approvePause: (runId, nodeId, approved) =>
        _post("/api/execute/pause/approve", { run_id: runId, node_id: nodeId, approved }),

    /* ── Cache ── */
    getCacheStats:    () => _get("/api/cache/stats"),
    invalidateCache:  (cacheKey) => _delete("/api/cache/" + encodeURIComponent(cacheKey)),
    clearCache:       () => _delete("/api/cache"),

    /* ── Runner ── */
    getRunnerConfig: () => _get("/api/settings/runner"),
    setRunnerConfig: (data) => _post("/api/settings/runner", data),

    /* ── References ── */
    getReferences:           () => _get("/api/references/catalog"),
    addCustomReference:      (data) => _post("/api/references/custom", data),
    removeCustomReference:   (refId) => _delete("/api/references/custom/" + encodeURIComponent(refId)),
    configureReference:      (refId, category, data) =>
        _post("/api/references/configure", Object.assign({ ref_id: refId, category }, data)),
    startDownload: (refId, targetBase) => {
        const body = { ref_id: refId };
        if (targetBase) body.target_base = targetBase;
        return _post("/api/references/download", body);
    },
    cancelDownload:              (refId) => _delete("/api/references/download/" + encodeURIComponent(refId)),
    getDownloadProgress:         () => _get("/api/references/download/progress"),
    getSingleDownloadProgress:   (refId) => _get("/api/references/download/progress/" + encodeURIComponent(refId)),
    verifyReferenceIndexFiles:   (refId) => _get("/api/references/verify/" + encodeURIComponent(refId)),

    /* ── LLM Models ── */
    getLLMModels: (provider, apiKey, apiBase) => {
        const body = { provider: provider || "" };
        if (apiKey && apiKey !== MASKED_SENTINEL) body.api_key = apiKey;
        if (apiBase) body.api_base = apiBase;
        return _post("/api/llm/models", body);
    },

    /* ── Conda ── */
    getCondaEnvs: () => _get("/api/conda/envs"),

    /* ── Agent ── */
    getConnectedAgents:   ()       => _get("/api/agent/status"),
    getAgentForUser:      (userId) => _get("/api/agent/user/" + encodeURIComponent(userId)),

    /* ── Agent-aware filesystem (routes through agent if connected, else VPS) ── */
    agentBrowseDir: (path) =>
        _get("/api/agent/browse?path=" + encodeURIComponent(path || "")),

    agentBrowseDirWithFiles: (path, extensions) => {
        let url = "/api/agent/browse-files?path=" + encodeURIComponent(path || "");
        if (extensions) url += "&extensions=" + encodeURIComponent(extensions);
        return _get(url);
    },

    /* Read a single file via the connected agent */
    agentReadFile: (path) =>
        _getAsUser("/api/agent/read-file?path=" + encodeURIComponent(path)),

    /* Create directory via agent (falls back to VPS if no agent) */
    agentMkdir: (path) =>
        _postAsUser("/api/agent/mkdir", { path }),

    /* Rename/move a file or directory via the connected agent */
    agentRenameFile: (oldPath, newPath) =>
        _postAsUser("/api/agent/rename-file", { old_path: oldPath, new_path: newPath }),

    /* Delete a file or directory via the connected agent */
    agentDeleteFile: (path, recursive = false) =>
        _postAsUser("/api/agent/delete-file", { path, recursive }),

    /* ── Fase 2 — AI Workflow Builder ── */
    aiBuildWorkflow: (prompt, contextFiles) =>
        _post("/api/ai/build-workflow", { prompt, context_files: contextFiles || [] }),
    aiRefineWorkflow: (workflow, feedback) =>
        _post("/api/ai/refine-workflow", { workflow, feedback }),
    aiTestConnection: (provider, apiKey, apiBase) => {
        const body = { provider: provider || "" };
        if (apiKey && apiKey !== MASKED_SENTINEL) body.api_key = apiKey;
        if (apiBase) body.api_base = apiBase;
        return _post("/api/ai/test-connection", body);
    },
    aiGeneratePluginYaml: (toolName, toolId, description, category) =>
        _post("/api/ai/generate-plugin-yaml", {
            tool_name: toolName,
            tool_id: toolId,
            description: description || "",
            category: category || "Bioinformatics",
        }),

    /* ── Fase 3 — Audit ── */
    getRunAuditUrl: (runId, format) =>
        `${API_URL}/api/runs/${encodeURIComponent(runId)}/audit?format=${format || "json"}`,
    verifyRunAudit: (runId) =>
        _get("/api/runs/" + encodeURIComponent(runId) + "/audit/verify"),

    /* ── Fase 4 — Plugin Hub ── */
    getHubPlugins:     (search, tag)  => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (tag)    params.set("tag", tag);
        const qs = params.toString();
        return _get("/api/plugins/hub" + (qs ? "?" + qs : ""));
    },
    getHubTags:        ()             => _get("/api/plugins/hub/tags"),
    installHubPlugin:  (yamlUrl)      => _post("/api/plugins/hub/install", { yaml_url: yamlUrl }),
    refreshHubCache:   ()             => _post("/api/plugins/hub/refresh", {}),

    /* ── Fase 5 — Engine Auth ── */
    engineLogin:      (username, password) => _post("/api/auth/login", { username, password }),
    engineSetup:      (username, password) => _post("/api/auth/setup", { username, password }),
    engineMe:         ()                   => _getEngine("/api/auth/me"),
    engineListUsers:  ()                   => _getEngine("/api/auth/users"),
    engineCreateUser: (username, password, role) =>
        _postEngine("/api/auth/users", { username, password, role }),
    engineDeleteUser: (username) =>
        fetch(API_URL + "/api/auth/users/" + encodeURIComponent(username), {
            method: "DELETE",
            headers: _getEngineAuthHeaders(),
        }).then(r => r.json()),
};

export default api;