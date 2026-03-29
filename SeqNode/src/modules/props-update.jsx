/**
 * modules/props-update.jsx — SeqNode-OS Properties Panel
 *
 * Exports:
 * - createPropertiesModule(api, store) — factory with all node/edge update functions
 * - PropertiesPanel                   — React component
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
    isDirMode, resolveInputRef,
    dirModeBadge, autoOutputBadge, autoFromUpstreamBadge, multiFileBadge,
    renderIOBrowseButtons, renderOutputBrowseButtons,
    openFileBrowser, openDirBrowser,
    openFileBrowserOverlay, _fbInitPath,
} from "./props-io.js";
import { buildCommandString, parseCommandToNode, renderCommandTerminalHtml, createTerminalState } from "./command.js";

/* ════════════════════════════════════════════════════════════
   Helper: HTML-escape
   ════════════════════════════════════════════════════════════ */

function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s ?? "");
    return d.innerHTML;
}

/* ════════════════════════════════════════════════════════════
   createPropertiesModule factory
   ════════════════════════════════════════════════════════════ */

export function createPropertiesModule(api, store) {
    let _installStatusCache = {};

    function resolveRef(val) {
        const nodes = store.getState().workflow.nodes || [];
        return resolveInputRef(val, nodes);
    }

    function findNode(id) {
        const nodeId = (id && typeof id === "object") ? id.id : id;
        const nodes  = store.getState().workflow.nodes || [];
        return nodes.find(n => n.id === nodeId) || null;
    }

    function getIncomingNodes(nodeId) {
        const nodes = store.getState().workflow.nodes || [];
        return nodes.filter(n => (n.edges || []).includes(nodeId));
    }

    function resolveFullPath(val, node, direction) {
        if (!val) return "";
        if (val.startsWith("$")) {
            const parts     = val.split(".");
            const refNodeId = parts[0].substring(1);
            const portName  = parts.slice(1).join(".");
            const refNode   = findNode(refNodeId);
            if (refNode) {
                const rv = (refNode.outputs_map || {})[portName] || "";
                return rv ? buildAbsolutePath(rv, direction, node)
                          : "$" + refNodeId + "." + portName + " (pending)";
            }
            return val;
        }
        return buildAbsolutePath(val, direction, node);
    }

    function buildAbsolutePath(val, direction, node) {
        if (!val) return "";
        if (val.startsWith("/") || val.startsWith("$") || val.includes("://")) return val;
        const st       = store.getState();
        const nodePP   = (node && node.plugin_paths) || {};
        const globalPP = node ? ((st.settings.plugin_paths || {})[node.tool_id] || {}) : {};
        if (direction === "output") {
            let base = nodePP.bin_path || globalPP.bin_path || (st.settings.dirs && st.settings.dirs.output) || "";
            if (base && !base.endsWith("/")) base += "/";
            return base + val;
        }
        const refsDir = nodePP.refs_path || globalPP.refs_path || "";
        let base = refsDir || (st.settings.dirs && st.settings.dirs.working) || "";
        if (base && !base.endsWith("/")) base += "/";
        return base + val;
    }

    /*
    function generateNodePropertiesHtml(node, plugin) {
        const st = store.getState();
        let html = `<h3>${esc(node.label || node.tool_id)}</h3>`;
        html += propRow("Node ID", `<input class="prop-input" value="${esc(node.id)}" disabled>`);
        html += propRow("Label",   `<input class="prop-input" value="${esc(node.label || "")}" data-action="updateNodeProp" data-prop="label">`);
        html += propRow("Tool ID", `<input class="prop-input" value="${esc(node.tool_id)}" disabled>`);
        html += propRow("Enabled", `<input type="checkbox" ${node.enabled !== false ? "checked" : ""} data-action="updateNodeProp" data-prop="enabled" data-checkbox>`);
        html += propRow("Notes",   `<textarea class="prop-input" rows="2" data-action="updateNodeProp" data-prop="notes">${esc(node.notes || "")}</textarea>`);

        if (!plugin) return html;

        if (plugin.description)
            html += `<div class="prop-desc" style="margin:8px 0">${esc(plugin.description)}</div>`;

        html += renderCommandTerminalHtml();

        html += `<h3 style="margin-top:14px">Parameters</h3>`;
        const paramCategories = {};
        for (const [k, schema] of Object.entries(plugin.params || {})) {
            const cat = schema.category || "General";
            if (!paramCategories[cat]) paramCategories[cat] = [];
            paramCategories[cat].push([k, schema]);
        }
        const catNames = Object.keys(paramCategories);
        for (const catName of catNames) {
            if (catNames.length > 1) {
                html += `<div style="font-size:10px;color:var(--accent);margin-top:8px;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${esc(catName)}</div>`;
            }
            for (const [k, schema] of paramCategories[catName]) {
                const val         = node.params[k] !== undefined ? node.params[k] : "";
                const placeholder = schema.default !== undefined && schema.default !== null ? String(schema.default) : "";
                html += `<div class="prop-group"><label class="prop-label">${esc(schema.label || k)}</label>`;
                if (schema.choices && schema.choices.length) {
                    html += `<select class="prop-input" data-action="updateNodeParam" data-key="${esc(k)}" data-sync-cmd>`;
                    html += `<option value="${val === "" ? " selected" : ""}">-- select --</option>`;
                    for (const c of schema.choices)
                        html += `<option value="${esc(c)}" ${String(val) === String(c) ? "selected" : ""}>${esc(c)}</option>`;
                    html += `</select>`;
                } else if (schema.type === "bool") {
                    html += `<input type="checkbox" ${val === true || val === "true" ? "checked" : ""} data-action="updateNodeParam" data-key="${esc(k)}" data-checkbox data-sync-cmd>`;
                } else if (schema.type === "int" || schema.type === "float") {
                    html += `<input type="number" class="prop-input" value="${esc(val)}" placeholder="${esc(placeholder)}" `
                          + (schema.min != null ? `min="${schema.min}" ` : "")
                          + (schema.max != null ? `max="${schema.max}" ` : "")
                          + `data-action="updateNodeParam" data-key="${esc(k)}" data-numeric data-sync-cmd>`;
                } else if (schema.type === "file") {
                    const paramElId = `param-${node.id}-${k}`;
                    const extStr    = (schema.extensions && schema.extensions.length) ? schema.extensions.join(",") : "";
                    html += `<div class="fp-input-row">`
                          + `<input type="text" class="fp-edit prop-input" id="${esc(paramElId)}" value="${esc(val)}" placeholder="${esc(placeholder || "file path…")}" `
                          + `data-action="updateNodeParam" data-key="${esc(k)}" data-sync-cmd>`
                          + renderIOBrowseButtons(paramElId, extStr, isDirMode(val))
                          + `</div>`;
                } else {
                    html += `<input type="text" class="prop-input" value="${esc(val)}" placeholder="${esc(placeholder)}" `
                          + `data-action="updateNodeParam" data-key="${esc(k)}" data-sync-cmd>`;
                }
                if (schema.description) html += `<div class="prop-desc">${esc(schema.description)}</div>`;
                html += `</div>`;
            }
        }

        html += `<h3 style="margin-top:14px">Inputs</h3>`;
        const incomingNodes = getIncomingNodes(node.id);
        for (const [k, spec] of Object.entries(plugin.inputs || {})) {
            const val       = node.inputs_map[k] || "";
            const resolved  = resolveFullPath(val, node, "input");
            const inputElId = `inp-${node.id}-${k}`;
            const extStr    = (spec.extensions && spec.extensions.length) ? spec.extensions.join(",") : "";
            const isDirM    = isDirMode(val);
            const isMulti   = val && val.includes(";") && !val.startsWith("$");
            const isEmpty   = !val;
            const hasUpstream = incomingNodes.length > 0;

            html += `<div class="file-path-group${spec.required && !val ? " fp-warning" : ""}${isDirM ? " fp-dir-mode" : ""}">`;
            html += `<div class="fp-label">${esc(spec.label || k)}${spec.required ? ' <span style="color:var(--error)">*</span>' : ""}`;
            if (isDirM) html += dirModeBadge();
            else if (isEmpty && hasUpstream) html += autoFromUpstreamBadge();
            else if (isMulti) html += multiFileBadge(val.split(";").filter(s => s.trim()).length);
            html += `</div>`;

            if (isDirM) html += `<div class="prop-desc fp-dir-hint">All files in this directory will be processed sequentially.</div>`;

            if (hasUpstream) {
                html += `<select class="prop-input" style="margin-bottom:3px" data-action="updateNodeInput" data-key="${esc(k)}" data-sync-cmd>`;
                html += `<option value="${esc(val)}">${val ? esc(val) : "-- auto from upstream / select source --"}</option>`;
                for (const inc of incomingNodes) {
                    const incPlugin = (store.getState().plugins || []).find(p => p.id === inc.tool_id);
                    if (!incPlugin) continue;
                    for (const [outKey, outSpec] of Object.entries(incPlugin.outputs || {})) {
                        const refStr = "$" + inc.id + "." + outKey;
                        if (refStr === val) continue;
                        html += `<option value="${esc(refStr)}">${esc(inc.label || inc.id)} / ${esc(outSpec.label || outKey)}</option>`;
                    }
                }
                html += `</select>`;
            }

            if (resolved && resolved !== val) html += `<div class="fp-path" title="Resolved">${esc(resolved)}</div>`;

            html += `<div class="fp-input-row">`
                  + `<input type="text" class="fp-edit prop-input" id="${esc(inputElId)}" value="${esc(val)}" `
                  + `data-action="updateNodeInput" data-key="${esc(k)}" data-sync-cmd `
                  + `placeholder="${isEmpty && hasUpstream ? "auto from upstream — or type path / browse" : "file path, dir/ for batch, or $node.port"}">`
                  + renderIOBrowseButtons(inputElId, extStr, isDirM)
                  + `</div>`;

            if (spec.extensions && spec.extensions.length)
                html += `<div class="prop-desc">Extensions: ${esc(spec.extensions.join(", "))}</div>`;
            html += `</div>`;
        }

        html += `<h3 style="margin-top:14px">Outputs</h3>`;
        const settingsDirs = (st.settings && st.settings.dirs) || {};
        for (const [k, spec] of Object.entries(plugin.outputs || {})) {
            const val       = node.outputs_map[k] || "";
            const resolved  = resolveFullPath(val, node, "output");
            const outputElId = `out-${node.id}-${k}`;
            const isDirM    = isDirMode(val);
            const isEmpty   = !val;

            html += `<div class="file-path-group${isDirM ? " fp-dir-mode" : ""}${isEmpty ? " fp-auto-output" : ""}">`;
            html += `<div class="fp-label">${esc(spec.label || k)}`;
            if (isDirM) html += dirModeBadge();
            else if (isEmpty) html += autoOutputBadge();
            html += `</div>`;

            if (isDirM) {
                html += `<div class="prop-desc fp-dir-hint">Output files will be auto-named and saved into this directory.</div>`;
            } else if (isEmpty) {
                const fallbackDir = settingsDirs.output || "";
                html += `<div class="prop-desc fp-auto-hint">Filename will be generated automatically`
                      + (fallbackDir ? ` in <code>${esc(fallbackDir)}</code>` : " next to the input file")
                      + `. Set a path to override.</div>`;
            }

            if (resolved && resolved !== val) html += `<div class="fp-path" title="Resolved">${esc(resolved)}</div>`;

            html += `<div class="fp-input-row">`
                  + `<input type="text" class="fp-edit prop-input" id="${esc(outputElId)}" value="${esc(val)}" `
                  + `data-action="updateNodeOutput" data-key="${esc(k)}" data-sync-cmd `
                  + `placeholder="leave empty for auto-name, or set path / dir/">`
                  + renderOutputBrowseButtons(outputElId, isDirM)
                  + `</div>`;

            if (spec.extensions && spec.extensions.length)
                html += `<div class="prop-desc">Extensions: ${esc(spec.extensions.join(", "))}</div>`;
            html += `</div>`;
        }

        html += generatePluginPathsHtml(node, plugin);
        html += generateRuntimeOverrideHtml(node, plugin);
        html += generateInstallSectionHtml(node, plugin);

        return html;
    }

    function generatePluginPathsHtml(node, plugin) {
        const install = plugin.install || {};
        const dp      = install.default_paths || {};
        const pp      = node.plugin_paths || {};
        const st      = store.getState();
        const globalPP = (st.settings.plugin_paths || {})[plugin.id] || {};

        const binPlaceholder  = globalPP.bin_path  || dp.bin_path  || "(not set)";
        const refsPlaceholder = globalPP.refs_path || dp.refs_path || "(not set)";
        const libPlaceholder  = globalPP.lib_path  || dp.lib_path  || "(not set)";

        let html = `<details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600;font-size:12px;padding:4px 0">&#x1F4C1; Plugin Path Overrides (per-node)</summary>`;

        const fields = [
            { key: "bin_path",  label: "Binary / Executable Path", ph: binPlaceholder,  elId: `np-bin-${node.id}`  },
            { key: "refs_path", label: "References / Annotations Path", ph: refsPlaceholder, elId: `np-refs-${node.id}` },
            { key: "lib_path",  label: "Library / Database Path", ph: libPlaceholder,  elId: `np-lib-${node.id}`  },
        ];

        for (const f of fields) {
            html += `<div class="file-path-group"><div class="fp-label">${f.label}</div>`
                  + `<div class="fp-input-row">`
                  + `<input type="text" class="fp-edit prop-input" id="${esc(f.elId)}" value="${esc(pp[f.key] || "")}" placeholder="${esc(f.ph)}" `
                  + `data-action="updateNodePluginPath" data-node-id="${esc(node.id)}" data-field="${f.key}">`
                  + `<button class="btn-small btn-browse-file" data-browse-dir data-input-id="${esc(f.elId)}" title="Browse">&#x1F4C2;</button>`
                  + `</div></div>`;
        }

        html += `</details>`;
        return html;
    }

    function generateRuntimeOverrideHtml(node, plugin) {
        if (!node.runtime_override) node.runtime_override = {};
        const ro          = node.runtime_override;
        const currentMode = ro.mode || "auto";

        let html = `<details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600;font-size:12px;padding:4px 0">&#x1F3AD; Runtime Override (how to execute)</summary>`;
        html += `<div class="prop-desc" style="margin:6px 0">Controls how the command is wrapped. Use when conda/mamba is not in PATH.</div>`;

        html += `<div class="prop-group"><label class="prop-label">Execution Mode</label>`;
        html += `<select class="prop-input" data-action="updateRuntimeOverride" data-node-id="${esc(node.id)}" data-field="mode" data-rerender>`;
        const modes = [
            { value: "auto",         label: "Auto (use plugin runtime type)" },
            { value: "system",       label: "System (binary in PATH or bin_path)" },
            { value: "conda",        label: "Conda/Mamba (specify binary path)" },
            { value: "shell_source", label: "Shell Source (source script + activate)" },
            { value: "direct",       label: "Direct (no wrapping, run as-is)" },
        ];
        for (const m of modes) {
            html += `<option value="${esc(m.value)}" ${currentMode === m.value ? "selected" : ""}>${esc(m.label)}</option>`;
        }
        html += `</select></div>`;

        if (currentMode === "conda") {
            html += `<div class="prop-group"><label class="prop-label">Conda/Mamba Binary Path</label>`
                  + `<div class="fp-input-row">`
                  + `<input type="text" class="fp-edit prop-input" id="ro-conda-bin-${esc(node.id)}" value="${esc(ro.conda_bin || "")}" placeholder="e.g. ~/miniforge3/bin/mamba" `
                  + `data-action="updateRuntimeOverride" data-node-id="${esc(node.id)}" data-field="conda_bin">`
                  + `<button class="btn-small btn-browse-file" data-browse-file data-input-id="ro-conda-bin-${esc(node.id)}" data-ext="">&#x1F4C2;</button>`
                  + `</div>`
                  + `<div class="prop-desc">Full path to conda or mamba binary.</div></div>`;
            html += `<div class="prop-group"><label class="prop-label">Conda Environment Name</label>`
                  + `<input type="text" class="prop-input" value="${esc(ro.conda_env || (plugin.runtime ? plugin.runtime.conda_env || "" : ""))}" placeholder="e.g. seqnode" `
                  + `data-action="updateRuntimeOverride" data-node-id="${esc(node.id)}" data-field="conda_env"></div>`;
        }

        if (currentMode === "shell_source") {
            html += `<div class="prop-group"><label class="prop-label">Source Script Path</label>`
                  + `<div class="fp-input-row">`
                  + `<input type="text" class="fp-edit prop-input" id="ro-source-${esc(node.id)}" value="${esc(ro.source_script || "")}" placeholder="e.g. ~/miniforge3/etc/profile.d/conda.sh" `
                  + `data-action="updateRuntimeOverride" data-node-id="${esc(node.id)}" data-field="source_script">`
                  + `<button class="btn-small btn-browse-file" data-browse-file data-input-id="ro-source-${esc(node.id)}" data-ext="">&#x1F4C2;</button>`
                  + `</div></div>`;
            html += `<div class="prop-group"><label class="prop-label">Conda Environment Name</label>`
                  + `<input type="text" class="prop-input" value="${esc(ro.conda_env || "")}" placeholder="e.g. seqnode (leave empty to skip activate)" `
                  + `data-action="updateRuntimeOverride" data-node-id="${esc(node.id)}" data-field="conda_env"></div>`;
        }

        if (currentMode === "auto") {
            const rtType = plugin.runtime ? plugin.runtime.type : "system";
            const rtEnv  = plugin.runtime ? plugin.runtime.conda_env || "" : "";
            html += `<div class="prop-desc" style="margin:6px 0">Using plugin runtime: <code>${esc(rtType)}</code>${rtEnv ? " / env: <code>" + esc(rtEnv) + "</code>" : ""}.</div>`;
        }

        html += `</details>`;
        return html;
    }

    function generateInstallSectionHtml(node, plugin) {
        if (!plugin.install) return "";
        const toolId = plugin.id;
        return `<details class="install-details" style="margin-top:14px">`
             + `<summary class="install-summary" style="cursor:pointer;font-weight:600;font-size:12px;padding:4px 0">`
             + `&#x1F6E0; Installation &amp; Status <span id="install-badge-${esc(toolId)}"></span></summary>`
             + `<div style="padding:6px 0"><div id="install-info-${esc(toolId)}"><span style="color:var(--text-secondary)">Loading...</span></div></div>`
             + `</details>`;
    }

    function generateEdgePropertiesHtml(selectedEdge) {
        const srcNode = findNode(selectedEdge.source);
        const tgtNode = findNode(selectedEdge.target);
        if (!srcNode || !tgtNode) return "";

        const plugins   = store.getState().plugins || [];
        const srcPlugin = plugins.find(p => p.id === srcNode.tool_id);
        const tgtPlugin = plugins.find(p => p.id === tgtNode.tool_id);

        let html = `<h3>&#x1F517; Edge Connection</h3>`;
        html += `<div class="edge-header-info">`
              + `<div class="edge-node-badge edge-node-src">&#x25C9; ${esc(srcNode.label)}</div>`
              + `<div class="edge-arrow">&#x2794;</div>`
              + `<div class="edge-node-badge edge-node-tgt">&#x25C9; ${esc(tgtNode.label)}</div>`
              + `</div>`;

        html += `<div class="edge-ids"><span>Source: <code>${esc(srcNode.id)}</code></span> <span>Target: <code>${esc(tgtNode.id)}</code></span></div>`;

        html += `<div class="settings-group-title" style="margin-top:12px">&#x1F4E4; Source Outputs (${esc(srcNode.label)})</div>`;
        if (srcPlugin && srcPlugin.outputs) {
            for (const [outKey, outSpec] of Object.entries(srcPlugin.outputs)) {
                const outVal   = (srcNode.outputs_map || {})[outKey] || "";
                const resolved = resolveFullPath(outVal, srcNode, "output");
                const refStr   = "$" + srcNode.id + "." + outKey;
                const outElId  = `edge-srcout-${srcNode.id}-${outKey}`;
                const isDirM   = isDirMode(outVal);

                html += `<div class="file-path-group${isDirM ? " fp-dir-mode" : ""}${!outVal ? " fp-auto-output" : ""}">`;
                html += `<div class="fp-label">${esc(outSpec.label || outKey)} <code style="font-size:10px;color:var(--text-secondary)">${esc(refStr)}</code>`;
                if (isDirM) html += dirModeBadge();
                else if (!outVal) html += autoOutputBadge();
                html += `</div>`;
                if (resolved && resolved !== outVal) html += `<div class="fp-path" title="Resolved">${esc(resolved)}</div>`;
                html += `<div class="fp-input-row">`
                      + `<input type="text" class="fp-edit prop-input" id="${esc(outElId)}" value="${esc(outVal)}" `
                      + `data-action="updateEdgeSourceOutput" data-node-id="${esc(srcNode.id)}" data-out-key="${esc(outKey)}" `
                      + `placeholder="leave empty for auto-name">`
                      + renderOutputBrowseButtons(outElId, isDirM)
                      + `</div></div>`;
            }
        }

        html += `<div class="settings-group-title" style="margin-top:14px">&#x1F4E5; Target Inputs (${esc(tgtNode.label)})</div>`;
        html += `<div style="margin-bottom:8px">`
              + `<button class="btn-small" data-action="autoMapEdge" title="Auto-map by extension">&#x1F504; Auto-Map</button> `
              + `<button class="btn-small" data-action="clearEdge" title="Clear edge mappings">&#x1F5D1; Clear</button>`
              + `</div>`;

        if (tgtPlugin && tgtPlugin.inputs) {
            const allUpstream = getIncomingNodes(tgtNode.id);
            const plugins2    = store.getState().plugins || [];

            for (const [inKey, inSpec] of Object.entries(tgtPlugin.inputs)) {
                const curVal   = (tgtNode.inputs_map || {})[inKey] || "";
                const resolved = resolveFullPath(curVal, tgtNode, "input");
                const isLinked = curVal.startsWith("$" + srcNode.id + ".");
                const isDirM   = isDirMode(curVal);
                const isEmpty  = !curVal;
                const isMulti  = curVal && curVal.includes(";") && !curVal.startsWith("$");
                let cardCls    = isLinked ? "fp-linked" : (inSpec.required && !curVal ? "fp-warning" : "");
                if (isDirM) cardCls += " fp-dir-mode";

                html += `<div class="file-path-group ${cardCls}">`;
                html += `<div class="fp-label">${esc(inSpec.label || inKey)}${inSpec.required ? ' <span style="color:var(--error)">*</span>' : ""}`;
                if (isDirM) html += dirModeBadge();
                else if (isEmpty) html += autoFromUpstreamBadge();
                else if (isMulti) html += multiFileBadge(curVal.split(";").filter(s => s.trim()).length);
                html += `</div>`;

                html += `<select class="prop-input" style="margin-bottom:3px" `
                      + `data-action="updateEdgeMapping" data-node-id="${esc(tgtNode.id)}" data-in-key="${esc(inKey)}">`;
                html += `<option value="">${curVal ? esc(curVal) : "-- auto from upstream --"}</option>`;
                for (const upNode of allUpstream) {
                    const upPlugin = plugins2.find(p => p.id === upNode.tool_id);
                    if (!upPlugin) continue;
                    html += `<optgroup label="${esc(upNode.label || upNode.id)}">`;
                    for (const [outKey2, outSpec2] of Object.entries(upPlugin.outputs || {})) {
                        const ref2 = "$" + upNode.id + "." + outKey2;
                        html += `<option value="${esc(ref2)}" ${curVal === ref2 ? "selected" : ""}>${esc(outSpec2.label || outKey2)}</option>`;
                    }
                    html += `</optgroup>`;
                }
                html += `</select>`;

                if (resolved && resolved !== curVal) html += `<div class="fp-path" title="Resolved">${esc(resolved)}</div>`;

                const edgeInputElId = `edge-tgtinp-${tgtNode.id}-${inKey}`;
                const extStr        = (inSpec.extensions && inSpec.extensions.length) ? inSpec.extensions.join(",") : "";
                html += `<div class="fp-input-row">`
                      + `<input type="text" class="fp-edit prop-input" id="${esc(edgeInputElId)}" value="${esc(curVal)}" `
                      + `data-action="updateEdgeMapping" data-node-id="${esc(tgtNode.id)}" data-in-key="${esc(inKey)}" `
                      + `placeholder="auto from upstream — or $nodeId.outputKey">`
                      + renderIOBrowseButtons(edgeInputElId, extStr, isDirM)
                      + `</div></div>`;
            }
        }

        let mappedCount = 0;
        const totalInputs = tgtPlugin && tgtPlugin.inputs ? Object.keys(tgtPlugin.inputs).length : 0;
        if (tgtPlugin && tgtPlugin.inputs) {
            for (const [ik] of Object.entries(tgtPlugin.inputs)) {
                if (((tgtNode.inputs_map || {})[ik] || "").startsWith("$" + srcNode.id + ".")) mappedCount++;
            }
        }
        const autoCount = totalInputs - mappedCount;
        html += `<div class="settings-group-title" style="margin-top:14px">&#x1F4CB; Connection Summary</div>`;
        html += `<div class="prop-desc">${mappedCount} of ${totalInputs} input(s) explicitly mapped.`;
        if (autoCount > 0) html += ` <span class="io-badge io-badge-upstream" style="vertical-align:middle">&#x1F517; ${autoCount} auto-resolved at runtime</span>`;
        html += `</div>`;

        html += `<div style="margin-top:12px"><button class="btn-small" style="background:var(--error)" data-action="deleteEdge">&#x1F5D1; Delete Edge</button></div>`;

        return html;
    }
    */

    /* ════════════════════════════════════════════════════════════
       Update functions (mutate workflow in store)
       ════════════════════════════════════════════════════════════ */

    function updateNodeProp(prop, val) {
        const st   = store.getState();
        const node = findNode(st.selectedNode);
        if (!node) return;
        node[prop] = val;
        st.setWorkflow({ ...st.workflow });
    }

    function updateNodeParam(key, val) {
        const st   = store.getState();
        const node = findNode(st.selectedNode);
        if (!node) return;
        if (val === "" || val === undefined) { delete node.params[key]; }
        else { if (typeof val === "string") val = val.replace(/\\/g, "/"); node.params[key] = val; }
        st.setWorkflow({ ...st.workflow });
    }

    function updateNodeInput(key, val) {
        const st   = store.getState();
        const node = findNode(st.selectedNode);
        if (!node) return;
        if (typeof val === "string") val = val.replace(/\\/g, "/");
        node.inputs_map[key] = val;
        st.setWorkflow({ ...st.workflow });
    }

    function updateNodeOutput(key, val) {
        const st   = store.getState();
        const node = findNode(st.selectedNode);
        if (!node) return;
        if (typeof val === "string") val = val.replace(/\\/g, "/");
        node.outputs_map[key] = val;
        st.setWorkflow({ ...st.workflow });
    }

    function updateNodePluginPath(nodeId, field, val) {
        const st   = store.getState();
        const node = findNode(nodeId);
        if (!node) return;
        if (!node.plugin_paths) node.plugin_paths = {};
        node.plugin_paths[field] = val;
        st.setWorkflow({ ...st.workflow });
    }

    function updateEdgeMapping(nodeId, inKey, outVal) {
        const st   = store.getState();
        const node = findNode(nodeId);
        if (node) node.inputs_map[inKey] = outVal;
        st.setWorkflow({ ...st.workflow });
    }

    function updateEdgeMultiOutput(nodeId, inKey, outRef, checked) {
        const st   = store.getState();
        const node = findNode(nodeId);
        if (!node) return;
        const parts = (node.inputs_map[inKey] || "").split(";").filter(s => s.trim());
        if (checked) { if (!parts.includes(outRef)) parts.push(outRef); }
        else { const idx = parts.indexOf(outRef); if (idx >= 0) parts.splice(idx, 1); }
        node.inputs_map[inKey] = parts.join(";");
        st.setWorkflow({ ...st.workflow });
    }

    function updateEdgeSourceOutput(nodeId, outKey, val) {
        const st   = store.getState();
        const node = findNode(nodeId);
        if (node) node.outputs_map[outKey] = val;
        st.setWorkflow({ ...st.workflow });
    }

    function applyDefaultPathsFromStatus(toolId, nodeId, cached) {
        const st = store.getState();
        if (!cached || !cached.install_cfg) return;
        try { if (typeof cached.install_cfg === "string") cached.install_cfg = JSON.parse(cached.install_cfg); } catch (_) { return; }
        const dp   = (cached.install_cfg && cached.install_cfg.default_paths) || {};
        const node = findNode(nodeId);
        if (!node) return;
        if (!node.plugin_paths) node.plugin_paths = {};
        let changed = false;
        for (const k of ["bin_path", "refs_path", "lib_path"]) {
            if (!node.plugin_paths[k] && dp[k]) { node.plugin_paths[k] = dp[k]; changed = true; }
        }
        if (changed) st.setWorkflow({ ...st.workflow });
        return changed;
    }

    function updateRuntimeOverride(nodeId, field, val) {
        const st   = store.getState();
        const node = findNode(nodeId);
        if (!node) return;
        if (!node.runtime_override) node.runtime_override = {};
        node.runtime_override[field] = val;
        st.setWorkflow({ ...st.workflow });
    }

    function autoMapEdge(onRender) {
        const st = store.getState();
        if (!st.selectedEdge) return;
        const srcNode   = findNode(st.selectedEdge.source);
        const tgtNode   = findNode(st.selectedEdge.target);
        if (!srcNode || !tgtNode) return;
        const plugins   = st.plugins || [];
        const srcPlugin = plugins.find(p => p.id === srcNode.tool_id);
        const tgtPlugin = plugins.find(p => p.id === tgtNode.tool_id);
        if (!srcPlugin || !tgtPlugin) return;

        const usedOutputs = {};
        for (const [inKey, inSpec] of Object.entries(tgtPlugin.inputs || {})) {
            let bestOut = null, bestScore = -1;
            for (const [outKey, outSpec] of Object.entries(srcPlugin.outputs || {})) {
                if (usedOutputs[outKey]) continue;
                let score = 0;
                for (const ie of (inSpec.extensions || [])) {
                    for (const oe of (outSpec.extensions || [])) {
                        if (ie.toLowerCase() === oe.toLowerCase()) score += 10;
                    }
                }
                if (inKey === outKey) score += 5;
                if (score > bestScore) { bestScore = score; bestOut = outKey; }
            }
            if (bestOut && bestScore > 0) {
                tgtNode.inputs_map[inKey] = "$" + srcNode.id + "." + bestOut;
                usedOutputs[bestOut] = true;
            }
        }
        st.setWorkflow({ ...st.workflow });
        onRender?.();
    }

    function clearEdgeMappings(onRender) {
        const st = store.getState();
        if (!st.selectedEdge) return;
        const srcId   = st.selectedEdge.source;
        const tgtNode = findNode(st.selectedEdge.target);
        if (!tgtNode) return;
        for (const k of Object.keys(tgtNode.inputs_map)) {
            if (tgtNode.inputs_map[k].startsWith("$" + srcId + ".")) tgtNode.inputs_map[k] = "";
        }
        st.setWorkflow({ ...st.workflow });
        onRender?.();
    }

    function deleteSelectedEdge(onRender) {
        const st = store.getState();
        if (!st.selectedEdge) return;
        const srcNode = findNode(st.selectedEdge.source);
        if (srcNode) srcNode.edges = (srcNode.edges || []).filter(e => e !== st.selectedEdge.target);
        st.clearSelection();
        st.setWorkflow({ ...st.workflow });
        onRender?.();
    }

    function loadInstallStatus(toolId, nodeId, onDone) {
        api.getPluginInstallStatus(toolId)
            .then(data => {
                _installStatusCache[toolId] = data;
                onDone?.(toolId, nodeId, data);
            })
            .catch(() => {
                onDone?.(toolId, nodeId, { error: true });
            });
    }

    function startInstall(toolId, onProgress) {
        api.installPlugin(toolId)
            .then(data => {
                if (data.status === "started" || data.status === "already_running") {
                    _pollInstallLogs(toolId, 0, onProgress);
                }
            })
            .catch(e => {
                onProgress?.({ lines: [`Error: ${String(e)}`], error: true });
            });
    }

    function _pollInstallLogs(toolId, offset, onProgress) {
        api.getPluginInstallLogs(toolId, offset)
            .then(data => {
                onProgress?.(data);
                if (data.status === "running") {
                    setTimeout(() => _pollInstallLogs(toolId, data.offset, onProgress), 1000);
                } else {
                    loadInstallStatus(toolId, store.getState().selectedNode || "", (tId, nId, statusData) => {
                        onProgress?.({ ...data, finalStatus: statusData });
                    });
                }
            })
            .catch(() => {});
    }

    function syncCmdAfterRender(node, plugin) {
        const box = document.getElementById("cmd-terminal-input");
        if (!box) return;
        if (node.custom_command && node.custom_command.trim()) {
            box.value = node.custom_command;
            _setTerminalStatus("Custom command (saved) — has priority", "cmd-status-saved");
        } else {
            box.value = buildCommandString(node, plugin, resolveRef);
            _setTerminalStatus("Auto-generated — edit to customize", "cmd-status-auto");
        }
    }

    function _setTerminalStatus(msg, cls) {
        const el = document.getElementById("cmd-terminal-status");
        if (el) { el.textContent = msg; el.className = "cmd-terminal-status " + (cls || ""); }
    }

    function persistWorkflow() {
        const st = store.getState();
        st.setWorkflow({ ...st.workflow });
    }

    /* ── File/directory browser helpers (server-side, returns absolute paths) ── */
    function doBrowseFile(currentVal, _extensions, cb) {
        // Always list all files — let the user choose freely.
        openFileBrowserOverlay(api, { mode: "file", initialPath: _fbInitPath(currentVal), extensions: "" }, cb);
    }
    function doBrowseDir(currentVal, cb) {
        openFileBrowserOverlay(api, { mode: "dir", initialPath: _fbInitPath(currentVal) }, cb);
    }
    function doBrowseSave(currentVal, cb) {
        openFileBrowserOverlay(api, { mode: "save", initialPath: _fbInitPath(currentVal) }, cb);
    }

    return {
        updateNodeProp, updateNodeParam, updateNodeInput, updateNodeOutput,
        updateNodePluginPath, updateEdgeMapping, updateEdgeMultiOutput,
        updateEdgeSourceOutput, applyDefaultPathsFromStatus,
        updateRuntimeOverride, autoMapEdge, clearEdgeMappings, deleteSelectedEdge,
        loadInstallStatus, startInstall, syncCmdAfterRender, persistWorkflow,
        findNode, resolveRef, getIncomingNodes, resolveFullPath,
        doBrowseFile, doBrowseDir, doBrowseSave,
    };
}

