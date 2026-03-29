/**
 * modules/tools/shell_cmd.js — shell_cmd plugin command builder & parser
 *
 * The shell_cmd template is simply `{cmd}`, so the command IS the `cmd` param.
 * Build  → return node.params.cmd directly (no CLI flag construction).
 * Parse  → set node.params.cmd = cmdStr without touching inputs_map/outputs_map,
 *           which hold file connections managed separately via the Inputs section.
 */

export function isShellCmd(plugin) {
    return plugin.id === "shell_cmd";
}

export function buildShellCmdCommand(node /*, plugin */) {
    return (node.params && node.params.cmd != null) ? String(node.params.cmd) : "";
}

export function parseShellCmdCommand(cmdStr, node /*, plugin */) {
    if (!node.params) node.params = {};
    node.params.cmd = cmdStr;
    // Intentionally do NOT reset inputs_map or outputs_map — those are file
    // connections configured in the Inputs/Outputs sections independently.
}

export default { isShellCmd, buildShellCmdCommand, parseShellCmdCommand };
