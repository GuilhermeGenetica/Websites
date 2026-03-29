/**
 * modules/tools/samtools.js — SeqNode-OS Samtools Tool Module
 *
 * Porta 1:1 de gf-samtools.js.
 * Exporta: isSamtools, buildSamtoolsCommand, parseSamtoolsCommand,
 *           tokenize, isRegionLike, isFileLike, e constantes SAMTOOLS_*.
 * Importa: resolveInputRef de modules/props-io (recebido como parâmetro).
 */

/* ════════════════════════════════════════════════════════════
   Samtools-specific flag definitions
   ════════════════════════════════════════════════════════════ */

export const SAMTOOLS_FLAGS = {
    threads:              { flag: "-@",          hasVal: true,  type: "int" },
    output_format:        { flag: "-O",          hasVal: true,  type: "string" },
    reference:            { flag: "--reference",  hasVal: true,  type: "string" },
    flag_filter_include:  { flag: "-f",          hasVal: true,  type: "string" },
    flag_filter_exclude:  { flag: "-F",          hasVal: true,  type: "string" },
    min_mapq:             { flag: "-q",          hasVal: true,  type: "int" },
    bed_file:             { flag: "-L",          hasVal: true,  type: "string" },
    header_only:          { flag: "-H",          hasVal: false, type: "bool" },
    count_only:           { flag: "-c",          hasVal: false, type: "bool" },
    include_header:       { flag: "-h",          hasVal: false, type: "bool" },
    subsample_fraction:   { flag: "-s",          hasVal: true,  type: "string" },
    read_group:           { flag: "-r",          hasVal: true,  type: "string" },
    expression_filter:    { flag: "-e",          hasVal: true,  type: "string" },
    tag_filter:           { flag: "-d",          hasVal: true,  type: "string" },
    sort_by_name:         { flag: "-n",          hasVal: false, type: "bool" },
    sort_memory:          { flag: "-m",          hasVal: true,  type: "string" },
    rg_line:              { flag: "-r",          hasVal: true,  type: "string" },
};

export const SAMTOOLS_BOOL_SHORTCUTS = {
    "-b": { param: "output_format", value: "BAM" },
    "-C": { param: "output_format", value: "CRAM" },
    "-u": { param: "output_format", value: "SAM" },
};

export const SAMTOOLS_OUTPUT_MODE = {
    view:         "-o",
    sort:         "-o",
    merge:        "positional_first",
    addreplacerg: "-o",
    collate:      "-o",
    consensus:    "-o",
    ampliconclip: "-o",
    markdup:      "positional_last",
    fixmate:      "positional_last",
    flagstat:     ">",
    stats:        ">",
    idxstats:     ">",
    depth:        ">",
    coverage:     ">",
    mpileup:      ">",
    fastq:        ">",
    calmd:        ">",
    faidx:        ">",
    index:        "none",
    cat:          "none",
    split:        "none",
    reheader:     "none",
};

export const SAMTOOLS_MULTI_INPUT_SUBCMDS = ["merge", "cat"];
export const SAMTOOLS_REGION_SUBCMDS      = ["view", "depth", "mpileup", "coverage"];
export const SAMTOOLS_RAW_PARAMS          = [
    "depth_options",
    "mpileup_options",
    "fastq_options",
    "markdup_options",
    "extra_args",
    "args_between_io",
    "args_after_all",
];

/* ════════════════════════════════════════════════════════════
   Tool detection helpers
   ════════════════════════════════════════════════════════════ */

export function isSamtools(plugin) {
    if (!plugin) return false;
    if (plugin.id.indexOf("samtools") === 0) return true;
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    return (cmdStr.trim().split(/\s+/)[0] || "") === "samtools";
}

export function isRegionLike(tok) {
    if (!tok) return false;
    if (tok.startsWith("-") || tok.startsWith("/") || tok.startsWith("$") || tok.startsWith(".")) return false;
    if (tok.match(/^(chr)?[0-9XYMTxymt]+$/)) return true;
    if (tok.match(/^(chr)?[0-9XYMTxymt]+:[0-9,]+-[0-9,]+$/)) return true;
    if (tok.match(/^[A-Za-z0-9_.]+:[0-9,]+-[0-9,]+$/)) return true;
    return false;
}

export function isFileLike(tok) {
    if (!tok) return false;
    if (tok.startsWith("-")) return false;
    if (tok.includes("/")) return true;
    if (tok.includes(".")) return true;
    return false;
}

/* ════════════════════════════════════════════════════════════
   Tokenizer — shared across all tool parsers
   Pure function: no external dependencies.
   ════════════════════════════════════════════════════════════ */

export function tokenize(str) {
    const tokens = [];
    let current  = "";
    let inQuote  = false;
    let quoteChar = "";

    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (inQuote) {
            if (c === quoteChar) {
                inQuote = false;
            } else {
                current += c;
            }
        } else {
            if (c === "'" || c === '"') {
                inQuote   = true;
                quoteChar = c;
            } else if (c === " " || c === "\t") {
                if (current) { tokens.push(current); current = ""; }
            } else {
                current += c;
            }
        }
    }

    if (current) tokens.push(current);
    return tokens;
}

