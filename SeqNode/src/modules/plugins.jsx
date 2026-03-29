/**
 * modules/plugins.jsx — SeqNode-OS Plugin Management
 *
 * Exports createPluginsModule(api, store) and the PluginSidebar React component.
 *
 * Functions:
 *   fetchPlugins()       — load plugin list and categories
 *   reloadPlugins()      — reload plugins via API
 *   editPlugin(toolId)   — open YAML modal for editing
 *   createNewPlugin()    — open YAML modal for creation
 *   savePlugin()         — save YAML via API
 *   deletePlugin(toolId) — delete plugin via API
 *   handlePluginImport() — import YAML from local file
 *   PluginSidebar        — React sidebar component
 */

import { useState, useEffect, useCallback } from "react";
import { openFileBrowserOverlay } from "./props-io.js";
import { PluginHubPanel } from "../components/PluginHubPanel.jsx";

/* ════════════════════════════════════════════════════════════
   createPluginsModule — factory
   ════════════════════════════════════════════════════════════ */

export function createPluginsModule(api, store) {

    async function _scanUserPlugins() {
        const localDir = store.getState().localPluginsDir;
        if (!localDir) return;
        try { await api.userPluginScan(localDir); } catch (_) { /* agent not connected or dir missing */ }
    }

    async function fetchPlugins() {
        try {
            await _scanUserPlugins();
            const plugins = await api.getPlugins();
            // setPlugins also derives and stores categories from plugin.category fields
            store.getState().setPlugins(plugins);
        } catch (e) {
            console.error("Failed to fetch plugins:", e);
        }
    }

    async function reloadPlugins() {
        try {
            await _scanUserPlugins();
            await api.reloadPlugins();
            const plugins = await api.getPlugins();
            store.getState().setPlugins(plugins);
        } catch (e) {
            console.error("Reload error:", e);
        }
    }

    async function loadSnippets() {
        try {
            const snippets = await api.getPluginSnippets();
            store.getState().setYamlSnippets(snippets || {});
        } catch (_) {
            store.getState().setYamlSnippets({});
        }
    }

    return { fetchPlugins, reloadPlugins, loadSnippets };
}

/* ════════════════════════════════════════════════════════════
   PluginSidebar — React component
   ════════════════════════════════════════════════════════════ */

