/**
 * modules/settings-plugins.js — SeqNode-OS Settings Plugin Management
 *
 * Exports createSettingsPluginsModule(api, store) — factory with:
 *   syncAllPluginPaths()
 *   syncAllPluginDefaults()
 *   verifySinglePlugin(pluginId, statusElId)
 *   verifyAllPlugins()
 */

export function createSettingsPluginsModule(api, store) {

    /* ── Plugin path sync ── */
    function syncAllPluginPaths() {
        store.getState().updateSetting("plugin_paths", store.getState().settings.plugin_paths || {});
        const plugins  = store.getState().plugins;
        const settings = store.getState().settings;
        if (!settings.plugin_paths) settings.plugin_paths = {};

        const pathsCopy = JSON.parse(JSON.stringify(settings.plugin_paths || {}));
        for (const p of plugins) {
            if (!pathsCopy[p.id]) pathsCopy[p.id] = {};
            const existing = pathsCopy[p.id];
            const dp = (p.install && p.install.default_paths) || {};
            if (!existing.bin_path  && dp.bin_path)  existing.bin_path  = dp.bin_path;
            if (!existing.refs_path && dp.refs_path) existing.refs_path = dp.refs_path;
            if (!existing.lib_path  && dp.lib_path)  existing.lib_path  = dp.lib_path;
        }
        // Write merged paths back
        for (const [pid, paths] of Object.entries(pathsCopy)) {
            for (const [field, val] of Object.entries(paths)) {
                store.getState().updatePluginPathSetting(pid, field, val);
            }
        }
        return pathsCopy;
    }

    /* ── Plugin defaults sync ── */
    function syncAllPluginDefaults() {
        const plugins = store.getState().plugins;
        for (const p of plugins) {
            const paramKeys = Object.keys(p.params || {});
            for (const pk of paramKeys) {
                const existing = ((store.getState().settings.plugin_defaults || {})[p.id] || {})[pk];
                if (existing === undefined && p.params[pk].default !== undefined) {
                    store.getState().updatePluginDefault(p.id, pk, p.params[pk].default);
                }
            }
        }
    }

    /* ── Verify single plugin ── */
    async function verifySinglePlugin(pluginId, statusElId) {
        const statusEl = statusElId ? document.getElementById(statusElId) : null;
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-secondary)">Checking...</span>';
        try {
            const results = await api.verifyPlugin(pluginId);
            if (results.offline) {
                if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-secondary)">Offline</span>';
                return;
            }
            const r    = results[pluginId] || results;
            const badge = !r.binary
                ? '<span style="color:var(--text-secondary)">N/A</span>'
                : r.binary_found
                ? '<span class="verify-ok">&#x2714; OK</span>'
                : '<span class="verify-fail">&#x2718; Missing: ' + _esc(r.binary) + '</span>';
            const refsB = r.refs_ok === null || r.refs_ok === undefined ? "" : r.refs_ok
                ? ' <span class="verify-ok">&#x1F4DA; Refs OK</span>'
                : ' <span class="verify-fail">&#x1F4DA; Refs missing</span>';
            const agentB = r.via_agent
                ? ' <span style="color:var(--accent-blue,#4a9eff);font-size:0.8em" title="Verified on your local machine via SeqNode Agent">&#x1F4BB; Local</span>'
                : '';
            if (statusEl) statusEl.innerHTML = badge + refsB + agentB;
        } catch (e) {
            if (statusEl) statusEl.innerHTML = '<span style="color:var(--error)">Error</span>';
        }
    }

    /* ── Verify all plugins ── */
    async function verifyAllPlugins() {
        const plugins = store.getState().plugins;
        for (const plugin of plugins) {
            const statusId = "pstatus-" + plugin.id;
            await verifySinglePlugin(plugin.id, statusId);
        }
    }

    return { syncAllPluginPaths, syncAllPluginDefaults, verifySinglePlugin, verifyAllPlugins };
}

function _esc(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export default { createSettingsPluginsModule };