/* ════════════════════════════════════════════════════════════
   Samtools command BUILDER: node → command text
   resolveRef = resolveInputRef from props-io (injected)
   ════════════════════════════════════════════════════════════ */

export function buildSamtoolsCommand(node, plugin, resolveRef) {
    const parts = ["samtools"];

    const subcmd = node.params["subcommand"] || "";
    if (subcmd) parts.push(subcmd);

    for (const paramName in SAMTOOLS_FLAGS) {
        const flagDef = SAMTOOLS_FLAGS[paramName];
        const val     = node.params[paramName];
        if (val === undefined || val === null || val === "" || val === false) continue;
        if (flagDef.type === "int"    && (val === 0 || val === "0")) continue;
        if (flagDef.type === "string" && !String(val).trim()) continue;
        if (flagDef.type === "bool")  { parts.push(flagDef.flag); continue; }
        parts.push(flagDef.flag);
        parts.push(String(val));
    }

    if (node.params["index_format"] === "csi" && subcmd === "index") {
        parts.push("-c");
    }

    for (const rawParamName of SAMTOOLS_RAW_PARAMS) {
        if (rawParamName === "args_between_io" || rawParamName === "args_after_all") continue;
        const rawVal = node.params[rawParamName];
        if (rawVal && String(rawVal).trim()) parts.push(String(rawVal).trim());
    }

    const outputMode = SAMTOOLS_OUTPUT_MODE[subcmd] || "none";
    const ioOrder    = node.params["io_order"] || "input_first";

    const outputKeys = Object.keys(plugin.outputs || {});
    const outputFile = outputKeys.length > 0 ? (node.outputs_map[outputKeys[0]] || "") : "";

    const inputKeys = Object.keys(plugin.inputs || {});
    const inputFile  = inputKeys.length > 0 ? resolveRef(node.inputs_map[inputKeys[0]] || "") : "";
    const inputFile2 = inputKeys.length > 1 ? resolveRef(node.inputs_map[inputKeys[1]] || "") : "";

    const argsBetween = node.params["args_between_io"] || "";
    const argsAfter   = node.params["args_after_all"]  || "";

    const inputParts  = [];
    const outputParts = [];

    if (inputFile) inputParts.push(inputFile);
    if (inputFile2 && SAMTOOLS_MULTI_INPUT_SUBCMDS.includes(subcmd)) inputParts.push(inputFile2);

    if (outputMode === "-o" && outputFile) {
        outputParts.push("-o", outputFile);
    } else if ((outputMode === "positional_first" || outputMode === "positional_last") && outputFile) {
        outputParts.push(outputFile);
    } else if (outputMode === ">" && outputFile) {
        outputParts.push(">", outputFile);
    }

    if (outputMode === "positional_first") {
        outputParts.forEach(p => parts.push(p));
        if (argsBetween.trim()) parts.push(argsBetween.trim());
        inputParts.forEach(p => parts.push(p));
    } else if (outputMode === "positional_last") {
        inputParts.forEach(p => parts.push(p));
        if (argsBetween.trim()) parts.push(argsBetween.trim());
        outputParts.forEach(p => parts.push(p));
    } else if (outputMode === "-o") {
        if (ioOrder === "output_first") {
            outputParts.forEach(p => parts.push(p));
            if (argsBetween.trim()) parts.push(argsBetween.trim());
            inputParts.forEach(p => parts.push(p));
        } else {
            inputParts.forEach(p => parts.push(p));
            if (argsBetween.trim()) parts.push(argsBetween.trim());
            outputParts.forEach(p => parts.push(p));
        }
    } else if (outputMode === ">") {
        inputParts.forEach(p => parts.push(p));
        if (argsBetween.trim()) parts.push(argsBetween.trim());
        const region = node.params["region"] || node.params["faidx_region"] || "";
        if (region && (SAMTOOLS_REGION_SUBCMDS.includes(subcmd) || subcmd === "faidx")) {
            parts.push(region);
        }
        outputParts.forEach(p => parts.push(p));
        if (argsAfter.trim()) parts.push(argsAfter.trim());
        return parts.join(" ");
    } else {
        inputParts.forEach(p => parts.push(p));
    }

    const region = node.params["region"] || node.params["faidx_region"] || "";
    if (region && (SAMTOOLS_REGION_SUBCMDS.includes(subcmd) || subcmd === "faidx")) {
        parts.push(region);
    }

    if (argsAfter.trim()) parts.push(argsAfter.trim());
    return parts.join(" ");
}

/* ════════════════════════════════════════════════════════════
   Samtools command PARSER: command text → node (reverse sync)
   ════════════════════════════════════════════════════════════ */