/* ════════════════════════════════════════════════════════════
   React Components Puros
   ════════════════════════════════════════════════════════════ */

function CommandTerminalWrapper({ node, plugin, termStateRef, mod, onRender }) {
    const prevNodeIdRef = useRef(null);
    const handleTerminalEvent = useCallback((e) => {
        const target = e.target.closest("[data-cmd-save],[data-cmd-reset],[data-cmd-focus],[data-cmd-input]");
        if (!target) return;
        if (target.hasAttribute("data-cmd-focus")) { termStateRef.current?.onFocus(); }
        if (target.hasAttribute("data-cmd-input")) {
            termStateRef.current?.onInput((msg, cls) => {
                const el = document.getElementById("cmd-terminal-status");
                if (el) { el.textContent = msg; el.className = "cmd-terminal-status " + cls; }
            });
        }
        if (target.hasAttribute("data-cmd-save")) {
            termStateRef.current?.onSave({
                node, plugin,
                getBoxValue: () => document.getElementById("cmd-terminal-input")?.value || "",
                setStatusFn: (msg, cls) => {
                    const el = document.getElementById("cmd-terminal-status");
                    if (el) { el.textContent = msg; el.className = "cmd-terminal-status " + cls; }
                },
                onRerender: onRender,
                onPersist: () => mod.persistWorkflow(),
                resolveRef: mod.resolveRef,
            });
        }
        if (target.hasAttribute("data-cmd-reset")) {
            termStateRef.current?.onReset({ node, onRerender: onRender });
        }
    }, [node, plugin, termStateRef, mod, onRender]);

    // Mirrors vanilla's GF._resetCmdEditState() called at the top of renderProperties():
    // when the selected node changes, reset editing state so the terminal always
    // populates fresh — just like vanilla does on every full properties re-render.
    // Within the same node, respect isEditing() to avoid overwriting unsaved terminal edits.
    useEffect(() => {
        const nodeChanged = prevNodeIdRef.current !== node.id;
        if (nodeChanged) {
            prevNodeIdRef.current = node.id;
            termStateRef.current?.reset();
        }
        if (!termStateRef.current?.isEditing()) {
            mod.syncCmdAfterRender(node, plugin);
        }
    }); // intentionally no dep array

    return (
        <div
            onClick={handleTerminalEvent}
            onInput={handleTerminalEvent}
            onFocus={handleTerminalEvent}
            dangerouslySetInnerHTML={{ __html: renderCommandTerminalHtml() }}
        />
    );
}

