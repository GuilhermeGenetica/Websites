/**
 * modules/command.js — SeqNode-OS Command Builder & Terminal Logic
 *
 * Exports createCommandModule(store, resolveRef) — factory returning:
 *   buildCommandString(node, plugin)
 *   parseCommandToNode(cmdStr, node, plugin)
 *   createTerminalState()       — hook-friendly state factory
 *   syncCmdFromParams(node, plugin, terminalState)
 *   renderCommandTerminalHtml() — HTML string for dangerouslySetInnerHTML
 *
 * Terminal logic (focus/input/save/reset) is encapsulated in
 * createTerminalState() for use in React without global state.
 */

import { findToolEntry } from "./tools/registry.js";

/* ════════════════════════════════════════════════════════════
   buildCommandString — node → command text
   ════════════════════════════════════════════════════════════ */

export function buildCommandString(node, plugin, resolveRef) {
    if (!plugin) return "";
    const entry = findToolEntry(plugin);
    return entry.build(node, plugin, resolveRef);
}

/* ════════════════════════════════════════════════════════════
   parseCommandToNode — command text → node (reverse sync)
   ════════════════════════════════════════════════════════════ */

export function parseCommandToNode(cmdStr, node, plugin) {
    if (!cmdStr || !cmdStr.trim() || !plugin) return;
    const entry = findToolEntry(plugin);
    entry.parse(cmdStr, node, plugin);
}

/* ════════════════════════════════════════════════════════════
   createTerminalState — imperative terminal state module
   Designed to be used as a ref in React:
     const terminal = useRef(createTerminalState());
   ════════════════════════════════════════════════════════════ */

export function createTerminalState() {
    let _isUserEditing  = false;
    let _saveScheduled  = false;

    function reset() {
        _isUserEditing = false;
        _saveScheduled = false;
    }

    function onFocus() {
        _isUserEditing = true;
    }

    function isEditing() { return _isUserEditing; }
    function isSaveScheduled() { return _saveScheduled; }

    function onInput(setStatusFn) {
        setStatusFn("Editing — click Save to apply to form, or Auto to reset", "cmd-status-editing");
    }

    function onSave({ node, plugin, setStatusFn, getBoxValue, onRerender, onPersist, resolveRef }) {
        if (!node) return;
        const cmdStr = getBoxValue().trim();

        // Empty terminal: clear custom_command so execution falls back to form params
        if (!cmdStr) {
            node.custom_command = "";
            _isUserEditing = false;
            onPersist?.();
            setStatusFn("Terminal cleared — using auto-generated command", "cmd-status-auto");
            onRerender?.();
            return;
        }

        node.custom_command = cmdStr;
        _isUserEditing = false;

        parseCommandToNode(cmdStr, node, plugin);

        onPersist?.();

        setStatusFn("Saved! Form updated from command. Command has priority.", "cmd-status-saved");

        _saveScheduled = true;
        setTimeout(() => {
            _saveScheduled = false;
            onRerender?.();
        }, 600);
    }

    function onReset({ node, onRerender }) {
        if (!node) return;
        node.custom_command = "";
        _isUserEditing = false;
        onRerender?.();
    }

    function syncFromParams({ node, plugin, getBoxValue, setBoxValue, setStatusFn, resolveRef }) {
        if (_isUserEditing || _saveScheduled) return;
        if (!node || !plugin) return;

        if (node.custom_command && node.custom_command.trim()) {
            setBoxValue(node.custom_command);
            setStatusFn("Custom command (saved) — has priority over form", "cmd-status-saved");
            return;
        }

        const cmd = buildCommandString(node, plugin, resolveRef);
        setBoxValue(cmd);
        setStatusFn("Auto-generated from form", "cmd-status-auto");
    }

    return { reset, onFocus, onInput, onSave, onReset, syncFromParams, isEditing, isSaveScheduled };
}

/* ════════════════════════════════════════════════════════════
   renderCommandTerminalHtml — HTML string for terminal widget
   Parent component injects via dangerouslySetInnerHTML and listens
   to events via data-attributes for onSave / onReset / onFocus / onInput.
   ════════════════════════════════════════════════════════════ */

export function renderCommandTerminalHtml() {
    return `<div class="cmd-terminal-section">
  <div class="cmd-terminal-header">
    <span class="cmd-terminal-title">&#x1F4BB; Command Terminal</span>
    <div class="cmd-terminal-actions">
      <button class="btn-small" data-cmd-reset title="Reset to auto-generated from parameters">&#x1F504; Auto</button>
      <button class="btn-small cmd-save-btn" data-cmd-save title="Save command and parse back to form fields">&#x1F4BE; Save</button>
    </div>
  </div>
  <div class="cmd-terminal-body">
    <span class="cmd-terminal-prompt">$</span>
    <textarea id="cmd-terminal-input" class="cmd-terminal-textarea" rows="3" spellcheck="false"
      data-cmd-focus data-cmd-input></textarea>
  </div>
  <div id="cmd-terminal-status" class="cmd-terminal-status"></div>
</div>`;
}

export default { buildCommandString, parseCommandToNode, createTerminalState, renderCommandTerminalHtml };