export function parseSamtoolsCommand(cmdStr, node, plugin) {
    let raw = cmdStr.replace(/\s+/g, " ").trim();

    let redirectTarget = "";
    const redirectIdx = raw.lastIndexOf(" > ");
    if (redirectIdx > 0) {
        redirectTarget = raw.substring(redirectIdx + 3).trim();
        raw = raw.substring(0, redirectIdx).trim();
    }

    const tokens = tokenize(raw);
    let idx = 0;

    while (idx < tokens.length && ["mamba","conda","run","-n"].includes(tokens[idx])) {
        if (tokens[idx] === "-n" && idx + 1 < tokens.length) { idx += 2; continue; }
        idx++;
    }
    if (idx < tokens.length && tokens[idx] === "samtools") idx++;

    let subcmd = "";
    if (idx < tokens.length && !tokens[idx].startsWith("-")) {
        subcmd = tokens[idx++];
    }

    const reverseFlags = {};
    for (const paramName in SAMTOOLS_FLAGS) {
        const flagDef = SAMTOOLS_FLAGS[paramName];
        if (flagDef.flag) reverseFlags[flagDef.flag] = { param: paramName, flagDef };
    }
    for (const shortFlag in SAMTOOLS_BOOL_SHORTCUTS) {
        reverseFlags[shortFlag] = {
            param:   SAMTOOLS_BOOL_SHORTCUTS[shortFlag].param,
            value:   SAMTOOLS_BOOL_SHORTCUTS[shortFlag].value,
            flagDef: { hasVal: false, type: "shortcut" },
        };
    }

    const parsedFlags = {};
    const positionals = [];
    let outputFromFlag = "";

    while (idx < tokens.length) {
        const tok = tokens[idx];

        if (tok === "-o" && idx + 1 < tokens.length) {
            outputFromFlag = tokens[idx + 1]; idx += 2; continue;
        }
        if (tok === "-c" && subcmd === "index") {
            parsedFlags["index_format"] = "csi"; idx++; continue;
        }

        if (reverseFlags[tok]) {
            const rf = reverseFlags[tok];
            if (rf.flagDef.type === "shortcut") {
                parsedFlags[rf.param] = rf.value; idx++; continue;
            }
            if (rf.flagDef.type === "bool" || !rf.flagDef.hasVal) {
                parsedFlags[rf.param] = true; idx++; continue;
            }
            if (idx + 1 < tokens.length) {
                parsedFlags[rf.param] = tokens[idx + 1]; idx += 2; continue;
            }
        }

        positionals.push(tok);
        idx++;
    }

    node.params = {};
    if (subcmd) node.params["subcommand"] = subcmd;

    for (const flagParam in parsedFlags) {
        let flagValue   = parsedFlags[flagParam];
        const paramSchema = plugin.params ? plugin.params[flagParam] : null;
        if (paramSchema && paramSchema.type === "int") {
            flagValue = parseInt(flagValue, 10) || 0;
            if (flagValue === 0) continue;
        }
        node.params[flagParam] = flagValue;
    }

    const inputKeys  = Object.keys(plugin.inputs  || {});
    const outputKeys = Object.keys(plugin.outputs || {});
    const outputMode = SAMTOOLS_OUTPUT_MODE[subcmd] || "none";

    node.inputs_map  = {};
    node.outputs_map = {};

    const regionTokens = positionals.filter(p => isRegionLike(p));
    const fileTokens   = positionals.filter(p => !isRegionLike(p));

    if (outputMode === "positional_last" && fileTokens.length >= 2) {
        if (inputKeys.length  > 0) node.inputs_map[inputKeys[0]]   = fileTokens[0];
        if (outputKeys.length > 0) node.outputs_map[outputKeys[0]] = fileTokens[fileTokens.length - 1];
    } else if (outputMode === "positional_first" && fileTokens.length >= 2) {
        if (outputKeys.length > 0) node.outputs_map[outputKeys[0]] = fileTokens[0];
        if (inputKeys.length  > 0) node.inputs_map[inputKeys[0]]   = fileTokens[1];
        if (inputKeys.length  > 1 && fileTokens.length > 2) node.inputs_map[inputKeys[1]] = fileTokens[2];
    } else {
        if (fileTokens.length > 0 && inputKeys.length > 0) node.inputs_map[inputKeys[0]] = fileTokens[0];
        if (fileTokens.length > 1 && SAMTOOLS_MULTI_INPUT_SUBCMDS.includes(subcmd) && inputKeys.length > 1) {
            node.inputs_map[inputKeys[1]] = fileTokens[1];
        }
    }

    if (regionTokens.length > 0) {
        if (subcmd === "faidx") {
            node.params["faidx_region"] = regionTokens.join(" ");
        } else {
            node.params["region"] = regionTokens.join(" ");
        }
    }

    if (outputFromFlag && outputKeys.length > 0)  node.outputs_map[outputKeys[0]] = outputFromFlag;
    if (redirectTarget && outputKeys.length > 0)   node.outputs_map[outputKeys[0]] = redirectTarget;
}
