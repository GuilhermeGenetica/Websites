/**
 * modules/ui.jsx — SeqNode-OS UI Components & Utilities
 *
 * Exports:
 * - useModal()     — hook with modal state (supports component mode)
 * - Modal          — draggable + resizable modal (individual props)
 * - LogPanel       — log panel with header, toggle, expand, clear
 * - StatusBadge    — execution status badge
 */

import React, { useState, useRef, useEffect, useCallback } from "react";

/* ════════════════════════════════════════════════════════════
   useModal hook
   ════════════════════════════════════════════════════════════ */

export function useModal() {
    const [modal, setModal] = useState({
        open:         false,
        title:        "",
        body:         "",
        footer:       "",
        onSetup:      null,
        useComponent: false,
    });

    // showModal(title, bodyHtml, footerHtml, onSetup, _unused, useComponent)
    const showModal = useCallback((title, bodyHtml, footerHtml, onSetup, _unused, useComponent) => {
        setModal({
            open:         true,
            title:        title        || "",
            body:         bodyHtml     || "",
            footer:       footerHtml   || "",
            onSetup:      onSetup      || null,
            useComponent: !!useComponent,
        });
    }, []);

    const closeModal = useCallback(() => {
        setModal(m => ({ ...m, open: false, body: "", footer: "", onSetup: null, useComponent: false }));
    }, []);

    return { modal, showModal, closeModal };
}

/* ════════════════════════════════════════════════════════════
   Modal Component — draggable, resizable
   Props: title, body, footer, onClose, onSetup, useComponent
   ════════════════════════════════════════════════════════════ */

