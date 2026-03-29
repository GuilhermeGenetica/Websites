/**
 * modules/props-io.js — SeqNode-OS I/O Field Helpers
 *
 * Exports pure functions with no GF / GF_STATE globals.
 *
 * Differences from original:
 *   - resolveInputRef(val, nodes)  — receives the node array instead of using GF.findNode()
 *   - renderIOBrowseButtons / renderOutputBrowseButtons use data-attributes
 *     instead of inline onclick; parent component uses event delegation.
 *   - openFileBrowser / openDirBrowser keep the native <input type="file"> logic
 *     (requires #gf-native-file-picker and #gf-native-dir-picker in App.jsx DOM)
 */

/* ════════════════════════════════════════════════════════════
   Directory-mode helpers
   A path ending with "/" signals directory-mode batch expansion.
   ════════════════════════════════════════════════════════════ */

export function isDirMode(val) {
    if (!val) return false;
    return val.replace(/\\/g, "/").endsWith("/");
}

export function ensureTrailingSlash(p) {
    if (!p) return p;
    const n = p.replace(/\\/g, "/");
    return n.endsWith("/") ? n : n + "/";
}

/* ════════════════════════════════════════════════════════════
   Upstream reference resolver
   Resolves "$nodeId.portKey" → actual output path of that node.
   Receives the workflow nodes array as a parameter.
   ════════════════════════════════════════════════════════════ */

export function resolveInputRef(val, nodes = []) {
    if (!val || !val.startsWith("$")) return val;
    const dotIdx = val.indexOf(".");
    if (dotIdx < 0) return val;
    const refNodeId = val.substring(1, dotIdx);
    const portKey   = val.substring(dotIdx + 1);
    const refNode   = nodes.find(n => n.id === refNodeId);
    if (refNode && refNode.outputs_map && refNode.outputs_map[portKey]) {
        return refNode.outputs_map[portKey];
    }
    return val;
}

/* ════════════════════════════════════════════════════════════
   IO field badge helpers — return HTML strings
   ════════════════════════════════════════════════════════════ */

export function dirModeBadge() {
    return '<span class="io-badge io-badge-dir" title="Directory mode: all matching files in this folder will be processed sequentially as a batch">&#x1F4C2; batch dir</span>';
}

export function autoOutputBadge() {
    return '<span class="io-badge io-badge-auto" title="Auto-naming: output filename will be generated automatically from input name. Set a directory path (ending with /) to control where files are saved.">&#x2728; auto-name</span>';
}

export function autoFromUpstreamBadge() {
    return '<span class="io-badge io-badge-upstream" title="Auto from upstream: this input will be resolved automatically from the connected upstream node\'s output at runtime.">&#x1F517; auto upstream</span>';
}

export function multiFileBadge(count) {
    return `<span class="io-badge io-badge-multi" title="Multiple files: ${count} files from batch output of upstream node">&#x1F5C2; ${count} files</span>`;
}

/* ════════════════════════════════════════════════════════════
   Browser-native File / Directory Picker
   Uses <input type="file"> elements defined in App.jsx:
     <input id="gf-native-file-picker" type="file" style="display:none" />
     <input id="gf-native-dir-picker"  type="file" style="display:none" webkitdirectory />
   ════════════════════════════════════════════════════════════ */

/**
 * openFileBrowser(targetInputId, extensions, callback, mode)
 *   targetInputId – id of the <input> to update with chosen path
 *   extensions    – comma-separated: ".bam,.cram"  (empty = all)
 *   callback      – function(path) called with the chosen path
 *   mode          – "file" (default) | "dir" | "save"
 */
export function openFileBrowser(targetInputId, extensions, callback, mode = "file") {
    if (mode === "dir" || mode === "save") {
        _pickWithNativeInput("gf-native-dir-picker", "", targetInputId, callback, mode);
    } else {
        _pickWithNativeInput("gf-native-file-picker", extensions || "", targetInputId, callback, "file");
    }
}

/** Convenience wrapper for directory-only picker. */
export function openDirBrowser(targetInputId, _initialPath, callback) {
    openFileBrowser(targetInputId, "", callback, "dir");
}