function PluginPaths({ node, plugin, mod, store }) {
    const install = plugin.install || {};
    const dp      = install.default_paths || {};
    const pp      = node.plugin_paths || {};
    const settings = store(s => s.settings) || {};
    const globalPP = (settings.plugin_paths || {})[plugin.id] || {};

    const fields = [
        { key: "bin_path",  label: "Binary / Executable Path", ph: globalPP.bin_path  || dp.bin_path  || "(not set)" },
        { key: "refs_path", label: "References / Annotations Path", ph: globalPP.refs_path || dp.refs_path || "(not set)" },
        { key: "lib_path",  label: "Library / Database Path", ph: globalPP.lib_path  || dp.lib_path  || "(not set)" },
    ];

    return (
        <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 12, padding: "4px 0" }}>
                &#x1F4C1; Plugin Path Overrides (per-node)
            </summary>
            {fields.map(f => (
                <div key={f.key} className="file-path-group">
                    <div className="fp-label">{f.label}</div>
                    <div className="fp-input-row">
                        <input
                            type="text"
                            className="fp-edit prop-input"
                            value={pp[f.key] || ""}
                            placeholder={f.ph}
                            onChange={(e) => mod.updateNodePluginPath(node.id, f.key, e.target.value)}
                        />
                        <button
                            className="btn-small btn-browse-file"
                            title="Browse Directory"
                            onClick={() => mod.doBrowseDir(pp[f.key] || "", path => mod.updateNodePluginPath(node.id, f.key, path))}
                        >
                            &#x1F4C2;
                        </button>
                    </div>
                </div>
            ))}
        </details>
    );
}

