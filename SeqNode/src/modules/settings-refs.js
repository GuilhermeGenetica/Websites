/**
 * modules/settings-refs.js — SeqNode-OS References & Libraries Tab
 *
 * Exports createSettingsRefsModule(api, store, showModal, closeModal) — factory with:
 *   loadReferencesTab()          — load catalog into the #refs-content element
 *   startRefDownload(refId)      — start download and poll progress
 *   handleDownloadProgressEvent  — called by the WebSocket handler
 *   showAddReferenceDialog()
 *   submitAddReference()
 *   showConfigureRefDialog(refId)
 *   submitConfigureRef(refId, category)
 *   removeCustomRef(refId)
 */

import { openFileBrowserOverlay } from "./props-io.js";

export function createSettingsRefsModule(api, store, showModal, closeModal) {

    /* ── References tab loader ── */
    async function loadReferencesTab() {
        const el = document.getElementById("refs-content");
        if (!el) return;
        el.innerHTML = '<p style="color:var(--text-secondary);font-size:12px">Loading catalog...</p>';
        try {
            const data = await api.getReferences();
            if (data.offline) {
                el.innerHTML = '<p style="color:var(--text-secondary)">References catalog unavailable in offline mode.</p>';
                return;
            }
            el.innerHTML = _buildRefsHtml(data);
            _attachRefsEvents(el);
        } catch (e) {
            el.innerHTML = '<p style="color:var(--error)">Error loading catalog: ' + _esc(String(e)) + '</p>';
        }
    }

    /* ── References HTML builder ── */
    function _buildRefsHtml(catalog) {
        const s    = store.getState().settings;
        let html   = '';
        html += '<div class="settings-group-title">References &amp; Bioinformatics Libraries</div>';
        html += '<div class="settings-desc">Base directory: <code>' + _esc(s.dirs.references || "/data/references") + '</code>. '
            + 'Downloaded files are placed in subdirectories relative to this base.</div>';
        html += '<div style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap">';
        html += '<button class="btn-small" data-refs-refresh>&#x1F504; Refresh Status</button>';
        html += '<button class="btn-small" data-refs-change-base>&#x1F4C2; Change Base Dir</button>';
        html += '<button class="btn-small" data-refs-add-custom style="background:var(--success);border-color:var(--success)">&#x2795; Add Custom Library</button>';
        html += '</div>';

        const LABELS = {
            genomes:    "&#x1F9EC; Genome Sequences",
            annotation: "&#x1F4CB; Annotation Databases",
            tool_dbs:   "&#x1F527; Tool Databases",
            custom:     "&#x1F4E6; Custom Libraries",
        };

        for (const [cat, refs] of Object.entries(catalog)) {
            html += '<div class="settings-group-title">' + (LABELS[cat] || _esc(cat)) + '</div>';
            html += '<div class="refs-grid">';
            for (const [refId, info] of Object.entries(refs)) {
                const installed = info.installed;
                const dlStatus  = info.download_status || "idle";
                const progress  = info.download_progress || 0;
                const isCustom  = !!info.custom;

                html += '<div class="ref-card' + (installed ? " ref-installed" : "") + '" id="refcard-' + _esc(refId) + '">';
                html += '<div class="ref-card-title">' + _esc(info.label) + '</div>';
                html += '<div class="ref-card-build">Build: <code>' + _esc(info.build || "N/A") + '</code></div>';
                html += '<div class="ref-card-path" title="Destination">' + _esc(info.dest_dir || "") + '</div>';

                if (installed) {
                    html += '<div class="ref-status installed">&#x2714; Installed</div>';
                    if (info.index_ok === false)
                        html += '<div class="ref-status warn">&#x26A0; Index files missing</div>';
                } else if (dlStatus === "downloading") {
                    html += '<div class="ref-status downloading">&#x23F3; Downloading ' + progress + '%</div>';
                    html += '<div class="ref-progress-bar"><div style="width:' + progress + '%"></div></div>';
                } else if (dlStatus === "error") {
                    html += '<div class="ref-status error">&#x2718; Error: ' + _esc(info.download_message || "") + '</div>';
                } else {
                    html += '<div class="ref-status missing">&#x2610; Not installed</div>';
                }

                html += '<div class="ref-card-actions">';
                if (!installed) {
                    html += '<button class="btn-small" data-ref-download="' + _esc(refId) + '" '
                        + (dlStatus === "downloading" ? "disabled" : "") + '>&#x2B07; Download</button> ';
                }
                html += '<button class="btn-small" data-ref-configure="' + _esc(refId) + '" title="Configure this reference">&#x2699;</button> ';
                html += '<button class="btn-small" data-ref-browse-dest="' + _esc(info.dest_dir || s.dirs.references || "/") + '" title="Browse destination">&#x1F4C2;</button>';
                if (isCustom) {
                    html += ' <button class="btn-small" data-ref-remove="' + _esc(refId) + '" '
                        + 'style="background:var(--error);border-color:var(--error)" title="Remove this custom reference">&#x1F5D1;</button>';
                }
                html += '</div>';
                html += '<div id="ref-msg-' + _esc(refId) + '" class="ref-dl-msg">' + _esc(info.download_message || "") + '</div>';
                html += '</div>';
            }
            html += '</div>';
        }
        return html;
    }

    function _attachRefsEvents(el) {
        el.querySelector("[data-refs-refresh]")?.addEventListener("click", () => loadReferencesTab());
        el.querySelector("[data-refs-add-custom]")?.addEventListener("click", () => showAddReferenceDialog());

        el.querySelector("[data-refs-change-base]")?.addEventListener("click", () => {
            const s = store.getState().settings;
            openDirBrowser(null, s.dirs.references || "/", (p) => {
                store.getState().updateSetting("dirs.references", p);
                loadReferencesTab();
            });
        });

        el.querySelectorAll("[data-ref-download]").forEach(btn => {
            btn.addEventListener("click", () => startRefDownload(btn.getAttribute("data-ref-download")));
        });
        el.querySelectorAll("[data-ref-configure]").forEach(btn => {
            btn.addEventListener("click", () => showConfigureRefDialog(btn.getAttribute("data-ref-configure")));
        });
        el.querySelectorAll("[data-ref-browse-dest]").forEach(btn => {
            btn.addEventListener("click", () => openDirBrowser(null, btn.getAttribute("data-ref-browse-dest"), null));
        });
        el.querySelectorAll("[data-ref-remove]").forEach(btn => {
            btn.addEventListener("click", () => removeCustomRef(btn.getAttribute("data-ref-remove")));
        });
    }

    /* ── Add custom reference dialog ── */
    function showAddReferenceDialog() {
        let html = '<div class="settings-group-title">Add Custom Reference / Library</div>';
        html += '<div class="settings-desc">Add a custom bioinformatics reference, annotation database, or tool library to the catalog.</div>';
        html += '<div class="settings-row"><label>Reference ID</label><input type="text" id="addref-id" placeholder="my_custom_ref"></div>';
        html += '<div class="settings-row"><label>Display Name</label><input type="text" id="addref-label" placeholder="My Custom Reference"></div>';
        html += '<div class="settings-row"><label>Category</label>'
            + '<select id="addref-category">'
            + '<option value="genomes">Genome Sequences</option>'
            + '<option value="annotation">Annotation Databases</option>'
            + '<option value="tool_dbs">Tool Databases</option>'
            + '<option value="custom" selected>Custom Libraries</option>'
            + '</select></div>';
        html += '<div class="settings-row"><label>Download URL</label><input type="text" id="addref-url" placeholder="https://..."></div>';
        html += '<div class="settings-row"><label>Filename</label><input type="text" id="addref-filename" placeholder="reference.fa.gz"></div>';
        html += '<div class="settings-row"><label>Subdirectory</label><input type="text" id="addref-subdir" placeholder="custom/my_ref"></div>';
        html += '<div class="settings-row"><label>Genome Build</label><input type="text" id="addref-build" placeholder="hg38"></div>';
        html += '<div class="settings-row"><label>Index Files (comma-separated)</label><input type="text" id="addref-index" placeholder="ref.fa.fai,ref.fa.bwt"></div>';
        const footer = '<button data-modal-close>Cancel</button> '
            + '<button data-addref-submit style="background:var(--success)">&#x2714; Add Reference</button>';
        showModal("Add Custom Reference", html, footer, (modalEl) => {
            modalEl?.querySelector("[data-modal-close]")?.addEventListener("click", () => closeModal());
            modalEl?.querySelector("[data-addref-submit]")?.addEventListener("click", () => submitAddReference());
        });
    }

    async function submitAddReference() {
        const refId     = (document.getElementById("addref-id")?.value      || "").trim();
        const label     = (document.getElementById("addref-label")?.value   || "").trim();
        const category  = document.getElementById("addref-category")?.value  || "custom";
        const url       = (document.getElementById("addref-url")?.value     || "").trim();
        const filename  = (document.getElementById("addref-filename")?.value || "").trim();
        const subdir    = (document.getElementById("addref-subdir")?.value   || "").trim();
        const build     = (document.getElementById("addref-build")?.value    || "").trim();
        const indexStr  = (document.getElementById("addref-index")?.value    || "").trim();
        const indexFiles = indexStr ? indexStr.split(",").map(s => s.trim()).filter(Boolean) : [];

        if (!refId || !label || !url || !filename) {
            alert("Reference ID, Display Name, Download URL, and Filename are required.");
            return;
        }
        try {
            const data = await api.addCustomReference({
                ref_id:      refId,
                label,
                category,
                url,
                filename,
                subdir:      subdir || ("custom/" + refId),
                build:       build || "unknown",
                index_files: indexFiles,
            });
            if (data.status === "added" || data.status === "updated") {
                closeModal();
                setTimeout(() => loadReferencesTab(), 100);
            } else {
                alert("Error: " + JSON.stringify(data));
            }
        } catch (e) {
            alert("Error adding reference: " + e);
        }
    }

    /* ── Configure reference dialog ── */
    function showConfigureRefDialog(refId) {
        api.getReferences().then(catalog => {
            let info = null, foundCat = "";
            for (const [cat, refs] of Object.entries(catalog)) {
                if (refs[refId]) { info = refs[refId]; foundCat = cat; break; }
            }
            if (!info) { alert("Reference not found: " + refId); return; }

            let html = '<div class="settings-group-title">Configure: ' + _esc(info.label) + '</div>';
            html += '<div class="settings-row"><label>Reference ID</label><input type="text" value="' + _esc(refId) + '" disabled></div>';
            html += '<div class="settings-row"><label>Display Name</label><input type="text" id="cfgref-label" value="' + _esc(info.label || "") + '"></div>';
            html += '<div class="settings-row"><label>Download URL</label><input type="text" id="cfgref-url" value="' + _esc(info.url || "") + '"></div>';
            html += '<div class="settings-row"><label>Filename</label><input type="text" id="cfgref-filename" value="' + _esc(info.filename || "") + '"></div>';
            html += '<div class="settings-row"><label>Subdirectory</label><input type="text" id="cfgref-subdir" value="' + _esc(info.subdir || "") + '"></div>';
            html += '<div class="settings-row"><label>Genome Build</label><input type="text" id="cfgref-build" value="' + _esc(info.build || "") + '"></div>';
            html += '<div class="settings-row"><label>Index Files</label><input type="text" id="cfgref-index" value="' + _esc((info.index_files || []).join(", ")) + '"></div>';
            html += '<div class="settings-row"><label>Installed Path</label><input type="text" value="' + _esc(info.path || info.dest_dir || "") + '" disabled></div>';

            const footer = '<button data-modal-close>Cancel</button> '
                + '<button data-cfgref-submit style="background:var(--success)">&#x2714; Save Changes</button>';
            showModal("Configure Reference", html, footer, (modalEl) => {
                modalEl?.querySelector("[data-modal-close]")?.addEventListener("click", () => closeModal());
                modalEl?.querySelector("[data-cfgref-submit]")?.addEventListener("click", () =>
                    submitConfigureRef(refId, foundCat));
            });
        });
    }

    async function submitConfigureRef(refId, category) {
        const label      = (document.getElementById("cfgref-label")?.value    || "").trim();
        const url        = (document.getElementById("cfgref-url")?.value      || "").trim();
        const filename   = (document.getElementById("cfgref-filename")?.value || "").trim();
        const subdir     = (document.getElementById("cfgref-subdir")?.value   || "").trim();
        const build      = (document.getElementById("cfgref-build")?.value    || "").trim();
        const indexStr   = (document.getElementById("cfgref-index")?.value    || "").trim();
        const indexFiles = indexStr ? indexStr.split(",").map(s => s.trim()).filter(Boolean) : [];

        try {
            const data = await api.configureReference(refId, category, { label, url, filename, subdir, build, index_files: indexFiles });
            if (data.status === "configured") {
                closeModal();
                setTimeout(() => loadReferencesTab(), 100);
            } else {
                alert("Error: " + JSON.stringify(data));
            }
        } catch (e) {
            alert("Error configuring reference: " + e);
        }
    }

    /* ── Remove custom reference ── */
    async function removeCustomRef(refId) {
        if (!confirm("Remove custom reference '" + refId + "' from the catalog? Files on disk will NOT be deleted.")) return;
        try {
            const data = await api.removeCustomReference(refId);
            if (data.status === "removed") {
                loadReferencesTab();
            } else {
                alert("Error: " + JSON.stringify(data));
            }
        } catch (e) {
            alert("Error removing reference: " + e);
        }
    }

    /* ── Download & progress ── */
    async function startRefDownload(refId) {
        const card = document.getElementById("refcard-" + refId);
        if (card) {
            const btn = card.querySelector(".ref-card-actions button");
            if (btn) btn.disabled = true;
        }
        try {
            await api.startDownload(refId);
            _pollDownloadProgress(refId);
        } catch (e) {
            console.error("Download error:", e);
        }
    }

    function _pollDownloadProgress(refId) {
        const iv = setInterval(async () => {
            try {
                const data = await api.getDownloadProgress();
                const task = data[refId];
                if (!task) { clearInterval(iv); return; }
                const msgEl = document.getElementById("ref-msg-" + refId);
                if (msgEl) msgEl.textContent = task.message || "";
                if (task.status === "completed" || task.status === "error" || task.status === "cancelled") {
                    clearInterval(iv);
                    loadReferencesTab();
                }
            } catch (_) { clearInterval(iv); }
        }, 1500);
    }

    function handleDownloadProgressEvent(refId, status, progress, message) {
        const msgEl = document.getElementById("ref-msg-" + refId);
        if (msgEl) msgEl.textContent = message || "";
        if (status === "completed" || status === "error" || status === "cancelled") {
            loadReferencesTab();
        }
    }

    /* ── Server-side directory browser (never uses native browser picker) ── */
    function openDirBrowser(_targetInputId, initialPath, callback) {
        openFileBrowserOverlay(
            api,
            { mode: "dir", initialPath: initialPath || "/" },
            callback || (() => {})
        );
    }

    return {
        loadReferencesTab,
        startRefDownload,
        handleDownloadProgressEvent,
        showAddReferenceDialog,
        submitAddReference,
        showConfigureRefDialog,
        submitConfigureRef,
        removeCustomRef,
    };
}

function _esc(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export default { createSettingsRefsModule };