function _pickWithNativeInput(inputId, extensions, targetInputId, callback, mode) {
    const picker = document.getElementById(inputId);
    if (!picker) {
        console.error("SeqNode: picker element not found: " + inputId);
        return;
    }

    picker.accept = (mode === "file" && extensions) ? extensions : "";
    picker.value  = "";   // reset so same path can be re-selected

    function onPick(e) {
        picker.removeEventListener("change", onPick);
        const files = e.target.files;
        if (!files || !files.length) return;

        let chosen = "";

        if (mode === "dir" || mode === "save") {
            const firstFile = files[0];
            const rel = firstFile.webkitRelativePath || "";
            if (rel) {
                const parts = rel.split("/");
                // browser gives only relative path for security; use .path in Electron
                chosen = firstFile.path
                    ? firstFile.path.replace(/\\/g, "/").replace(/\/[^/]+$/, "/")
                    : "/" + parts[0] + "/";
            } else {
                chosen = firstFile.path ? firstFile.path.replace(/\\/g, "/") : "";
            }
            if (chosen && !chosen.endsWith("/")) chosen += "/";

            if (mode === "save") {
                _showSaveNamePrompt(chosen, targetInputId, callback);
                return;
            }
        } else {
            const f = files[0];
            chosen  = f.path ? f.path.replace(/\\/g, "/") : f.name;
        }

        if (!chosen) return;
        const targetEl = document.getElementById(targetInputId);
        if (targetEl) targetEl.value = chosen;
        if (callback) callback(chosen);
    }

    picker.addEventListener("change", onPick);
    picker.click();
}

/* ── Shared HTML-escape helper ── */
function _esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s || "");
    return d.innerHTML;
}

/* ── Save-as: inline overlay to enter filename after picking directory ── */
function _showSaveNamePrompt(dirPath, targetInputId, callback) {
    const PROMPT_ID = "gf-save-name-prompt";
    document.getElementById(PROMPT_ID)?.remove();

    const esc = _esc;

    const overlay = document.createElement("div");
    overlay.id = PROMPT_ID;
    overlay.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;" +
        "background:rgba(0,0,0,.65);z-index:10600;" +
        "display:flex;align-items:center;justify-content:center";

    const box = document.createElement("div");
    box.style.cssText =
        "background:var(--bg-panel,#1e1e2e);" +
        "border:1px solid var(--border,#444);border-radius:8px;" +
        "padding:20px 24px;min-width:380px;max-width:520px;" +
        "box-shadow:0 8px 32px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:12px";

    box.innerHTML =
        '<div style="font-size:13px;font-weight:600;color:var(--text,#ccc)">&#x1F4BE; Save As</div>' +
        `<div style="font-size:11px;color:var(--text-secondary,#888)">Directory: <code style="color:var(--accent,#6366f1)">${esc(dirPath)}</code></div>` +
        '<input id="gf-save-name-input" type="text" placeholder="filename.vcf" ' +
        'style="padding:6px 10px;background:var(--bg-input,#2a2a3e);border:1px solid var(--border,#444);' +
        'color:var(--text,#ccc);border-radius:4px;font-size:13px;width:100%;box-sizing:border-box">' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button id="gf-save-name-ok" style="padding:6px 18px;background:var(--accent,#6366f1);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px">&#x2714; OK</button>' +
        '<button id="gf-save-name-cancel" style="padding:6px 14px;background:var(--bg-button,#2a2a3e);color:var(--text,#ccc);border:1px solid var(--border,#444);border-radius:4px;cursor:pointer;font-size:13px">Cancel</button>' +
        '</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const nameInput = document.getElementById("gf-save-name-input");
    nameInput.focus();

    function confirm() {
        const fname = nameInput.value.trim();
        if (!fname) return;
        const full     = dirPath + fname;
        overlay.remove();
        const targetEl = document.getElementById(targetInputId);
        if (targetEl) targetEl.value = full;
        if (callback) callback(full);
    }

    document.getElementById("gf-save-name-ok").onclick     = confirm;
    document.getElementById("gf-save-name-cancel").onclick  = () => overlay.remove();
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") confirm(); });
}