export function Modal({ title, body, footer, onClose, onSetup, useComponent }) {
    const boxRef      = useRef(null);
    const dragState   = useRef({ active: false, offsetX: 0, offsetY: 0 });
    const resizeState = useRef({ active: false, startX: 0, startY: 0, startW: 0, startH: 0 });
    const [maximized, setMaximized] = useState(false);

    // Open at 90% of screen, centred, with scroll if content overflows
    useEffect(() => {
        setMaximized(false);
        const box = boxRef.current;
        if (!box) return;
        box.style.left = box.style.top = box.style.width = box.style.height = "";
        box.style.maxWidth  = "none";
        box.style.maxHeight = "none";
        requestAnimationFrame(() => {
            if (!boxRef.current) return;
            const targetW = Math.round(window.innerWidth  * 0.90);
            const targetH = Math.round(window.innerHeight * 0.90);
            const finalH  = Math.max(targetH, 400);
            box.style.width  = targetW + "px";
            box.style.height = finalH  + "px";
            box.style.left   = Math.max(0, (window.innerWidth  - targetW) / 2) + "px";
            box.style.top    = Math.max(0, (window.innerHeight - finalH)   / 2) + "px";
        });
    }, [title]);

    // Run onSetup after body renders
    useEffect(() => {
        if (onSetup && boxRef.current && !useComponent) onSetup(boxRef.current);
    }, [onSetup, body, useComponent]);

    // Global drag + resize
    useEffect(() => {
        const onMove = (e) => {
            const ds  = dragState.current;
            const rs  = resizeState.current;
            const box = boxRef.current;
            if (!box) return;
            if (ds.active) {
                let x = Math.max(0, Math.min(e.clientX - ds.offsetX, window.innerWidth  - 100));
                let y = Math.max(0, Math.min(e.clientY - ds.offsetY, window.innerHeight - 50));
                box.style.left = x + "px";
                box.style.top  = y + "px";
            }
            if (rs.active) {
                const nw = rs.startW + (e.clientX - rs.startX);
                const nh = rs.startH + (e.clientY - rs.startY);
                if (nw >= 480) { box.style.width    = nw + "px"; box.style.maxWidth  = "none"; }
                if (nh >= 280) { box.style.height   = nh + "px"; box.style.maxHeight = "none"; }
            }
        };
        const onUp = () => {
            dragState.current.active   = false;
            resizeState.current.active = false;
            document.body.style.userSelect = "";
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",   onUp);
        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup",   onUp);
        };
    }, []);

    const onHeaderDown = useCallback((e) => {
        if (e.target.tagName === "BUTTON") return;
        const box = boxRef.current;
        if (!box) return;
        dragState.current = { active: true, offsetX: e.clientX - box.offsetLeft, offsetY: e.clientY - box.offsetTop };
        document.body.style.userSelect = "none";
        e.preventDefault();
    }, []);

    const onResizerDown = useCallback((e) => {
        const box = boxRef.current;
        if (!box) return;
        resizeState.current = { active: true, startX: e.clientX, startY: e.clientY, startW: box.offsetWidth, startH: box.offsetHeight };
        document.body.style.userSelect = "none";
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const toggleMaximize = useCallback(() => {
        const box = boxRef.current;
        if (!box) return;
        if (maximized) {
            setMaximized(false);
            box.style.left = box._rl || ""; box.style.top    = box._rt || "";
            box.style.width = box._rw || ""; box.style.height  = box._rh || "";
            box.style.maxWidth = "92vw"; box.style.maxHeight = "92vh";
        } else {
            box._rl = box.style.left; box._rt = box.style.top;
            box._rw = box.style.width; box._rh = box.style.height;
            setMaximized(true);
            box.style.left = "0px"; box.style.top  = "0px";
            box.style.width = "100vw"; box.style.height = "100vh";
            box.style.maxWidth = "none"; box.style.maxHeight = "none";
        }
    }, [maximized]);

    return (
        <div id="modal-overlay" className="modal-visible">
            <div id="modal-box" ref={boxRef} className={maximized ? "modal-maximized" : ""}>
                <div id="modal-header" onMouseDown={onHeaderDown}>
                    <span id="modal-title" dangerouslySetInnerHTML={{ __html: title }} />
                    <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={toggleMaximize} title="Maximize">&#x26F6;</button>
                        <button onClick={onClose} title="Close">&#x2715;</button>
                    </div>
                </div>
                
                <div id="modal-body" style={{ overflow: "auto", flex: 1 }}>
                    {useComponent ? body : <div dangerouslySetInnerHTML={{ __html: body }} />}
                </div>

                {footer && (
                    <div id="modal-footer">
                        {useComponent ? footer : <div dangerouslySetInnerHTML={{ __html: footer }} />}
                    </div>
                )}
                
                <div id="modal-resizer" onMouseDown={onResizerDown} />
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   StatusBadge Component
   Recebe status: "IDLE" | "RUNNING" | "COMPLETED" | "FAILED"
   ════════════════════════════════════════════════════════════ */

export function StatusBadge({ status }) {
    const cls = status ? status.toLowerCase() : "";
    return (
        <span id="status-badge" className={"badge " + cls}>
            {status || "IDLE"}
        </span>
    );
}

/* ════════════════════════════════════════════════════════════
   LogPanel Component
   Inclui #log-resizer (acima), #log-panel com header + conteúdo.
   Props: logs, expanded, expandedFull, onToggle, onExpand, onClear
   ════════════════════════════════════════════════════════════ */

// Patterns that indicate an admin/debug-level log entry to hide in compact mode.
// These match against entry.message only (no source prefix).
const ADMIN_PATTERNS = [
    /^Resolved params:/i,
    /^Resolved inputs:/i,
    /^Resolved outputs:/i,
    /^inputs_map:/i,
    /^outputs_map:/i,
    /^Working directory:/i,
    /^Conda environment:/i,
    /^Conda binary:/i,
    /^WebSocket connected/i,
    /^Node [^\s]+.*: (RUNNING|SKIPPED|PENDING)/i,
    /^Execution Summary:/i,
    /^\[Batch \d+\/\d+\] Inputs:/i,
    /^\[Batch \d+\/\d+\] Outputs:/i,
];

function _isAdminLog(entry) {
    const msg = entry.message || "";
    return ADMIN_PATTERNS.some(rx => rx.test(msg));
}

export function LogPanel({ logs = [], expanded = true, expandedFull = false, onToggle, onExpand, onClear }) {
    const contentRef  = useRef(null);
    const panelRef    = useRef(null);
    const resizerRef  = useRef(null);
    const [logMode, setLogMode] = useState("full"); // "full" | "compact"

    const visibleLogs = logMode === "compact"
        ? logs.filter(e => e.level === "ERROR" || e.level === "WARN" || !_isAdminLog(e))
        : logs;

    // Auto-scroll to bottom
    useEffect(() => {
        if (contentRef.current && expanded) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [logs, expanded]);

    // Vertical resizer (drag up/down)
    useEffect(() => {
        const resizer = resizerRef.current;
        const panel   = panelRef.current;
        if (!resizer || !panel) return;
        let isR = false, startY = 0, startH = 0;
        const onDown = (e) => {
            isR = true; startY = e.clientY; startH = panel.offsetHeight;
            document.body.style.cursor = "ns-resize";
            document.body.style.userSelect = "none";
            e.preventDefault();
        };
        const onMove = (e) => {
            if (!isR) return;
            const newH = startH + (startY - e.clientY);
            if (newH > 36 && newH < window.innerHeight - 120) {
                panel.style.height = newH + "px";
                panel.classList.remove("log-collapsed", "log-expanded-full");
            }
        };
        const onUp = () => {
            if (isR) { isR = false; document.body.style.cursor = document.body.style.userSelect = ""; }
        };
        resizer.addEventListener("mousedown", onDown);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",   onUp);
        return () => {
            resizer.removeEventListener("mousedown", onDown);
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup",   onUp);
        };
    }, []);

    const panelClass = [
        "log-panel-wrap",
        !expanded       ? "log-collapsed"      : "",
        expandedFull    ? "log-expanded-full"   : "",
    ].join(" ").trim();

    return (
        <>
            <div id="log-resizer" ref={resizerRef} />
            <div id="log-panel" ref={panelRef} className={panelClass}>
                <div className="log-header">
                    <span>&#x1F4CB; Execution Log</span>
                    <div className="log-header-buttons">
                        <button
                            className={"btn-small" + (logMode === "compact" ? " log-mode-active" : "")}
                            title="Compact — show command output and errors only"
                            onClick={() => setLogMode(m => m === "compact" ? "full" : "compact")}
                        >
                            {logMode === "compact" ? "\uD83D\uDCE2 Compact" : "\uD83D\uDCDC Full"}
                        </button>
                        <button className="btn-small" onClick={onClear}>Clear</button>
                        <button className="btn-small" id="log-expand" title="Expand"
                            onClick={onExpand}>&#x2B1C;</button>
                        <button className="btn-small" id="log-toggle" title="Minimize"
                            onClick={onToggle}>
                            {expanded ? "\u25BC" : "\u25B2"}
                        </button>
                    </div>
                </div>
                <div id="log-content" ref={contentRef}>
                    {visibleLogs.map((e, i) => {
                        const ts  = e.ts ? new Date(e.ts).toLocaleTimeString() : "";
                        const cls = e.level === "ERROR" ? "error" : e.level === "WARN" ? "warn" : "info";
                        return (
                            <div key={i} className={"log-line " + cls}>
                                [{ts}] [{e.source || "system"}] {e.message}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default { Modal, LogPanel, StatusBadge, useModal };