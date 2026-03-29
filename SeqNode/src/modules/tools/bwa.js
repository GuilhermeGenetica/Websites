/**
 * modules/tools/bwa.js — SeqNode-OS BWA-MEM Tool Module
 *
 * Porta 1:1 de gf-bwa.js.
 * Exporta: isBwa, buildBwaCommand, parseBwaCommand, BWA_FLAGS.
 * resolveRef = resolveInputRef de props-io (injectado como parâmetro).
 * tokenize é importado de ./samtools.js.
 */

import { tokenize } from "./samtools.js";

export const BWA_FLAGS = {
    threads:                  { flag: "-t",  hasVal: true,  type: "int"   },
    min_seed_length:          { flag: "-k",  hasVal: true,  type: "int"   },
    band_width:               { flag: "-w",  hasVal: true,  type: "int"   },
    off_diagonal_dropoff:     { flag: "-d",  hasVal: true,  type: "int"   },
    internal_seeds_threshold: { flag: "-r",  hasVal: true,  type: "float" },
    seed_occurrence_in_ref:   { flag: "-c",  hasVal: true,  type: "int"   },
    match_score:              { flag: "-A",  hasVal: true,  type: "int"   },
    mismatch_penalty:         { flag: "-B",  hasVal: true,  type: "int"   },
    gap_open_penalty:         { flag: "-O",  hasVal: true,  type: "string"},
    gap_extension_penalty:    { flag: "-E",  hasVal: true,  type: "string"},
    clipping_penalty:         { flag: "-L",  hasVal: true,  type: "string"},
    unpaired_penalty:         { flag: "-U",  hasVal: true,  type: "int"   },
    min_alignment_score:      { flag: "-T",  hasVal: true,  type: "int"   },
    mark_secondary:           { flag: "-M",  hasVal: false, type: "bool"  },
    output_all_alignments:    { flag: "-a",  hasVal: false, type: "bool"  },
    append_fasta_comment:     { flag: "-C",  hasVal: false, type: "bool"  },
    interleaved_input:        { flag: "-p",  hasVal: false, type: "bool"  },
};

export function isBwa(plugin) {
    if (!plugin) return false;
    if (plugin.id === "bwa_mem" || plugin.id.indexOf("bwa") === 0) return true;
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    return (cmdStr.trim().split(/\s+/)[0] || "") === "bwa";
}

function _buildRgString(node) {
    const sm = node.params["sample_name"]       || "SAMPLE";
    const lb = node.params["library_id"]        || "LIB001";
    const pl = node.params["platform"]          || "ILLUMINA";
    const pu = node.params["platform_unit"]     || "unit1";
    const dt = node.params["run_date"]          || "";
    const cn = node.params["sequencing_center"] || "";
    const pi = node.params["predicted_insert_size"];

    let rg = "@RG\\tID:" + sm + "\\tSM:" + sm +
             "\\tLB:" + lb + "\\tPL:" + pl + "\\tPU:" + pu;
    if (dt) rg += "\\tDT:" + dt;
    if (cn) rg += "\\tCN:" + cn;
    if (pi && parseInt(pi, 10) > 0) rg += "\\tPI:" + pi;
    return rg;
}

export function buildBwaCommand(node, _plugin, resolveRef) {
    const p = node.params;

    const ref    = p["reference_fa"] || "";
    const read1  = resolveRef(node.inputs_map["read1"]  || "");
    const read2  = resolveRef(node.inputs_map["read2"]  || "");
    const bamOut = node.outputs_map["bam_out"] || "output.bam";

    const sortThreads = p["sort_threads"] || 4;
    const sortMemory  = p["sort_memory"]  || "2G";
    const sortOutput  = (p["sort_output"] !== false);
    const outputCram  = !!p["output_cram"];
    const interleaved = !!p["interleaved_input"];

    const parts = ["bwa", "mem"];

    for (const paramName in BWA_FLAGS) {
        const def = BWA_FLAGS[paramName];
        const val = p[paramName];
        if (val === undefined || val === null || val === "" || val === false) continue;
        if (def.type === "bool") { parts.push(def.flag); continue; }
        if ((def.type === "int" || def.type === "float") && (val === 0 || val === "0")) continue;
        parts.push(def.flag);
        parts.push(String(val));
    }

    parts.push("-R");
    parts.push('"' + _buildRgString(node) + '"');

    parts.push(ref);
    parts.push(read1);
    if (read2 && !interleaved) parts.push(read2);

    let cmd = parts.join(" ");

    if (sortOutput) {
        const sortParts = ["samtools", "sort",
            "-@", String(sortThreads),
            "-m", String(sortMemory)];
        if (outputCram) {
            sortParts.push("-O", "cram,version=3.0", "--reference", ref);
        }
        sortParts.push("-o", bamOut, "-");
        cmd += " \\\n  | " + sortParts.join(" ");
        cmd += " \\\n  && samtools index -@ " + sortThreads + " " + bamOut;
    } else {
        cmd += " \\\n  > " + bamOut;
    }

    return cmd;
}

