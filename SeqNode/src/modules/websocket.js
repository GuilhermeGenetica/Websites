/**
 * modules/websocket.js — SeqNode-OS WebSocket Client
 *
 * Only change from original: hardcoded URL → imports WS_URL from config.js.
 * Accepts callbacks for log, statusChange, nodeStatus, pauseRequest,
 * retryProgress and downloadProgress — identical dispatch to original.
 */

import { WS_URL } from "../config.js";

let _ws               = null;
let _reconnectTimer   = null;
let _callbacks        = {};

/**
 * Register callbacks for the various message types.
 * Each module calls registerHandlers() with the functions it wants to receive.
 *
 * @param {object} handlers  e.g. { onLog, onStatusChange, onNodeStatus,
 *                                   onPauseRequest, onRetryProgress,
 *                                   onDownloadProgress }
 */
export function registerHandlers(handlers) {
    _callbacks = Object.assign(_callbacks, handlers);
}

export function getWs() { return _ws; }

export function setupWebSocket() {
    if (_reconnectTimer) {
        clearTimeout(_reconnectTimer);
        _reconnectTimer = null;
    }

    // WS_URL já inclui o protocolo (ws:// ou wss://) vindo do config.js
    const url = WS_URL.endsWith("/ws") ? WS_URL : WS_URL.replace(/\/$/, "") + "/ws";

    try {
        if (_ws && _ws.readyState <= 1) {
            _ws.onclose = null; // prevent auto-reconnect timer from firing on intentional close
            _ws.close();
        }

        _ws = new WebSocket(url + "/logs");

        _ws.onopen = () => {
            _callbacks.onLog?.("engine", "INFO", "WebSocket connected.");
        };

        _ws.onmessage = (ev) => {
            try {
                const d       = JSON.parse(ev.data);
                const msgType = d.type || "log";

                if (msgType === "log") {
                    _callbacks.onLog?.(d.node_id || "system", d.level || "INFO", d.message || "");
                    return;
                }
                if (msgType === "status_change") {
                    _callbacks.onStatusChange?.(d.status || "", d.run_id || "");
                    _callbacks.onLog?.("engine", "INFO",
                        "Status change: " + (d.status || "") +
                        (d.run_id ? " (run: " + d.run_id + ")" : ""));
                    return;
                }
                if (msgType === "node_status") {
                    _callbacks.onNodeStatus?.(d.node_id || "", d.status || "", d.run_id || "");
                    _callbacks.onLog?.(d.node_id || "engine", "INFO",
                        "Node " + d.node_id + ": " + d.status +
                        (d.run_id ? " (run: " + d.run_id + ")" : ""));
                    return;
                }
                if (msgType === "pause_request") {
                    _callbacks.onPauseRequest?.(
                        d.run_id  || "",
                        d.node_id || "",
                        d.message || "Workflow paused — waiting for approval."
                    );
                    return;
                }
                if (msgType === "retry_progress") {
                    _callbacks.onRetryProgress?.(d);
                    _callbacks.onLog?.(d.node_id || "engine", "WARN",
                        "[RETRY] " + d.node_id + " attempt " + d.attempt +
                        "/" + d.max_retries + " — retrying in " + d.delay_s + "s");
                    return;
                }
                if (msgType === "download_progress") {
                    _callbacks.onDownloadProgress?.(d);
                    return;
                }
                // fallback
                _callbacks.onLog?.(d.node_id || "system", d.level || "INFO",
                    d.message || JSON.stringify(d));
            } catch (_e) {
                _callbacks.onLog?.("system", "WARN", "Received non-JSON WS message: " + ev.data);
            }
        };

        _ws.onerror = () => {};

        _ws.onclose = () => {
            _reconnectTimer = setTimeout(setupWebSocket, 3000);
        };

    } catch (_e) {
        _reconnectTimer = setTimeout(setupWebSocket, 5000);
    }
}

export function sendWsMessage(data) {
    if (!_ws || _ws.readyState !== WebSocket.OPEN) {
        _callbacks.onLog?.("engine", "WARN", "WebSocket not open — cannot send message.");
        return false;
    }
    try {
        _ws.send(JSON.stringify(data));
        return true;
    } catch (e) {
        _callbacks.onLog?.("engine", "ERROR", "WebSocket send error: " + e);
        return false;
    }
}
