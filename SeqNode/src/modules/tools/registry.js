/**
 * modules/tools/registry.js — SeqNode-OS Tool Registry
 *
 * Central dispatch table for tool-specific command builders and parsers.
 * Each tool is registered by direct import from its module.
 * To add a new tool, import its module here and add an entry to TOOL_REGISTRY.
 *
 * Each registry entry has the shape:
 *   { detect(plugin), build(node, plugin, resolveRef), parse(cmdStr, node, plugin) }
 *
 * Order matters: the first entry whose detect() returns true wins.
 * The generic entry must always be last (no detect — it is the fallback).
 */

import { isShellCmd,  buildShellCmdCommand,  parseShellCmdCommand  } from "./shell_cmd.js";
import { isSamtools,  buildSamtoolsCommand,  parseSamtoolsCommand  } from "./samtools.js";
import { isBwa,       buildBwaCommand,        parseBwaCommand        } from "./bwa.js";
import { isGatk,      buildGatkCommand,       parseGatkCommand       } from "./gatk.js";
import { isBcftools,  buildBcftoolsCommand,  parseBcftoolsCommand   } from "./bcftools.js";
import { isBedtools,  buildBedtoolsCommand,  parseBedtoolsCommand   } from "./bedtools.js";
import { isVep,       buildVepCommand,        parseVepCommand        } from "./vep.js";
import { isSnpeff,    buildSnpeffCommand,     parseSnpeffCommand     } from "./snpeff.js";

export const TOOL_REGISTRY = [
    // shell_cmd must come before the generic fallback — its template is {cmd} which
    // the generic builder would misinterpret as a CLI binary named "{cmd}".
    { detect: isShellCmd,  build: buildShellCmdCommand,  parse: parseShellCmdCommand  },
    { detect: isSamtools,  build: buildSamtoolsCommand,  parse: parseSamtoolsCommand  },
    { detect: isBwa,       build: buildBwaCommand,        parse: parseBwaCommand        },
    { detect: isGatk,      build: buildGatkCommand,       parse: parseGatkCommand       },
    { detect: isBcftools,  build: buildBcftoolsCommand,  parse: parseBcftoolsCommand   },
    { detect: isBedtools,  build: buildBedtoolsCommand,  parse: parseBedtoolsCommand   },
    { detect: isVep,       build: buildVepCommand,        parse: parseVepCommand        },
    { detect: isSnpeff,    build: buildSnpeffCommand,     parse: parseSnpeffCommand     },
    // Generic fallback — no detect, always matches last
    { detect: null,        build: _buildGenericCommand,   parse: _parseGenericCommand   },
];

/* ════════════════════════════════════════════════════════════
   Generic builder / parser — used when no specific module matches
   ════════════════════════════════════════════════════════════ */

import { tokenize } from "./samtools.js";

function _buildGenericCommand(node, plugin, resolveRef) {
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    const binary = cmdStr.trim().split(/\s+/)[0] || plugin.id;
    const parts  = [binary];

    for (const [paramKey, paramSchema] of Object.entries(plugin.params || {})) {
        const val = node.params[paramKey];
        if (val === undefined || val === null || val === "" || val === false) continue;
        if (paramSchema.type === "int" && (val === 0 || val === "0")) continue;
        if (paramSchema.type === "bool") {
            parts.push("--" + paramKey.replace(/_/g, "-"));
            continue;
        }
        parts.push("--" + paramKey.replace(/_/g, "-"));
        parts.push(String(val));
    }

    for (const [inputKey] of Object.entries(plugin.inputs || {})) {
        const inputVal = resolveRef(node.inputs_map[inputKey] || "");
        if (inputVal) parts.push(inputVal);
    }

    let addedRedirect = false;
    for (const [outputKey] of Object.entries(plugin.outputs || {})) {
        const outputVal = node.outputs_map[outputKey] || "";
        if (outputVal && !addedRedirect) {
            parts.push(">");
            parts.push(outputVal);
            addedRedirect = true;
            break;
        }
    }

    return parts.join(" ");
}

function _parseGenericCommand(cmdStr, node, plugin) {
    let raw = cmdStr;
    let redirectTarget = "";
    const redirectIdx = raw.lastIndexOf(" > ");
    if (redirectIdx > 0) {
        redirectTarget = raw.substring(redirectIdx + 3).trim();
        raw = raw.substring(0, redirectIdx).trim();
    }

    const tokens    = tokenize(raw);
    const inputKeys  = Object.keys(plugin.inputs  || {});
    const outputKeys = Object.keys(plugin.outputs || {});

    node.params      = {};
    node.inputs_map  = {};
    node.outputs_map = {};

    const positionals = [];
    let tokenIdx      = 1;

    while (tokenIdx < tokens.length) {
        const currentToken = tokens[tokenIdx];
        if (currentToken.startsWith("--") && tokenIdx + 1 < tokens.length) {
            const paramKey = currentToken.substring(2).replace(/-/g, "_");
            if (plugin.params && plugin.params[paramKey]) {
                const schema = plugin.params[paramKey];
                if (schema.type === "bool") {
                    node.params[paramKey] = true; tokenIdx++;
                } else {
                    node.params[paramKey] = tokens[tokenIdx + 1]; tokenIdx += 2;
                }
                continue;
            }
        }
        positionals.push(currentToken);
        tokenIdx++;
    }

    if (positionals.length > 0 && inputKeys.length > 0) {
        node.inputs_map[inputKeys[0]] = positionals[0];
    }
    if (redirectTarget && outputKeys.length > 0) {
        node.outputs_map[outputKeys[0]] = redirectTarget;
    }
}

/**
 * findToolEntry(plugin) — returns the registry entry for a plugin.
 * Returns the first entry whose detect() returns true, or the generic fallback.
 */
export function findToolEntry(plugin) {
    for (const entry of TOOL_REGISTRY) {
        if (!entry.detect || entry.detect(plugin)) return entry;
    }
    return TOOL_REGISTRY[TOOL_REGISTRY.length - 1];
}

export default { TOOL_REGISTRY, findToolEntry };