function RuntimeOverride({ node, plugin, mod }) {
    const ro = node.runtime_override || {};
    const currentMode = ro.mode || "auto";

    return (
        <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 12, padding: "4px 0" }}>
                &#x1F3AD; Runtime Override (how to execute)
            </summary>
            <div className="prop-desc" style={{ margin: "6px 0" }}>Controls how the command is wrapped. Use when conda/mamba is not in PATH.</div>
            
            <div className="prop-group">
                <label className="prop-label">Execution Mode</label>
                <select
                    className="prop-input"
                    value={currentMode}
                    onChange={(e) => mod.updateRuntimeOverride(node.id, "mode", e.target.value)}
                >
                    <option value="auto">Auto (use plugin runtime type)</option>
                    <option value="system">System (binary in PATH or bin_path)</option>
                    <option value="conda">Conda/Mamba (specify binary path)</option>
                    <option value="shell_source">Shell Source (source script + activate)</option>
                    <option value="direct">Direct (no wrapping, run as-is)</option>
                </select>
            </div>

            {currentMode === "conda" && (
                <>
                    <div className="prop-group">
                        <label className="prop-label">Conda/Mamba Binary Path</label>
                        <div className="fp-input-row">
                            <input
                                type="text"
                                className="fp-edit prop-input"
                                value={ro.conda_bin || ""}
                                placeholder="e.g. ~/miniforge3/bin/mamba"
                                onChange={(e) => mod.updateRuntimeOverride(node.id, "conda_bin", e.target.value)}
                            />
                            <button
                                className="btn-small btn-browse-file"
                                title="Browse File"
                                onClick={() => mod.doBrowseFile(ro.conda_bin || "", "", path => mod.updateRuntimeOverride(node.id, "conda_bin", path))}
                            >
                                &#x1F4C2;
                            </button>
                        </div>
                        <div className="prop-desc">Full path to conda or mamba binary.</div>
                    </div>
                    <div className="prop-group">
                        <label className="prop-label">Conda Environment Name</label>
                        <input
                            type="text"
                            className="prop-input"
                            value={ro.conda_env ?? (plugin.runtime?.conda_env || "")}
                            placeholder="e.g. seqnode"
                            onChange={(e) => mod.updateRuntimeOverride(node.id, "conda_env", e.target.value)}
                        />
                    </div>
                </>
            )}

            {currentMode === "shell_source" && (
                <>
                    <div className="prop-group">
                        <label className="prop-label">Source Script Path</label>
                        <div className="fp-input-row">
                            <input
                                type="text"
                                className="fp-edit prop-input"
                                value={ro.source_script || ""}
                                placeholder="e.g. ~/miniforge3/etc/profile.d/conda.sh"
                                onChange={(e) => mod.updateRuntimeOverride(node.id, "source_script", e.target.value)}
                            />
                            <button
                                className="btn-small btn-browse-file"
                                title="Browse File"
                                onClick={() => mod.doBrowseFile(ro.source_script || "", "", path => mod.updateRuntimeOverride(node.id, "source_script", path))}
                            >
                                &#x1F4C2;
                            </button>
                        </div>
                    </div>
                    <div className="prop-group">
                        <label className="prop-label">Conda Environment Name</label>
                        <input
                            type="text"
                            className="prop-input"
                            value={ro.conda_env || ""}
                            placeholder="e.g. seqnode (leave empty to skip activate)"
                            onChange={(e) => mod.updateRuntimeOverride(node.id, "conda_env", e.target.value)}
                        />
                    </div>
                </>
            )}

            {currentMode === "auto" && (
                <div className="prop-desc" style={{ margin: "6px 0" }}>
                    Using plugin runtime: <code>{plugin.runtime?.type || "system"}</code>
                    {plugin.runtime?.conda_env && ` / env: `}
                    {plugin.runtime?.conda_env && <code>{plugin.runtime.conda_env}</code>}.
                </div>
            )}
        </details>
    );
}