export function PluginSidebar({ api, store, showModal, closeModal, onAddNode, logMsg }) {
    const [plugins,    setPlugins]    = useState([]);
    const [categories, setCategories] = useState([]);
    const [filterQ,    setFilterQ]    = useState("");
    const [snippets,   setSnippets]   = useState({});
    // Fase 4 — Hub tab
    const [activeTab,  setActiveTab]  = useState("installed");  // "installed" | "hub"

    // Sync from store
    useEffect(() => {
        const sync = () => {
            const s = store.getState();
            setPlugins(s.plugins    || []);
            setCategories(s.categories || []);
            setSnippets(s.yamlSnippets || {});
        };
        sync();
        const unsub = store.subscribe(sync);
        return unsub;
    }, [store]);

    /* ── Drag & drop ── */
    const onPluginDragStart = useCallback((ev, toolId) => {
        ev.dataTransfer.setData("tool_id", toolId);
    }, []);

    /* ── Filter ── */
    const filtered = useCallback((tools) => {
        if (!filterQ) return tools;
        const q = filterQ.toLowerCase();
        return tools.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q)
        );
    }, [filterQ]);

    /* ── Reload ── */
    const handleReload = useCallback(async () => {
        try {
            const localDir = store.getState().localPluginsDir;
            if (localDir) {
                try { await api.userPluginScan(localDir); }
                catch (e) { logMsg?.("engine", "WARN", "User plugin scan: " + e.message); }
            }
            await api.reloadPlugins();
            const newPlugins = await api.getPlugins();
            store.getState().setPlugins(newPlugins);
            logMsg?.("engine", "INFO", "Plugins reloaded.");
        } catch (e) {
            logMsg?.("engine", "ERROR", "Reload error: " + e);
        }
    }, [api, store, logMsg]);

    /* ── Import from agent filesystem ── */
    const handlePluginImport = useCallback(() => {
        const localDir = store.getState().localPluginsDir;
        const startPath = localDir || "~";

        openFileBrowserOverlay(
            api,
            { mode: "file", initialPath: startPath, extensions: ".yaml,.yml" },
            async (selectedPath) => {
                if (!selectedPath) return;
                const filename = selectedPath.split("/").pop();
                try {
                    const data = await api.agentReadFile(selectedPath);
                    const content = data?.content;
                    if (!content) throw new Error("Empty file or read error");

                    if (localDir) {
                        await api.userPluginWrite(localDir, filename, content);
                    } else {
                        const result = await api.savePluginRaw("", filename, content);
                        if (result?.offline) {
                            logMsg?.("engine", "WARN", "Import skipped (offline): " + filename);
                            return;
                        }
                    }
                    logMsg?.("engine", "INFO", "Plugin imported: " + filename);
                    await handleReload();
                } catch (e) {
                    logMsg?.("engine", "ERROR", "Failed to import " + filename + ": " + e.message);
                }
            }
        );
    }, [api, store, handleReload, logMsg]);

    /* ── Edit plugin ── */
    const editPlugin = useCallback(async (toolId) => {
        try {
            const data = await api.getPluginRaw(toolId);
            if (data.offline) {
                showModal("Unavailable",
                    '<p style="color:var(--error)">Plugin editing is not available in offline mode.</p>',
                    null,
                    () => {},
                    closeModal
                );
                return;
            }
            _openYamlEditor({
                title:       "Edit Plugin YAML: " + toolId,
                content:     data.content,
                filename:    data.filename,
                toolId,
                editFilename: false,
                snippets,
                api,
                onSave:      async (tid, fname, yaml) => {
                    const result = await api.savePluginRaw(tid, fname, yaml);
                    if (result.offline) {
                        showModal("Unavailable",
                            '<p style="color:var(--error)">Plugin save is not available in offline mode.</p>',
                            null, () => {}, closeModal);
                        return;
                    }
                    closeModal();
                    await handleReload();
                    logMsg?.("engine", "INFO", "Plugin saved and reloaded.");
                },
                onDelete:    async (tid) => {
                    if (!confirm("Permanently delete '" + tid + "'? This cannot be undone.")) return;
                    try {
                        const result = await api.deletePlugin(tid);
                        if (result.offline) {
                            showModal("Unavailable",
                                '<p style="color:var(--error)">Plugin deletion is not available in offline mode.</p>',
                                null, () => {}, closeModal);
                            return;
                        }
                        closeModal();
                        await handleReload();
                        logMsg?.("engine", "INFO", "Plugin '" + tid + "' deleted.");
                    } catch (e) {
                        showModal("Delete Error",
                            '<p style="color:var(--error)">' + _esc(e.message) + '</p>',
                            null, () => {}, closeModal);
                    }
                },
                showModal,
                closeModal,
            });
        } catch (e) {
            showModal("Error",
                '<p style="color:var(--error)">' + _esc(e.message) + '</p>',
                null, () => {}, closeModal);
        }
    }, [api, snippets, showModal, closeModal, handleReload, logMsg]);

    /* ── Create new plugin ── */
    const createNewPlugin = useCallback(async () => {
        try {
            const data = await api.getPluginTemplate();
            if (data.offline) {
                showModal("Unavailable",
                    '<p style="color:var(--error)">Plugin creation is not available in offline mode.</p>',
                    null, () => {}, closeModal);
                return;
            }
            _openYamlEditor({
                title:       "Create New Plugin",
                content:     data.template,
                filename:    "new_tool.yaml",
                toolId:      "",
                editFilename: true,
                snippets,
                api,
                onSave:      async (tid, fname, yaml) => {
                    const localDir = store.getState().localPluginsDir;
                    if (localDir) {
                        // Save to user's local machine via agent
                        await api.userPluginWrite(localDir, fname, yaml);
                    } else {
                        const result = await api.savePluginRaw(tid, fname, yaml);
                        if (result.offline) {
                            showModal("Unavailable",
                                '<p style="color:var(--error)">Plugin save is not available in offline mode.</p>',
                                null, () => {}, closeModal);
                            return;
                        }
                    }
                    closeModal();
                    await handleReload();
                    logMsg?.("engine", "INFO", "Plugin saved and reloaded.");
                },
                onDelete:    null,
                showModal,
                closeModal,
            });
        } catch (e) {
            showModal("Error",
                '<p style="color:var(--error)">' + _esc(e.message) + '</p>',
                null, () => {}, closeModal);
        }
    }, [api, snippets, showModal, closeModal, handleReload, logMsg]);

    /* ── Render ── */
    return (
        <div className="plugin-sidebar">
            {/* Fase 4 — Tabs: Installed | Hub */}
            <div className="plugin-sidebar-tabs" style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                <button
                    className={`plugin-tab${activeTab === "installed" ? " active" : ""}`}
                    onClick={() => setActiveTab("installed")}
                    style={{
                        flex: 1, padding: "6px 4px", fontSize: "11px", fontWeight: 600,
                        background: activeTab === "installed" ? "var(--bg-panel)" : "transparent",
                        border: "none", cursor: "pointer",
                        color: activeTab === "installed" ? "var(--accent, #6366f1)" : "var(--text-secondary)",
                        borderBottom: activeTab === "installed" ? "2px solid var(--accent, #6366f1)" : "2px solid transparent",
                    }}
                >Installed</button>
                <button
                    className={`plugin-tab${activeTab === "hub" ? " active" : ""}`}
                    onClick={() => setActiveTab("hub")}
                    style={{
                        flex: 1, padding: "6px 4px", fontSize: "11px", fontWeight: 600,
                        background: activeTab === "hub" ? "var(--bg-panel)" : "transparent",
                        border: "none", cursor: "pointer",
                        color: activeTab === "hub" ? "var(--accent, #6366f1)" : "var(--text-secondary)",
                        borderBottom: activeTab === "hub" ? "2px solid var(--accent, #6366f1)" : "2px solid transparent",
                    }}
                >&#x1F310; Hub</button>
            </div>

            {activeTab === "hub" ? (
                <PluginHubPanel />
            ) : (
                <>
                    <div className="plugin-sidebar-toolbar">
                        <input
                            type="text"
                            placeholder="Filter plugins…"
                            value={filterQ}
                            onChange={e => setFilterQ(e.target.value)}
                            style={{ flex: 1, fontSize: "12px" }}
                        />
                        <button className="btn-small" title="Reload plugins" onClick={handleReload}>
                            &#x1F504;
                        </button>
                        <button className="btn-small" title="Create new plugin" onClick={createNewPlugin}>
                            &#x2795;
                        </button>
                        <button className="btn-small" title="Import plugin YAML from local machine"
                            onClick={handlePluginImport}>
                            &#x1F4E5;
                        </button>
                    </div>

                    <div id="plugin-list" className="plugin-list">
                        {categories.length === 0 && (
                            <p style={{ color: "var(--text-secondary)", fontSize: "12px", padding: "8px" }}>
                                No plugins loaded.
                            </p>
                        )}
                        {categories.map(cat => {
                            const tools = filtered(plugins.filter(p => p.category === cat));
                            if (!tools.length) return null;
                            return (
                                <div key={cat} className="plugin-category">
                                    <div className="plugin-category-label">{cat}</div>
                                    {tools.map(t => (
                                        <div
                                            key={t.id}
                                            className="plugin-item"
                                            draggable
                                            data-tool-id={t.id}
                                            onDragStart={ev => onPluginDragStart(ev, t.id)}
                                            onDoubleClick={() => onAddNode?.(t.id)}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <span className="pi-name">{t.name}</span>
                                                {" "}
                                                <span className="pi-version">v{t.version}</span>
                                                {t.source === "user" && (
                                                    <span
                                                        title="Your local plugin — stored on your machine"
                                                        style={{
                                                            marginLeft: 4, fontSize: "9px", padding: "1px 4px",
                                                            background: "rgba(74,158,255,.18)",
                                                            color: "var(--accent-blue, #4a9eff)",
                                                            borderRadius: 3, verticalAlign: "middle",
                                                        }}
                                                    >MY</span>
                                                )}
                                            </div>
                                            <button
                                                className="btn-small"
                                                style={{ padding: "2px 5px", fontSize: "11px" }}
                                                title="Edit YAML"
                                                onClick={e => { e.stopPropagation(); editPlugin(t.id); }}
                                            >
                                                &#x270E;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   YamlEditorModal — componente interno para edição YAML
   Renderizado via showModal com onSetup para attach Tab handler
   ════════════════════════════════════════════════════════════ */

function _openYamlEditor({ title, content, filename, toolId, editFilename, snippets,
                            onSave, onDelete, showModal, closeModal }) {
    const snippetTypes = Object.keys(snippets || {});
    const defaultTypes = ["script", "conda", "container", "rscript", "python", "quantum"];
    const types = snippetTypes.length ? snippetTypes : defaultTypes;

    let bodyHtml = '<div class="plugin-editor-toolbar">';
    if (editFilename) {
        bodyHtml += '<span style="font-size:12px">File:</span>'
            + '<input type="text" id="plugin-yaml-filename" value="' + _esc(filename)
            + '" style="width:220px;font-size:12px">';
    } else {
        bodyHtml += '<span style="font-size:12px;color:var(--text-secondary)">File: ' + _esc(filename) + '</span>';
        bodyHtml += '<input type="hidden" id="plugin-yaml-filename" value="' + _esc(filename) + '">';
    }
    for (const type of types) {
        bodyHtml += '<button data-snippet-type="' + _esc(type) + '" title="Insert ' + type + ' block">+ '
            + type.charAt(0).toUpperCase() + type.slice(1) + '</button>';
    }
    bodyHtml += '</div>';
    bodyHtml += '<textarea id="plugin-yaml-editor" style="width:100%;height:500px;font-size:12px">'
        + _esc(content) + '</textarea>';
    bodyHtml += '<input type="hidden" id="plugin-yaml-toolid" value="' + _esc(toolId) + '">';

    let footerHtml = "";
    if (onDelete) {
        footerHtml += '<button data-yaml-delete style="background:var(--error)">&#x1F5D1; Delete</button> ';
    }
    footerHtml += '<button data-yaml-cancel>Cancel</button> ';
    footerHtml += '<button data-yaml-save style="background:var(--success)">&#x1F4BE; Save</button>';

    showModal(title, bodyHtml, footerHtml, (modalEl) => {
        // Tab handler
        const editor = modalEl.querySelector?.("#plugin-yaml-editor")
            || document.getElementById("plugin-yaml-editor");
        if (editor) {
            editor.addEventListener("keydown", (e) => {
                if (e.key === "Tab") {
                    e.preventDefault();
                    const s = editor.selectionStart;
                    const end = editor.selectionEnd;
                    editor.value = editor.value.substring(0, s) + "  " + editor.value.substring(end);
                    editor.selectionStart = editor.selectionEnd = s + 2;
                }
            });
        }

        // Snippet buttons
        modalEl.querySelectorAll?.("[data-snippet-type]").forEach(btn => {
            btn.addEventListener("click", () => {
                const type    = btn.getAttribute("data-snippet-type");
                const snippet = (snippets || {})[type] || "";
                if (!snippet || !editor) return;
                const start = editor.selectionStart;
                editor.value = editor.value.substring(0, start) + snippet + editor.value.substring(editor.selectionEnd);
                editor.selectionStart = editor.selectionEnd = start + snippet.length;
                editor.focus();
            });
        });

        // Save button
        const saveBtn = modalEl.querySelector?.("[data-yaml-save]");
        if (saveBtn) {
            saveBtn.addEventListener("click", async () => {
                const tid   = (modalEl.querySelector?.("#plugin-yaml-toolid") || document.getElementById("plugin-yaml-toolid"))?.value || "";
                const fname = (modalEl.querySelector?.("#plugin-yaml-filename") || document.getElementById("plugin-yaml-filename"))?.value || "";
                const yaml  = (modalEl.querySelector?.("#plugin-yaml-editor")  || document.getElementById("plugin-yaml-editor"))?.value  || "";
                try {
                    await onSave(tid, fname, yaml);
                } catch (e) {
                    alert("Save Error: " + e.message);
                }
            });
        }

        // Cancel button
        const cancelBtn = modalEl.querySelector?.("[data-yaml-cancel]");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => closeModal());
        }

        // Delete button
        const deleteBtn = modalEl.querySelector?.("[data-yaml-delete]");
        if (deleteBtn && onDelete) {
            deleteBtn.addEventListener("click", () => {
                const tid = (modalEl.querySelector?.("#plugin-yaml-toolid") || document.getElementById("plugin-yaml-toolid"))?.value || "";
                onDelete(tid);
            });
        }
    });
}

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */

function _esc(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


export default { createPluginsModule, PluginSidebar };