export function parseBwaCommand(cmdStr, node, plugin) {
    const raw     = cmdStr.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
    const pipeIdx = raw.indexOf("|");
    const bwaPart = pipeIdx > 0 ? raw.substring(0, pipeIdx).trim() : raw;

    const hasSortOutput    = raw.indexOf("samtools sort") >= 0;
    const sortThreadsMatch = raw.match(/samtools sort[^|>]*-@\s+(\d+)/);
    const sortMemMatch     = raw.match(/samtools sort[^|>]*-m\s+(\S+)/);
    const outputCram       = raw.indexOf("-O cram") >= 0 || raw.indexOf("-O cram,") >= 0;

    let bamOut = "";
    const sortOMatch = raw.match(/samtools sort[^|>]*-o\s+(\S+)/);
    if (sortOMatch) {
        bamOut = sortOMatch[1];
    } else {
        const redirectMatch = raw.match(/>\s*(\S+)/);
        if (redirectMatch) bamOut = redirectMatch[1];
    }

    const tok = tokenize(bwaPart);
    let idx   = 0;

    while (idx < tok.length && tok[idx] !== "bwa") idx++;
    idx++;
    if (idx < tok.length && tok[idx] === "mem") idx++;

    const rev = {};
    for (const pn in BWA_FLAGS) {
        const def = BWA_FLAGS[pn];
        rev[def.flag] = { param: pn, def };
    }

    const params     = {};
    const positionals = [];
    let rgStr        = "";

    while (idx < tok.length) {
        const t = tok[idx];
        if (t === "-R" && idx + 1 < tok.length) {
            rgStr = tok[idx + 1]; idx += 2; continue;
        }
        if (rev[t]) {
            const r = rev[t];
            if (r.def.type === "bool") { params[r.param] = true; idx++; continue; }
            if (idx + 1 < tok.length) { params[r.param] = tok[idx + 1]; idx += 2; continue; }
        }
        if (t.startsWith("-") && idx + 1 < tok.length && !tok[idx + 1].startsWith("-")) {
            idx += 2; continue;
        }
        if (!t.startsWith("-")) positionals.push(t);
        idx++;
    }

    node.params      = {};
    node.inputs_map  = {};
    node.outputs_map = {};

    if (positionals.length > 0) params["reference_fa"]   = positionals[0];
    if (positionals.length > 1) node.inputs_map["read1"] = positionals[1];
    if (positionals.length > 2) node.inputs_map["read2"] = positionals[2];

    const INT_PARAMS   = ["threads","min_seed_length","band_width","off_diagonal_dropoff",
                          "seed_occurrence_in_ref","match_score","mismatch_penalty",
                          "unpaired_penalty","min_alignment_score","sort_threads"];
    const FLOAT_PARAMS = ["internal_seeds_threshold"];

    for (const k in params) {
        const schema = plugin.params ? plugin.params[k] : null;
        if (INT_PARAMS.includes(k) || (schema && schema.type === "int")) {
            params[k] = parseInt(params[k], 10) || 0;
        } else if (FLOAT_PARAMS.includes(k) || (schema && schema.type === "float")) {
            params[k] = parseFloat(params[k]) || 0;
        }
    }

    if (rgStr) {
        const rgFields = rgStr.split(/\\t/);
        for (const pair of rgFields) {
            const colon = pair.indexOf(":");
            if (colon < 0) continue;
            const tag = pair.substring(0, colon);
            const val = pair.substring(colon + 1);
            switch (tag) {
                case "SM": params["sample_name"]           = val; break;
                case "LB": params["library_id"]            = val; break;
                case "PL": params["platform"]              = val; break;
                case "PU": params["platform_unit"]         = val; break;
                case "DT": params["run_date"]              = val; break;
                case "CN": params["sequencing_center"]     = val; break;
                case "PI": params["predicted_insert_size"] = parseInt(val, 10) || 0; break;
            }
        }
    }

    params["sort_output"] = hasSortOutput;
    params["output_cram"] = outputCram;
    if (sortThreadsMatch) params["sort_threads"] = parseInt(sortThreadsMatch[1], 10) || 4;
    if (sortMemMatch)     params["sort_memory"]  = sortMemMatch[1];
    if (bamOut)           node.outputs_map["bam_out"] = bamOut;

    node.params = params;
}
