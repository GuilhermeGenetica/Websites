/**
 * store/index.js — SeqNode-OS Global State (Zustand)
 *
 * Substitui GF_STATE de gf-core.js.
 * Todos os campos são mapeados 1:1 do GF_STATE original.
 * Campos internos ao canvas (draggingNode, tempEdgeLine, svgOffset, svgScale)
 * são geridos internamente pelo módulo canvas/ com React Flow e não vivem aqui.
 */

import { create } from "zustand";

const DEFAULT_SETTINGS = {
    dirs: {
        plugins:    "plugins",
        workflows:  "workflows",
        references: "/data/references",
        working:    "/data/working",
        output:     "/data/output",
        temp:       "/tmp/seqnode",
        logs:       "logs",
        state:      ".seqnode_state",
    },
    execution: {
        max_threads:       8,
        max_memory_gb:     16,
        container_runtime: "auto",
        shell:             "/bin/bash",
        timeout_minutes:   0,
        retry_failed:      false,
        retry_count:       1,
        run_mode:          "system",
        conda_env:         "",
        conda_path:        "",
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
    state_backend: "json",
    runner_type:   "local",
    slurm_config: {
        partition:     "batch",
        time_limit:    "24:00:00",
        cpus_per_task: 1,
        mem_gb:        4,
        extra_headers: [],
    },
    auth: {
        enabled:     false,
        mode:        "api_key",
        jwt_secret:  "",
        token_ttl_h: 24,
    },
    llm_config: {
        provider:    "openai",
        model:       "",
        api_key:     "",
        api_base:    "",
        oauth_token: "",
    },
    plugin_defaults: {},
    plugin_paths:    {},
};

// Sentinel para campos sensíveis mascarados pelo servidor
export const MASKED_SENTINEL = "__MASKED__";
const SENSITIVE_FIELDS = ["api_key", "jwt_secret", "oauth_token"];

/**
 * Prepara as settings para envio ao servidor.
 * Campos sensíveis com sentinel são preservados tal como estão —
 * o backend interpreta-os como "não alterado".
 */
export function prepareSettingsForSave(settings) {
    return JSON.parse(JSON.stringify(settings));
}

/**
 * Aplica dados de settings recebidos do servidor ao objecto de settings actual.
 * Faz merge superficial por secção, igual ao applySettings() do gf-core.js.
 */
export function mergeSettings(current, data) {
    const s = JSON.parse(JSON.stringify(current));
    if (data.dirs)            Object.assign(s.dirs,         data.dirs);
    if (data.execution)       Object.assign(s.execution,    data.execution);
    if (data.ui)              Object.assign(s.ui,           data.ui);
    if (data.plugin_defaults !== undefined) s.plugin_defaults = data.plugin_defaults || {};
    if (data.plugin_paths    !== undefined) s.plugin_paths    = data.plugin_paths    || {};
    if (data.state_backend   !== undefined) s.state_backend   = data.state_backend;
    if (data.runner_type     !== undefined) s.runner_type     = data.runner_type;
    if (data.slurm_config)    Object.assign(s.slurm_config, data.slurm_config);
    if (data.auth)            Object.assign(s.auth,         data.auth);
    if (data.llm_config) {
        if (!s.llm_config) s.llm_config = {};
        Object.assign(s.llm_config, data.llm_config);
    }
    return s;
}

const useStore = create((set, get) => ({
    // ── Workflow actual ──────────────────────────────────────────────────────
    workflow: {
        id: "wf_" + Math.random().toString(36).substr(2, 8),
        name: "Untitled Workflow",
        description: "",
        version: "1.0.0",
        nodes: [],
        global_params: {},
        tags: [],
    },

    // ── Plugins e categorias carregados do servidor ──────────────────────────
    plugins:    [],
    categories: [],

    // ── Selecção no canvas ───────────────────────────────────────────────────
    selectedNode: null,
    selectedEdge: null,

    // ── WebSocket ────────────────────────────────────────────────────────────
    ws:               null,
    wsReconnectTimer: null,

    // ── Log panel ────────────────────────────────────────────────────────────
    logExpanded:     true,
    logExpandedFull: false,
    logs:            [],

    // ── Execução ─────────────────────────────────────────────────────────────
    executing:    false,
    currentRunId: null,
    nodeStatuses: {},   // { [nodeId]: "PENDING"|"RUNNING"|"COMPLETED"|"FAILED"|... }

    // ── Autenticação (PHP API) ────────────────────────────────────────────────
    authUser:  JSON.parse(localStorage.getItem("seqnode_user") || "null"),
    authToken: localStorage.getItem("seqnode_access_token") || null,

    // ── Autenticação Engine (Python JWT — Fase 5) ─────────────────────────
    engineToken: localStorage.getItem("seqnode_engine_token") || null,
    engineUser:  JSON.parse(localStorage.getItem("seqnode_engine_user") || "null"),

    // ── AI Builder state (Fase 2) ─────────────────────────────────────────
    aiBuilderOpen:    false,
    aiBuilderLoading: false,
    aiBuilderResult:  null,   // BuildWorkflowResponse | null
    aiBuilderError:   null,   // string | null

    // ── User plugin settings ─────────────────────────────────────────────────
    // Directory on the user's LOCAL machine where personal plugin YAMLs live
    localPluginsDir: localStorage.getItem("seqnode_local_plugins_dir") || "",

    // ── Dados auxiliares ─────────────────────────────────────────────────────
    workflowSchema: null,
    yamlSnippets:   {},

    // ── Settings ─────────────────────────────────────────────────────────────
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),

    // ════════════════════════════════════════════════════════════════════════
    // Actions
    // ════════════════════════════════════════════════════════════════════════

    setLocalPluginsDir: (dir) => {
        if (dir) localStorage.setItem("seqnode_local_plugins_dir", dir);
        else     localStorage.removeItem("seqnode_local_plugins_dir");
        set({ localPluginsDir: dir });
    },

    setAuthUser: (user) => {
        if (user) localStorage.setItem("seqnode_user", JSON.stringify(user));
        else      localStorage.removeItem("seqnode_user");
        set({ authUser: user });
    },
    setAuthToken: (token) => {
        if (token) localStorage.setItem("seqnode_access_token", token);
        else       localStorage.removeItem("seqnode_access_token");
        set({ authToken: token });
    },
    clearAuth: () => {
        localStorage.removeItem("seqnode_user");
        localStorage.removeItem("seqnode_access_token");
        localStorage.removeItem("seqnode_refresh_token");
        set({ authUser: null, authToken: null });
    },

    // ── Engine auth actions (Fase 5) ──────────────────────────────────────
    setEngineToken: (token) => {
        if (token) localStorage.setItem("seqnode_engine_token", token);
        else       localStorage.removeItem("seqnode_engine_token");
        set({ engineToken: token });
    },
    setEngineUser: (user) => {
        if (user) localStorage.setItem("seqnode_engine_user", JSON.stringify(user));
        else      localStorage.removeItem("seqnode_engine_user");
        set({ engineUser: user });
    },
    engineLogout: () => {
        localStorage.removeItem("seqnode_engine_token");
        localStorage.removeItem("seqnode_engine_user");
        set({ engineToken: null, engineUser: null });
    },

    // ── AI Builder actions (Fase 2) ───────────────────────────────────────
    setAiBuilderOpen:    (open)    => set({ aiBuilderOpen: open }),
    setAiBuilderLoading: (loading) => set({ aiBuilderLoading: loading }),
    setAiBuilderResult:  (result)  => set({ aiBuilderResult: result, aiBuilderError: null }),
    setAiBuilderError:   (error)   => set({ aiBuilderError: error, aiBuilderLoading: false }),
    clearAiBuilder:      ()        => set({ aiBuilderResult: null, aiBuilderError: null, aiBuilderLoading: false }),

    setWorkflow: (workflow) => set({ workflow }),

    updateWorkflowField: (field, value) =>
        set((s) => ({ workflow: { ...s.workflow, [field]: value } })),

    setPlugins: (plugins) => {
        const categories = [...new Set(plugins.map((p) => p.category || "General"))].sort();
        set({ plugins, categories });
    },

    setSelectedNode: (node) => set({ selectedNode: node, selectedEdge: null }),
    setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedNode: null }),
    clearSelection:  ()     => set({ selectedNode: null, selectedEdge: null }),

    setWs:               (ws)    => set({ ws }),
    setWsReconnectTimer: (timer) => set({ wsReconnectTimer: timer }),

    setLogExpanded:     (v) => set({ logExpanded: v }),
    setLogExpandedFull: (v) => set({ logExpandedFull: v }),

    addLog: (entry) =>
        set((s) => {
            const maxLines = s.settings.ui.log_max_lines || 2000;
            const logs = [...s.logs, entry];
            return { logs: logs.length > maxLines ? logs.slice(-maxLines) : logs };
        }),
    clearLogs: () => set({ logs: [] }),

    setExecuting:    (v)  => set({ executing: v }),
    setCurrentRunId: (id) => set({ currentRunId: id }),

    updateNodeStatus: (nodeId, status) =>
        set((s) => ({ nodeStatuses: { ...s.nodeStatuses, [nodeId]: status } })),

    clearNodeStatuses: () => set({ nodeStatuses: {}, currentRunId: null }),

    setWorkflowSchema: (schema)   => set({ workflowSchema: schema }),
    setYamlSnippets:   (snippets) => set({ yamlSnippets: snippets }),

    // ── Settings actions ─────────────────────────────────────────────────────
    applySettings: (data) =>
        set((s) => ({ settings: mergeSettings(s.settings, data) })),

    updateSetting: (dotPath, value) =>
        set((s) => {
            const settings = JSON.parse(JSON.stringify(s.settings));
            const parts = dotPath.split(".");
            let obj = settings;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!obj[parts[i]]) obj[parts[i]] = {};
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
            return { settings };
        }),

    updatePluginDefault: (pluginId, paramKey, value) =>
        set((s) => {
            const settings = JSON.parse(JSON.stringify(s.settings));
            if (!settings.plugin_defaults)            settings.plugin_defaults = {};
            if (!settings.plugin_defaults[pluginId])  settings.plugin_defaults[pluginId] = {};
            settings.plugin_defaults[pluginId][paramKey] = value;
            return { settings };
        }),

    updatePluginPathSetting: (pluginId, field, value) =>
        set((s) => {
            const settings = JSON.parse(JSON.stringify(s.settings));
            if (!settings.plugin_paths)           settings.plugin_paths = {};
            if (!settings.plugin_paths[pluginId]) settings.plugin_paths[pluginId] = {};
            settings.plugin_paths[pluginId][field] = value;
            return { settings };
        }),
}));

export default useStore;