/* ════════════════════════════════════════════════════════════
   Server-side File/Directory Browser Overlay
   ─────────────────────────────────────────────────────────────
   Uses /api/fs/browse (dirs only) or /api/fs/browse-files (dirs+files)
   to navigate the SERVER filesystem and return absolute paths.

   This is the only reliable approach: browser-native file pickers
   cannot return absolute server-side paths (security restriction).

   openFileBrowserOverlay(api, options, callback)
     api              — api module (with browseDir / browseDirWithFiles)
     options.mode     — "file" | "dir" | "save"
     options.initialPath — starting path (or current field value)
     options.extensions  — e.g. ".bam,.cram" (file mode only)
     callback(path)   — called with the chosen absolute path
   ════════════════════════════════════════════════════════════ */

const _FB_ID       = "gf-fb-overlay";
const _FB_STYLE_ID = "gf-fb-styles";

function _fbInitPath(val) {
    /* Extract directory from a path value so the browser opens in context.
       Empty string → server/agent picks the default workspace. */
    if (!val) return "";
    const p = val.replace(/\\/g, "/");
    if (p.endsWith("/")) return p;
    const idx = p.lastIndexOf("/");
    return idx > 0 ? p.substring(0, idx + 1) : "";
}

function _fbEnsureStyles() {
    if (document.getElementById(_FB_STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = _FB_STYLE_ID;
    s.textContent = `
/* ── Dialog shell: position:fixed, overflow:hidden, NO flex ── */
.gf-fb-dialog{
  position:fixed;overflow:hidden;
  background:var(--bg-panel,#1e1e2e);border:1px solid var(--border,#3a3a55);
  border-radius:12px;width:80vw;min-width:380px;height:80vh;min-height:280px;
  box-shadow:0 24px 72px rgba(0,0,0,.65);font-family:inherit;}

/* ── All panels anchored absolutely so they follow the dialog edges on resize ── */
.gf-fb-header{
  position:absolute;top:0;left:0;right:0;
  display:flex;align-items:center;gap:8px;
  padding:10px 14px;border-bottom:1px solid var(--border,#3a3a55);
  background:var(--bg-secondary,#16162a);
  cursor:grab;user-select:none;box-sizing:border-box;z-index:2;}
.gf-fb-header:active{cursor:grabbing;}
.gf-fb-header-title{font-size:13px;font-weight:700;color:var(--text,#e0e0f0);letter-spacing:.3px;flex:1;}
.gf-fb-header-btns{display:flex;gap:3px;flex-shrink:0;}
.gf-fb-close,.gf-fb-maximize{
  background:none;border:none;color:var(--text-secondary,#888);cursor:pointer;
  font-size:13px;padding:3px 7px;border-radius:5px;line-height:1;}
.gf-fb-close:hover,.gf-fb-maximize:hover{background:rgba(255,255,255,.08);color:var(--text,#e0e0f0);}
/* nav.top is set by JS after measuring header height */
.gf-fb-nav{
  position:absolute;left:0;right:0;
  display:flex;gap:6px;align-items:center;
  padding:8px 12px;border-bottom:1px solid var(--border,#3a3a55);
  background:var(--bg,#12121e);box-sizing:border-box;z-index:2;}
.gf-fb-up{
  background:var(--bg-secondary,#1e1e2e);border:1px solid var(--border,#3a3a55);
  color:var(--text-secondary,#aaa);cursor:pointer;border-radius:6px;
  padding:5px 10px;font-size:13px;flex-shrink:0;}
.gf-fb-up:hover{background:var(--bg-panel,#252535);color:var(--text,#e0e0f0);}
.gf-fb-path{
  flex:1;padding:5px 10px;background:var(--bg-input,#0e0e1a);
  border:1px solid var(--border,#3a3a55);color:var(--text,#e0e0f0);
  border-radius:6px;font-size:12px;font-family:monospace;
  outline:none;transition:border-color .15s;}
.gf-fb-path:focus{border-color:var(--accent,#6366f1);}
.gf-fb-go{
  background:var(--accent,#6366f1);color:#fff;border:none;
  border-radius:6px;padding:5px 14px;cursor:pointer;font-size:12px;
  font-weight:600;flex-shrink:0;}
.gf-fb-go:hover{opacity:.88;}
.gf-fb-newfolder{
  background:var(--bg-secondary,#1e1e2e);border:1px solid var(--border,#3a3a55);
  color:var(--text-secondary,#aaa);cursor:pointer;border-radius:6px;
  padding:5px 10px;font-size:12px;flex-shrink:0;white-space:nowrap;}
.gf-fb-newfolder:hover{background:var(--bg-panel,#252535);color:var(--text,#e0e0f0);}
.gf-fb-newfolder:disabled{opacity:.4;cursor:not-allowed;}
/* list.top and list.bottom are set by JS */
.gf-fb-list{
  position:absolute;left:0;right:0;overflow-y:auto;
  background:var(--bg-panel,#1e1e2e);}
.gf-fb-list::-webkit-scrollbar{width:6px;}
.gf-fb-list::-webkit-scrollbar-track{background:transparent;}
.gf-fb-list::-webkit-scrollbar-thumb{background:var(--border,#3a3a55);border-radius:3px;}
.gf-fb-entry{
  display:flex;align-items:center;gap:10px;padding:7px 16px;cursor:pointer;
  color:var(--text,#e0e0f0);font-size:13px;user-select:none;
  border-left:3px solid transparent;}
.gf-fb-entry:hover{background:rgba(99,102,241,.1);border-left-color:var(--accent,#6366f1);}
.gf-fb-entry.gf-fb-selected{background:rgba(99,102,241,.2);
  border-left-color:var(--accent,#6366f1);color:var(--accent,#6366f1);}
.gf-fb-icon{font-size:15px;flex-shrink:0;width:18px;text-align:center;}
.gf-fb-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}
.gf-fb-entry-dir .gf-fb-name{font-weight:500;}
.gf-fb-empty{padding:20px 16px;color:var(--text-secondary,#666);font-size:13px;
  text-align:center;font-style:italic;}
/* footer anchored to dialog bottom edge */
.gf-fb-footer{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;gap:8px;align-items:center;
  padding:10px 14px;border-top:1px solid var(--border,#3a3a55);
  background:var(--bg-secondary,#16162a);box-sizing:border-box;z-index:2;}
.gf-fb-info{flex:1;font-size:11px;color:var(--text-secondary,#888);font-family:monospace;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gf-fb-cancel{
  padding:6px 16px;background:transparent;
  color:var(--text-secondary,#aaa);border:1px solid var(--border,#3a3a55);
  border-radius:6px;cursor:pointer;font-size:13px;}
.gf-fb-cancel:hover{background:rgba(255,255,255,.06);color:var(--text,#e0e0f0);}
.gf-fb-ok{
  padding:6px 22px;background:var(--accent,#6366f1);color:#fff;
  border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;}
.gf-fb-ok:hover{opacity:.88;}
.gf-fb-resize{
  position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;
  background:linear-gradient(135deg,transparent 50%,var(--border,#3a3a55) 50%);
  border-bottom-right-radius:12px;z-index:3;}
/* Context menu */
.gf-fb-ctxmenu{
  position:fixed;z-index:10700;min-width:150px;
  background:var(--bg-panel,#252535);border:1px solid var(--border,#3a3a55);
  border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.5);
  padding:4px 0;font-size:13px;}
.gf-fb-ctxitem{
  padding:7px 16px;cursor:pointer;color:var(--text,#e0e0f0);display:flex;
  align-items:center;gap:8px;white-space:nowrap;}
.gf-fb-ctxitem:hover{background:rgba(99,102,241,.15);}
.gf-fb-ctxitem.danger{color:var(--error,#f87171);}
.gf-fb-ctxitem.danger:hover{background:rgba(248,113,113,.12);}
/* Light theme */
.theme-light .gf-fb-dialog{background:var(--bg-panel,#f5f5f8);border-color:var(--border,#d0d0de);}
.theme-light .gf-fb-header{background:var(--bg-secondary,#ebebf0);}
.theme-light .gf-fb-nav{background:var(--bg,#fff);}
.theme-light .gf-fb-path{background:var(--bg-input,#fff);color:var(--text,#222);border-color:var(--border,#ccc);}
.theme-light .gf-fb-up{background:var(--bg-secondary,#ebebf0);border-color:var(--border,#ccc);color:var(--text-secondary,#666);}
.theme-light .gf-fb-list{background:var(--bg-panel,#f5f5f8);}
.theme-light .gf-fb-entry{color:var(--text,#222);}
.theme-light .gf-fb-entry:hover{background:rgba(99,102,241,.08);}
.theme-light .gf-fb-entry.gf-fb-selected{background:rgba(99,102,241,.14);color:var(--accent,#6366f1);}
.theme-light .gf-fb-footer{background:var(--bg-secondary,#ebebf0);}
.theme-light .gf-fb-cancel{color:var(--text-secondary,#555);border-color:var(--border,#ccc);}
.theme-light .gf-fb-close,.theme-light .gf-fb-maximize{color:var(--text-secondary,#666);}
`;
    document.head.appendChild(s);
}

export function openFileBrowserOverlay(api, options, callback) {
    const mode       = (options && options.mode)        || "file";
    const extensions = (options && options.extensions)  || "";
    const initVal    = (options && options.initialPath) || "";

    document.getElementById(_FB_ID)?.remove();
    _fbEnsureStyles();

    const titleMap   = { file: "&#x1F4C4; Select File", dir: "&#x1F4C1; Select Directory", save: "&#x1F4BE; Select Output Folder" };
    const okLabelMap = { file: "&#x2714; Open",         dir: "&#x2714; Select",             save: "&#x2714; Select Folder" };
    const title      = titleMap[mode]   || titleMap.file;
    const okLabel    = okLabelMap[mode] || "&#x2714; OK";

    const overlay = document.createElement("div");
    overlay.id = _FB_ID;
    overlay.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;" +
        "background:rgba(0,0,0,.65);z-index:10600;";

    overlay.innerHTML =
        `<div class="gf-fb-dialog">` +

        /* Header — drag handle */
        `<div class="gf-fb-header">` +
        `<span class="gf-fb-header-title">${title}</span>` +
        `<div class="gf-fb-header-btns">` +
        `<button id="gf-fb-maximize" class="gf-fb-maximize" title="Maximize">&#x26F6;</button>` +
        `<button id="gf-fb-close" class="gf-fb-close" title="Close">&#x2715;</button>` +
        `</div></div>` +

        /* Navigation bar */
        `<div class="gf-fb-nav">` +
        `<button id="gf-fb-up" class="gf-fb-up" title="Go to parent directory">&#x2B06;</button>` +
        `<input id="gf-fb-path" class="gf-fb-path" type="text" placeholder="/" />` +
        `<button id="gf-fb-go" class="gf-fb-go">Go</button>` +
        `<button id="gf-fb-newfolder" class="gf-fb-newfolder" title="Create new folder">&#x1F4C1;+</button>` +
        `</div>` +

        /* File list */
        `<div id="gf-fb-list" class="gf-fb-list"></div>` +

        /* Footer */
        `<div class="gf-fb-footer">` +
        `<span id="gf-fb-info" class="gf-fb-info"></span>` +
        `<button id="gf-fb-cancel" class="gf-fb-cancel">Cancel</button>` +
        `<button id="gf-fb-ok" class="gf-fb-ok">${okLabel}</button>` +
        `</div>` +

        /* Resize handle — bottom-right corner */
        `<div id="gf-fb-resize" class="gf-fb-resize"></div>` +
        `</div>`;

    document.body.appendChild(overlay);

    const dialog = overlay.querySelector(".gf-fb-dialog");

    /* ── Position dialog + anchor nav and list between header and footer ── */
    requestAnimationFrame(() => {
        if (!dialog) return;
        // Centre horizontally AND vertically (80% of viewport)
        const dw = dialog.offsetWidth  || Math.round(window.innerWidth  * 0.80);
        const dh = dialog.offsetHeight || Math.round(window.innerHeight * 0.80);
        dialog.style.left = Math.max(0, (window.innerWidth  - dw) / 2) + "px";
        dialog.style.top  = Math.max(0, (window.innerHeight - dh) / 2) + "px";
        // Measure panel heights and set absolute positions
        const hdrH  = dialog.querySelector(".gf-fb-header").offsetHeight;
        const navEl = dialog.querySelector(".gf-fb-nav");
        navEl.style.top = hdrH + "px";
        const navH  = navEl.offsetHeight;
        const ftrH  = dialog.querySelector(".gf-fb-footer").offsetHeight;
        const listEl = document.getElementById("gf-fb-list");
        listEl.style.top    = (hdrH + navH) + "px";
        listEl.style.bottom = ftrH + "px";
    });

    /* ── Drag via header ── */
    const fbHeader = overlay.querySelector(".gf-fb-header");
    fbHeader.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "BUTTON") return;
        const sx = e.clientX - dialog.offsetLeft;
        const sy = e.clientY - dialog.offsetTop;
        function onMove(ev) {
            dialog.style.left = Math.max(0, Math.min(ev.clientX - sx, window.innerWidth  - 100)) + "px";
            dialog.style.top  = Math.max(0, Math.min(ev.clientY - sy, window.innerHeight - 50))  + "px";
        }
        function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup",   onUp);
            document.body.style.userSelect = "";
        }
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",   onUp);
        e.preventDefault();
    });

    /* ── Resize via bottom-right handle ── */
    document.getElementById("gf-fb-resize").addEventListener("mousedown", (e) => {
        const sx = e.clientX, sy = e.clientY;
        const sw = dialog.offsetWidth, sh = dialog.offsetHeight;
        function onMove(ev) {
            const nw = sw + (ev.clientX - sx);
            const nh = sh + (ev.clientY - sy);
            if (nw >= 380) dialog.style.width  = nw + "px";
            if (nh >= 300) { dialog.style.height = nh + "px"; dialog.style.maxHeight = "none"; }
        }
        function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup",   onUp);
            document.body.style.userSelect = "";
        }
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",   onUp);
        e.preventDefault();
        e.stopPropagation();
    });

    /* ── Maximize / Restore ── */
    let _fbMaxState = null;
    document.getElementById("gf-fb-maximize").addEventListener("click", () => {
        const maxBtn = document.getElementById("gf-fb-maximize");
        if (_fbMaxState) {
            dialog.style.left      = _fbMaxState.left;
            dialog.style.top       = _fbMaxState.top;
            dialog.style.width     = _fbMaxState.width;
            dialog.style.height    = _fbMaxState.height;
            dialog.style.maxHeight = "85vh";
            dialog.style.borderRadius = "12px";
            _fbMaxState = null;
            if (maxBtn) { maxBtn.innerHTML = "&#x26F6;"; maxBtn.title = "Maximize"; }
        } else {
            _fbMaxState = { left: dialog.style.left, top: dialog.style.top, width: dialog.style.width, height: dialog.style.height };
            dialog.style.left      = "0px";
            dialog.style.top       = "0px";
            dialog.style.width     = "100vw";
            dialog.style.height    = "100vh";
            dialog.style.maxHeight = "none";
            dialog.style.borderRadius = "0";
            if (maxBtn) { maxBtn.innerHTML = "&#x2750;"; maxBtn.title = "Restore"; }
        }
    });

    let _currentParent = null;

    /* ── Context menu (right-click: rename / delete) ── */
    let _ctxMenu = null;
    function _closeCtxMenu() { _ctxMenu?.remove(); _ctxMenu = null; }
    document.addEventListener("click",      _closeCtxMenu, { capture: true });
    document.addEventListener("contextmenu", _closeCtxMenu, { capture: false });

    function _showCtxMenu(x, y, entryEl) {
        _closeCtxMenu();
        const entryPath = entryEl.dataset.path;
        const entryName = entryEl.querySelector(".gf-fb-name")?.textContent || "";
        const menu = document.createElement("div");
        menu.className = "gf-fb-ctxmenu";
        menu.innerHTML =
            `<div class="gf-fb-ctxitem" data-action="rename">&#x270F;&#xFE0F; Rename</div>` +
            `<div class="gf-fb-ctxitem danger" data-action="delete">&#x1F5D1;&#xFE0F; Delete</div>`;
        menu.style.left = x + "px";
        menu.style.top  = y + "px";
        document.body.appendChild(menu);
        _ctxMenu = menu;

        // Keep menu inside viewport
        requestAnimationFrame(() => {
            const r = menu.getBoundingClientRect();
            if (r.right  > window.innerWidth)  menu.style.left = (x - r.width)  + "px";
            if (r.bottom > window.innerHeight)  menu.style.top  = (y - r.height) + "px";
        });

        menu.querySelector("[data-action='rename']").addEventListener("click", async (e) => {
            e.stopPropagation();
            _closeCtxMenu();
            const newName = prompt("Rename to:", entryName);
            if (!newName || !newName.trim() || newName.trim() === entryName) return;
            const sep     = entryPath.includes("\\") ? "\\" : "/";
            const dir     = entryPath.substring(0, Math.max(entryPath.lastIndexOf("/"), entryPath.lastIndexOf("\\") + 1));
            const newPath = dir.replace(/[/\\]+$/, "") + sep + newName.trim();
            try {
                await api.agentRenameFile(entryPath, newPath);
                navigate(document.getElementById("gf-fb-path")?.value?.trim() || entryPath);
            } catch (err) {
                alert("Rename failed: " + err.message);
            }
        });

        menu.querySelector("[data-action='delete']").addEventListener("click", async (e) => {
            e.stopPropagation();
            _closeCtxMenu();
            const isDir  = entryEl.dataset.type === "dir";
            const msg    = isDir
                ? `Delete folder "${entryName}" and ALL its contents?`
                : `Delete file "${entryName}"?`;
            if (!confirm(msg)) return;
            try {
                await api.agentDeleteFile(entryPath, isDir);
                navigate(document.getElementById("gf-fb-path")?.value?.trim() || entryPath);
            } catch (err) {
                alert("Delete failed: " + err.message);
            }
        });
    }

    async function navigate(path) {
        const listEl = document.getElementById("gf-fb-list");
        const pathEl = document.getElementById("gf-fb-path");
        const upBtn  = document.getElementById("gf-fb-up");
        if (!listEl) return;
        listEl.innerHTML = `<div class="gf-fb-empty">Loading&#x2026;</div>`;
        try {
            // Use agent-aware browser (routes through connected agent or falls back to VPS)
            const browseFn = mode === "file"
                ? (p) => (api.agentBrowseDirWithFiles || api.browseDirWithFiles)(p, extensions)
                : (p) => (api.agentBrowseDir         || api.browseDir)(p);
            const data = await browseFn(path);
            const curPath = data.path || path;
            _currentParent = (data.parent !== null && data.parent !== undefined) ? data.parent : null;
            if (pathEl) pathEl.value = curPath;
            if (upBtn)  upBtn.disabled = (_currentParent === null);

            let html = "";
            for (const entry of (data.entries || data.dirs || [])) {
                html += `<div class="gf-fb-entry gf-fb-entry-dir" data-path="${_esc(entry.path)}" data-type="dir">` +
                        `<span class="gf-fb-icon">&#x1F4C2;</span>` +
                        `<span class="gf-fb-name">${_esc(entry.name)}</span></div>`;
            }
            if (mode === "file") {
                for (const entry of (data.files || [])) {
                    html += `<div class="gf-fb-entry" data-path="${_esc(entry.path)}" data-type="file">` +
                            `<span class="gf-fb-icon">&#x1F4C4;</span>` +
                            `<span class="gf-fb-name">${_esc(entry.name)}</span></div>`;
                }
            }
            if (!html) html = `<div class="gf-fb-empty">Empty directory</div>`;
            listEl.innerHTML = html;

            listEl.querySelectorAll(".gf-fb-entry").forEach(el => {
                el.addEventListener("click", () => {
                    if (el.dataset.type === "dir") {
                        navigate(el.dataset.path);
                    } else {
                        listEl.querySelectorAll(".gf-fb-selected").forEach(e => e.classList.remove("gf-fb-selected"));
                        el.classList.add("gf-fb-selected");
                        const p2   = document.getElementById("gf-fb-path");
                        const info = document.getElementById("gf-fb-info");
                        if (p2)   p2.value      = el.dataset.path;
                        if (info) info.textContent = el.dataset.path;
                    }
                });
                if (el.dataset.type === "file") el.addEventListener("dblclick", doConfirm);
                el.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    _showCtxMenu(e.clientX, e.clientY, el);
                });
            });
        } catch (e) {
            if (listEl) listEl.innerHTML = `<div class="gf-fb-empty" style="color:var(--error,#f87171)">Error: ${_esc(String(e))}</div>`;
        }
    }

    function doConfirm() {
        const pathEl = document.getElementById("gf-fb-path");
        if (!pathEl) return;
        let p = pathEl.value.trim();
        if (!p) return;
        p = p.replace(/\\/g, "/");
        _closeBrowser();
        if (mode === "dir") {
            if (!p.endsWith("/")) p += "/";
            callback(p);
        } else if (mode === "save") {
            if (!p.endsWith("/")) p += "/";
            _showSaveNamePrompt(p, null, callback);
        } else {
            callback(p);
        }
    }

    document.getElementById("gf-fb-up").onclick = () => {
        if (_currentParent !== null) navigate(_currentParent);
    };
    document.getElementById("gf-fb-go").onclick = () => {
        const p = document.getElementById("gf-fb-path")?.value?.trim();
        if (p) navigate(p);
    };
    document.getElementById("gf-fb-path").addEventListener("keydown", e => {
        if (e.key === "Enter") { const p = e.target.value.trim(); if (p) navigate(p); }
    });
    document.getElementById("gf-fb-newfolder").onclick = async () => {
        const currentPath = document.getElementById("gf-fb-path")?.value?.trim();
        if (!currentPath) return;
        const name = prompt("New folder name:");
        if (!name || !name.trim()) return;
        const safeName = name.trim().replace(/[/\\:*?"<>|]/g, "_");
        const sep      = currentPath.includes("\\") ? "\\" : "/";
        const newPath  = currentPath.replace(/[/\\]+$/, "") + sep + safeName;
        const btn      = document.getElementById("gf-fb-newfolder");
        if (btn) btn.disabled = true;
        try {
            if (api.agentMkdir) {
                await api.agentMkdir(newPath);
            } else {
                await api.mkdir(newPath);
            }
            navigate(currentPath);
        } catch (e) {
            alert("Could not create folder: " + e.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    };
    function _closeBrowser() { _closeCtxMenu(); document.removeEventListener("click", _closeCtxMenu, { capture: true }); overlay.remove(); }
    document.getElementById("gf-fb-ok").onclick     = doConfirm;
    document.getElementById("gf-fb-close").onclick  = _closeBrowser;
    document.getElementById("gf-fb-cancel").onclick = _closeBrowser;
    overlay.addEventListener("click", e => { if (e.target === overlay) _closeBrowser(); });

    navigate(_fbInitPath(initVal));
}

export { _fbInitPath };

/* ════════════════════════════════════════════════════════════
   Browse button HTML renderers
   Use data-attributes for event delegation in the parent component.
   The props-update component listens for clicks on [data-browse-file],
   [data-browse-dir] and [data-save-as] and calls openFileBrowser().
   ════════════════════════════════════════════════════════════ */

/**
 * renderIOBrowseButtons — HTML string com file + dir browse buttons para input field.
 *   inputElId – id do <input> alvo
 *   extStr    – extensões ex: ".bam,.cram"
 *   isDirM    – true se o campo já está em modo directório
 */
export function renderIOBrowseButtons(inputElId, extStr, isDirM) {
    const safeId  = inputElId.replace(/"/g, "&quot;");
    const safeExt = (extStr || "").replace(/"/g, "&quot;");
    return (
        `<button class="btn-small btn-browse-file" ` +
            `data-browse-file data-input-id="${safeId}" data-ext="${safeExt}" ` +
            `title="Browse for file">&#x1F4C4;</button>` +
        `<button class="btn-small btn-browse-dir${isDirM ? " btn-browse-dir-active" : ""}" ` +
            `data-browse-dir data-input-id="${safeId}" ` +
            `title="Browse for directory (batch mode — all files in folder will be processed)">&#x1F4C1;</button>`
    );
}

/**
 * renderOutputBrowseButtons — HTML string com save-as + dir buttons para output field.
 *   outputElId – id do <input> alvo
 *   isDirM     – true se o campo já está em modo directório
 */
export function renderOutputBrowseButtons(outputElId, isDirM) {
    const safeId = outputElId.replace(/"/g, "&quot;");
    return (
        `<button class="btn-small btn-browse-file" ` +
            `data-save-as data-input-id="${safeId}" ` +
            `title="Browse / Save As">&#x1F4BE;</button>` +
        `<button class="btn-small btn-browse-dir${isDirM ? " btn-browse-dir-active" : ""}" ` +
            `data-browse-dir data-input-id="${safeId}" ` +
            `title="Browse for output directory — files will be auto-named inside this folder">&#x1F4C1;</button>`
    );
}

export default {
    isDirMode,
    ensureTrailingSlash,
    resolveInputRef,
    dirModeBadge,
    autoOutputBadge,
    autoFromUpstreamBadge,
    multiFileBadge,
    openFileBrowser,
    openDirBrowser,
    renderIOBrowseButtons,
    renderOutputBrowseButtons,
};