function InstallSection({ node, plugin, mod }) {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    const fetchStatus = useCallback(() => {
        setLoading(true);
        mod.loadInstallStatus(plugin.id, node.id, (toolId, nodeId, data) => {
            setStatusData(data);
            setLoading(false);
        });
    }, [plugin.id, node.id, mod]);

    useEffect(() => {
        if (plugin.install) fetchStatus();
    }, [fetchStatus, plugin.install]);

    const handleInstall = () => {
        setLogs(["Starting install...\n"]);
        mod.startInstall(plugin.id, (data) => {
            if (data.error) {
                setLogs(l => [...l, ...(data.lines || [])]);
            } else if (data.lines) {
                setLogs(l => [...l, ...data.lines]);
            }
            if (data.finalStatus) {
                setStatusData(data.finalStatus);
            }
        });
    };

    if (!plugin.install) return null;

    return (
        <details className="install-details" style={{ marginTop: 14 }}>
            <summary className="install-summary" style={{ cursor: "pointer", fontWeight: 600, fontSize: 12, padding: "4px 0" }}>
                &#x1F6E0; Installation &amp; Status{" "}
                {loading ? <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>Loading...</span> : 
                 statusData?.installed ? <span style={{ color: "var(--success)", fontSize: 11 }}>&#x2714; {statusData.version || "Installed"}</span> :
                 <span style={{ color: "var(--error)", fontSize: 11 }}>&#x2718; Not found</span>}
            </summary>
            
            <div style={{ padding: "6px 0" }}>
                {statusData && !loading && (
                    <>
                        <div className="inst-meta-row" style={{ fontSize: 11, padding: "2px 0" }}><strong>Binary:</strong> {statusData.binary || "?"}</div>
                        <div className="inst-meta-row" style={{ fontSize: 11, padding: "2px 0" }}><strong>Path:</strong> <code>{statusData.binary_path || "not found"}</code></div>
                        {statusData.version && <div className="inst-meta-row" style={{ fontSize: 11, padding: "2px 0" }}><strong>Version:</strong> {statusData.version}</div>}
                        {statusData.install_cfg?.conda_package && <div className="inst-meta-row" style={{ fontSize: 11 }}><strong>Package:</strong> {statusData.install_cfg.conda_package}</div>}
                        {statusData.install_cfg?.notes && <div className="install-notes">{statusData.install_cfg.notes}</div>}
                        
                        <div className="install-actions">
                            <button className={`btn-install ${statusData.installed ? 'btn-install-update' : ''}`} onClick={handleInstall}>
                                {statusData.installed ? <React.Fragment>&#x1F504; Reinstall/Update</React.Fragment> : <React.Fragment>&#x1F4E6; Install</React.Fragment>}
                            </button>
                            <button className="btn-small" onClick={fetchStatus}>&#x1F50D; Re-check</button>
                        </div>
                    </>
                )}
                {logs.length > 0 && (
                    <div className="install-log" style={{ display: "block" }}>
                        {logs.map((line, i) => {
                            const cls = (line.includes("error") || line.includes("ERROR")) ? "ilog-error"
                                      : (line.includes("done") || line.includes("OK")) ? "ilog-ok" : "ilog-info";
                            return <div key={i} className={`ilog-line ${cls}`}>{line}</div>;
                        })}
                    </div>
                )}
            </div>
        </details>
    );
}

function NodeProperties({ node, plugin, mod, store, termStateRef, onRender }) {
    // All hooks must be called unconditionally before any early return
    const settings      = store(s => s.settings)      || {};
    const plugins       = store(s => s.plugins         || []);
    const settingsDirs  = settings.dirs || {};
    const incomingNodes = node ? mod.getIncomingNodes(node.id) : [];

    if (!node) return null;

    return (
        <div>
            <h3>{node.label || node.tool_id}</h3>
            <div className="prop-group"><label className="prop-label">Node ID</label><input className="prop-input" value={node.id} disabled /></div>
            <div className="prop-group"><label className="prop-label">Label</label><input className="prop-input" value={node.label || ""} onChange={e => mod.updateNodeProp("label", e.target.value)} /></div>
            <div className="prop-group"><label className="prop-label">Tool ID</label><input className="prop-input" value={node.tool_id} disabled /></div>
            <div className="prop-group"><label className="prop-label">Enabled</label><input type="checkbox" checked={node.enabled !== false} onChange={e => mod.updateNodeProp("enabled", e.target.checked)} /></div>
            <div className="prop-group"><label className="prop-label">Notes</label><textarea className="prop-input" rows="2" value={node.notes || ""} onChange={e => mod.updateNodeProp("notes", e.target.value)} /></div>

            {!plugin && node.tool_id && !node.tool_id.startsWith("__") && plugins.length > 0 && (
                <div className="prop-desc" style={{ margin: "8px 0", color: "var(--error, #f87171)" }}>
                    Plugin <code>{node.tool_id}</code> not found. Reload plugins or check YAML.
                </div>
            )}

            {plugin && (
                <>
                    {plugin.description && <div className="prop-desc" style={{ margin: "8px 0" }}>{plugin.description}</div>}

                    <CommandTerminalWrapper node={node} plugin={plugin} termStateRef={termStateRef} mod={mod} onRender={onRender} />

                    <h3 style={{ marginTop: 14 }}>Parameters</h3>
                    {(() => {
                        // Filter hidden params and group by category
                        const visibleParams = Object.entries(plugin.params || {}).filter(([, schema]) => schema.visible !== false);
                        const paramsByCategory = {};
                        for (const [k, schema] of visibleParams) {
                            const cat = schema.category || "General";
                            if (!paramsByCategory[cat]) paramsByCategory[cat] = [];
                            paramsByCategory[cat].push([k, schema]);
                        }
                        const catNames = Object.keys(paramsByCategory);
                        return catNames.map(catName => (
                            <div key={catName}>
                                {catNames.length > 1 && (
                                    <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 8, marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        {catName}
                                    </div>
                                )}
                                {paramsByCategory[catName].map(([k, schema]) => {
                                    const val = node.params[k] !== undefined ? node.params[k] : "";
                                    const placeholder = schema.default !== undefined && schema.default !== null ? String(schema.default) : "";
                                    return (
                                        <div key={k} className="prop-group">
                                            <label className="prop-label">{schema.label || k}</label>
                                            {schema.choices?.length ? (
                                                <select className="prop-input" value={val} onChange={e => mod.updateNodeParam(k, e.target.value)}>
                                                    <option value="">-- select --</option>
                                                    {schema.choices.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            ) : schema.type === "bool" ? (
                                                <input type="checkbox" checked={val === true || val === "true"} onChange={e => mod.updateNodeParam(k, e.target.checked)} />
                                            ) : schema.type === "int" || schema.type === "float" ? (
                                                <input type="number" className="prop-input" value={val} placeholder={placeholder} min={schema.min} max={schema.max} onChange={e => mod.updateNodeParam(k, e.target.value !== "" ? parseFloat(e.target.value) : "")} />
                                            ) : schema.type === "file" ? (
                                                <div className="fp-input-row">
                                                    <input type="text" className="fp-edit prop-input" value={val} placeholder={placeholder || "file path…"} onChange={e => mod.updateNodeParam(k, e.target.value)} />
                                                    <button className="btn-small btn-browse-file" title="Browse" onClick={() => mod.doBrowseFile(val, schema.extensions?.join(",") || "", path => mod.updateNodeParam(k, path))}>&#x1F4C2;</button>
                                                </div>
                                            ) : (
                                                <input type="text" className="prop-input" value={val} placeholder={placeholder} onChange={e => mod.updateNodeParam(k, e.target.value)} />
                                            )}
                                            {schema.description && <div className="prop-desc">{schema.description}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ));
                    })()}

                    <h3 style={{ marginTop: 14 }}>Inputs</h3>
                    {Object.entries(plugin.inputs || {}).map(([k, spec]) => {
                        const val       = node.inputs_map[k] || "";
                        const resolved  = mod.resolveFullPath(val, node, "input");
                        const extStr    = spec.extensions?.join(",") || "";
                        const isDirM    = isDirMode(val);
                        const isMulti   = val && val.includes(";") && !val.startsWith("$");
                        const isEmpty   = !val;
                        const hasUpstream = incomingNodes.length > 0;

                        return (
                            <div key={k} className={`file-path-group ${spec.required && !val ? "fp-warning" : ""} ${isDirM ? "fp-dir-mode" : ""}`}>
                                <div className="fp-label">
                                    {spec.label || k} {spec.required && <span style={{ color: "var(--error)" }}>*</span>}
                                    {isDirM && <span dangerouslySetInnerHTML={{ __html: dirModeBadge() }} />}
                                    {isEmpty && hasUpstream && <span dangerouslySetInnerHTML={{ __html: autoFromUpstreamBadge() }} />}
                                    {isMulti && <span dangerouslySetInnerHTML={{ __html: multiFileBadge(val.split(";").filter(s => s.trim()).length) }} />}
                                </div>
                                {isDirM && <div className="prop-desc fp-dir-hint">All files in this directory will be processed sequentially.</div>}
                                {hasUpstream && (
                                    <select className="prop-input" style={{ marginBottom: 3 }} value={val} onChange={e => mod.updateNodeInput(k, e.target.value)}>
                                        <option value={val}>{val ? val : "-- auto from upstream / select source --"}</option>
                                        {incomingNodes.map(inc => {
                                            const incPlugin = plugins.find(p => p.id === inc.tool_id);
                                            return incPlugin ? Object.entries(incPlugin.outputs || {}).map(([outKey, outSpec]) => {
                                                const refStr = `$${inc.id}.${outKey}`;
                                                return refStr !== val && <option key={refStr} value={refStr}>{inc.label || inc.id} / {outSpec.label || outKey}</option>;
                                            }) : null;
                                        })}
                                    </select>
                                )}
                                {resolved && resolved !== val && <div className="fp-path" title="Resolved">{resolved}</div>}
                                <div className="fp-input-row">
                                    <input type="text" className="fp-edit prop-input" value={val} placeholder={isEmpty && hasUpstream ? "auto from upstream — or type path / browse" : "file path, dir/ for batch, or $node.port"} onChange={e => mod.updateNodeInput(k, e.target.value)} />
                                    <button className="btn-small btn-browse-file" title="Browse File" onClick={() => mod.doBrowseFile(val, extStr, path => mod.updateNodeInput(k, path))}>&#x1F4C4;</button>
                                    <button className={`btn-small btn-browse-dir${isDirM ? " btn-browse-dir-active" : ""}`} title="Browse Directory (batch mode)" onClick={() => mod.doBrowseDir(val, path => mod.updateNodeInput(k, path))}>&#x1F4C1;</button>
                                </div>
                                {spec.extensions?.length > 0 && <div className="prop-desc">Extensions: {spec.extensions.join(", ")}</div>}
                            </div>
                        );
                    })}

                    <h3 style={{ marginTop: 14 }}>Outputs</h3>
                    {Object.entries(plugin.outputs || {}).map(([k, spec]) => {
                        const val       = node.outputs_map[k] || "";
                        const resolved  = mod.resolveFullPath(val, node, "output");
                        const isDirM    = isDirMode(val);
                        const isEmpty   = !val;

                        return (
                            <div key={k} className={`file-path-group ${isDirM ? "fp-dir-mode" : ""} ${isEmpty ? "fp-auto-output" : ""}`}>
                                <div className="fp-label">
                                    {spec.label || k}
                                    {isDirM && <span dangerouslySetInnerHTML={{ __html: dirModeBadge() }} />}
                                    {isEmpty && <span dangerouslySetInnerHTML={{ __html: autoOutputBadge() }} />}
                                </div>
                                {isDirM ? (
                                    <div className="prop-desc fp-dir-hint">Output files will be auto-named and saved into this directory.</div>
                                ) : isEmpty && (
                                    <div className="prop-desc fp-auto-hint">Filename will be generated automatically {settingsDirs.output ? <span>in <code>{settingsDirs.output}</code></span> : "next to the input file"}. Set a path to override.</div>
                                )}
                                {resolved && resolved !== val && <div className="fp-path" title="Resolved">{resolved}</div>}
                                <div className="fp-input-row">
                                    <input type="text" className="fp-edit prop-input" value={val} placeholder="leave empty for auto-name, or set output path / dir/" onChange={e => mod.updateNodeOutput(k, e.target.value)} />
                                    <button className={`btn-small btn-browse-dir${isDirM ? " btn-browse-dir-active" : ""}`} title="Browse for output directory" onClick={() => mod.doBrowseDir(val, path => mod.updateNodeOutput(k, path))}>&#x1F4C1;</button>
                                    <button className="btn-small btn-browse-file" title="Save As — select folder then type filename" onClick={() => mod.doBrowseSave(val, path => mod.updateNodeOutput(k, path))}>&#x1F4BE;</button>
                                </div>
                                {spec.extensions?.length > 0 && <div className="prop-desc">Extensions: {spec.extensions.join(", ")}</div>}
                            </div>
                        );
                    })}

                    <PluginPaths node={node} plugin={plugin} mod={mod} store={store} />
                    <RuntimeOverride node={node} plugin={plugin} mod={mod} />
                    <InstallSection node={node} plugin={plugin} mod={mod} />
                </>
            )}
        </div>
    );
}

function EdgeProperties({ selectedEdge, mod, store, onRender }) {
    if (!selectedEdge) return null;
    
    const srcNode = mod.findNode(selectedEdge.source);
    const tgtNode = mod.findNode(selectedEdge.target);
    if (!srcNode || !tgtNode) return null;

    const plugins   = store(s => s.plugins) || [];
    const srcPlugin = plugins.find(p => p.id === srcNode.tool_id);
    const tgtPlugin = plugins.find(p => p.id === tgtNode.tool_id);

    return (
        <div>
            <h3>&#x1F517; Edge Connection</h3>
            <div className="edge-header-info">
                <div className="edge-node-badge edge-node-src">&#x25C9; {srcNode.label}</div>
                <div className="edge-arrow">&#x2794;</div>
                <div className="edge-node-badge edge-node-tgt">&#x25C9; {tgtNode.label}</div>
            </div>
            <div className="edge-ids"><span>Source: <code>{srcNode.id}</code></span> <span>Target: <code>{tgtNode.id}</code></span></div>

            <div className="settings-group-title" style={{ marginTop: 12 }}>&#x1F4E4; Source Outputs ({srcNode.label})</div>
            {srcPlugin && srcPlugin.outputs && Object.entries(srcPlugin.outputs).map(([outKey, outSpec]) => {
                const outVal   = (srcNode.outputs_map || {})[outKey] || "";
                const resolved = mod.resolveFullPath(outVal, srcNode, "output");
                const refStr   = `$${srcNode.id}.${outKey}`;
                const isDirM   = isDirMode(outVal);

                return (
                    <div key={outKey} className={`file-path-group ${isDirM ? "fp-dir-mode" : ""} ${!outVal ? "fp-auto-output" : ""}`}>
                        <div className="fp-label">
                            {outSpec.label || outKey} <code style={{ fontSize: 10, color: "var(--text-secondary)" }}>{refStr}</code>
                            {isDirM && <span dangerouslySetInnerHTML={{ __html: dirModeBadge() }} />}
                            {!outVal && <span dangerouslySetInnerHTML={{ __html: autoOutputBadge() }} />}
                        </div>
                        {resolved && resolved !== outVal && <div className="fp-path" title="Resolved">{resolved}</div>}
                        <div className="fp-input-row">
                            <input type="text" className="fp-edit prop-input" value={outVal} placeholder="leave empty for auto-name" onChange={e => mod.updateEdgeSourceOutput(srcNode.id, outKey, e.target.value)} />
                            <button className="btn-small btn-browse-file" title="Save As — select folder then type filename" onClick={() => mod.doBrowseSave(outVal, path => mod.updateEdgeSourceOutput(srcNode.id, outKey, path))}>&#x1F4BE;</button>
                            <button className={`btn-small btn-browse-dir${isDirM ? " btn-browse-dir-active" : ""}`} title="Browse for output directory" onClick={() => mod.doBrowseDir(outVal, path => mod.updateEdgeSourceOutput(srcNode.id, outKey, path))}>&#x1F4C1;</button>
                        </div>
                    </div>
                );
            })}

            <div className="settings-group-title" style={{ marginTop: 14 }}>&#x1F4E5; Target Inputs ({tgtNode.label})</div>
            <div style={{ marginBottom: 8 }}>
                <button className="btn-small" title="Auto-map by extension" onClick={() => mod.autoMapEdge(onRender)}>&#x1F504; Auto-Map</button>{" "}
                <button className="btn-small" title="Clear edge mappings" onClick={() => mod.clearEdgeMappings(onRender)}>&#x1F5D1; Clear</button>
            </div>

            {tgtPlugin && tgtPlugin.inputs && Object.entries(tgtPlugin.inputs).map(([inKey, inSpec]) => {
                const allUpstream = mod.getIncomingNodes(tgtNode.id);
                const curVal   = (tgtNode.inputs_map || {})[inKey] || "";
                const resolved = mod.resolveFullPath(curVal, tgtNode, "input");
                const isLinked = curVal.startsWith("$" + srcNode.id + ".");
                const isDirM   = isDirMode(curVal);
                const isEmpty  = !curVal;
                const isMulti  = curVal && curVal.includes(";") && !curVal.startsWith("$");
                
                return (
                    <div key={inKey} className={`file-path-group ${isLinked ? "fp-linked" : inSpec.required && !curVal ? "fp-warning" : ""} ${isDirM ? "fp-dir-mode" : ""}`}>
                        <div className="fp-label">
                            {inSpec.label || inKey} {inSpec.required && <span style={{ color: "var(--error)" }}>*</span>}
                            {isDirM && <span dangerouslySetInnerHTML={{ __html: dirModeBadge() }} />}
                            {isEmpty && <span dangerouslySetInnerHTML={{ __html: autoFromUpstreamBadge() }} />}
                            {isMulti && <span dangerouslySetInnerHTML={{ __html: multiFileBadge(curVal.split(";").filter(s => s.trim()).length) }} />}
                        </div>
                        <select className="prop-input" style={{ marginBottom: 3 }} value={curVal} onChange={e => mod.updateEdgeMapping(tgtNode.id, inKey, e.target.value)}>
                            <option value="">{curVal ? curVal : "-- auto from upstream --"}</option>
                            {allUpstream.map(upNode => {
                                const upPlugin = plugins.find(p => p.id === upNode.tool_id);
                                return upPlugin && (
                                    <optgroup key={upNode.id} label={upNode.label || upNode.id}>
                                        {Object.entries(upPlugin.outputs || {}).map(([outKey2, outSpec2]) => (
                                            <option key={`$${upNode.id}.${outKey2}`} value={`$${upNode.id}.${outKey2}`}>{outSpec2.label || outKey2}</option>
                                        ))}
                                    </optgroup>
                                );
                            })}
                        </select>
                        {resolved && resolved !== curVal && <div className="fp-path" title="Resolved">{resolved}</div>}
                        <div className="fp-input-row">
                            <input type="text" className="fp-edit prop-input" value={curVal} placeholder="auto from upstream — or $nodeId.outputKey" onChange={e => mod.updateEdgeMapping(tgtNode.id, inKey, e.target.value)} />
                            <button className="btn-small btn-browse-file" title="Browse File" onClick={() => mod.doBrowseFile(curVal, inSpec.extensions?.join(",") || "", path => mod.updateEdgeMapping(tgtNode.id, inKey, path))}>&#x1F4C4;</button>
                            <button className={`btn-small btn-browse-dir${isDirM ? " btn-browse-dir-active" : ""}`} title="Browse Directory (batch mode)" onClick={() => mod.doBrowseDir(curVal, path => mod.updateEdgeMapping(tgtNode.id, inKey, path))}>&#x1F4C1;</button>
                        </div>
                    </div>
                );
            })}
            
            <div style={{ marginTop: 12 }}>
                <button className="btn-small" style={{ background: "var(--error)" }} onClick={() => mod.deleteSelectedEdge(onRender)}>&#x1F5D1; Delete Edge</button>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   PropertiesPanel React Component
   ════════════════════════════════════════════════════════════ */

export function PropertiesPanel({ store, api, showModal, closeModal }) {
    const modRef = useRef(null);
    if (!modRef.current) modRef.current = createPropertiesModule(api, store);
    const mod = modRef.current;

    const termStateRef = useRef(null);
    if (!termStateRef.current) {
        termStateRef.current = createTerminalState();
    }

    // Internal re-render trigger — used by the Command Terminal Save action to
    // refresh the Parameters form after parsing the command back into fields.
    const [, _forceRender] = useState(0);
    const onRender = useCallback(() => _forceRender(c => c + 1), []);

    const selectedEdge   = store(s => s.selectedEdge);
    const selectedRaw    = store(s => s.selectedNode);
    // Subscribe to the full workflow object (new reference on every setWorkflow) so that
    // node mutations (params, inputs, outputs) trigger an immediate re-render and all
    // controlled inputs / checkboxes reflect their new value right away.
    const workflow       = store(s => s.workflow);
    const nodes          = workflow?.nodes || [];
    const plugins        = store(s => s.plugins || []);

    // selectedNode may be a full object or just an ID string — normalise to ID first
    const selectedNodeId = selectedRaw?.id ?? selectedRaw;
    const selectedNode   = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const plugin = selectedNode
        ? (plugins.find(p => p.id === selectedNode.tool_id) || null)
        : null;
    // Defensive: ensure node array fields are always objects (guard against stale saves)
    if (selectedNode) {
        selectedNode.params       = selectedNode.params       || {};
        selectedNode.inputs_map   = selectedNode.inputs_map   || {};
        selectedNode.outputs_map  = selectedNode.outputs_map  || {};
        selectedNode.edges        = selectedNode.edges        || [];
        selectedNode.plugin_paths = selectedNode.plugin_paths || {};
    }

    return (
        <div id="props-content" style={{ padding: "8px 12px", overflowY: "auto", flex: 1 }}>
            {selectedEdge ? (
                <EdgeProperties selectedEdge={selectedEdge} mod={mod} store={store} onRender={onRender} />
            ) : selectedNode ? (
                <NodeProperties node={selectedNode} plugin={plugin} mod={mod} store={store} termStateRef={termStateRef} onRender={onRender} />
            ) : (
                <p className="hint">Select a node or edge to view properties.</p>
            )}
        </div>
    );
}

