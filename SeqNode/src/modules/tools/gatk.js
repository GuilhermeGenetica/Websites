/**
 * modules/tools/gatk.js — SeqNode-OS GATK Tool Module
 *
 * Porta 1:1 de gf-gatk.js.
 * Exporta: isGatk, buildGatkCommand, parseGatkCommand, GATK_FLAGS.
 */

import { tokenize } from "./samtools.js";

export const GATK_FLAGS = {
    reference_fa:                  { flag: "-R",                                              hasVal: true,  type: "string"  },
    intervals:                     { flag: "-L",                                              hasVal: true,  type: "string"  },
    exclude_intervals:             { flag: "-XL",                                             hasVal: true,  type: "string"  },
    dbsnp_vcf:                     { flag: "--dbsnp",                                         hasVal: true,  type: "string"  },
    emit_ref_confidence:           { flag: "-ERC",                                            hasVal: true,  type: "string"  },
    output_mode:                   { flag: "--output-mode",                                   hasVal: true,  type: "string"  },
    stand_call_conf:               { flag: "--standard-min-confidence-threshold-for-calling", hasVal: true,  type: "float"   },
    max_alternate_alleles:         { flag: "--max-alternate-alleles",                         hasVal: true,  type: "int"     },
    min_base_quality_score:        { flag: "--min-base-quality-score",                        hasVal: true,  type: "int"     },
    heterozygosity:                { flag: "--heterozygosity",                                hasVal: true,  type: "float"   },
    heterozygosity_stdev:          { flag: "--heterozygosity-stdev",                          hasVal: true,  type: "float"   },
    indel_heterozygosity:          { flag: "--indel-heterozygosity",                          hasVal: true,  type: "float"   },
    contamination_fraction:        { flag: "--contamination-fraction-to-filter",              hasVal: true,  type: "float"   },
    interval_padding:              { flag: "--interval-padding",                              hasVal: true,  type: "int"     },
    max_reads_per_alignment_start: { flag: "--max-reads-per-alignment-start",                 hasVal: true,  type: "int"     },
    active_probability_threshold:  { flag: "--active-probability-threshold",                  hasVal: true,  type: "float"   },
    assembly_region_padding:       { flag: "--assembly-region-padding",                       hasVal: true,  type: "int"     },
    pair_hmm_implementation:       { flag: "--pair-hmm-implementation",                       hasVal: true,  type: "string"  },
    native_pair_hmm_threads:       { flag: "--native-pair-hmm-threads",                       hasVal: true,  type: "int"     },
    minimum_mapping_quality:       { flag: "--minimum-mapping-quality",                       hasVal: true,  type: "int"     },
    dont_use_soft_clipped_bases:   { flag: "--dont-use-soft-clipped-bases",                   hasVal: false, type: "bool"    },
};

export function isGatk(plugin) {
    if (!plugin) return false;
    if (plugin.id.indexOf("gatk") === 0) return true;
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    return (cmdStr.trim().split(/\s+/)[0] || "") === "gatk";
}

function _expandRepeated(flag, csvVal) {
    if (!csvVal || !String(csvVal).trim()) return [];
    const parts = [];
    for (const item of String(csvVal).split(",")) {
        const t = item.trim();
        if (t) { parts.push(flag); parts.push(t); }
    }
    return parts;
}

export function buildGatkCommand(node, _plugin, resolveRef) {
    const p = node.params;

    const jmem     = p["java_memory"]     || "8g";
    const jopts    = p["java_extra_opts"] || "";
    const javaOpts = "-Xmx" + jmem + (jopts ? " " + jopts : "");

    const bamIn  = resolveRef(node.inputs_map["bam_in"]  || "");
    const vcfOut = node.outputs_map["vcf_out"] || "output.vcf.gz";

    const parts = ["gatk", "--java-options", '"' + javaOpts + '"', "HaplotypeCaller"];

    for (const paramName in GATK_FLAGS) {
        const def = GATK_FLAGS[paramName];
        const val = p[paramName];
        if (val === undefined || val === null || val === "" || val === false) continue;
        if (def.type === "bool") { parts.push(def.flag); continue; }
        if (def.type === "int"   && (val === 0 || val === "0")) continue;
        if (def.type === "float" && parseFloat(val) === 0) continue;
        if (def.type === "string" && !String(val).trim()) continue;
        parts.push(def.flag);
        parts.push(String(val));
    }

    parts.push("-I", bamIn);
    parts.push("-O", vcfOut);

    const pcrFree  = !!p["pcr_free"];
    const pcrModel = p["pcr_indel_model"] || "";
    if (pcrFree) {
        parts.push("--pcr-indel-model", "NONE");
    } else if (pcrModel && pcrModel !== "CONSERVATIVE") {
        parts.push("--pcr-indel-model", pcrModel);
    }

    _expandRepeated("--kmer-size",          p["kmer_size"]).forEach(a => parts.push(a));
    _expandRepeated("-G",                   p["annotation_groups"]).forEach(a => parts.push(a));
    _expandRepeated("-A",                   p["extra_annotations"]).forEach(a => parts.push(a));
    if (p["emit_ref_confidence"] === "GVCF" && p["gvcf_gq_bands"]) {
        _expandRepeated("--gvcf-gq-bands", p["gvcf_gq_bands"]).forEach(a => parts.push(a));
    }
    _expandRepeated("--disable-read-filter", p["disable_read_filter"]).forEach(a => parts.push(a));

    return parts.join(" ");
}

export function parseGatkCommand(cmdStr, node, plugin) {
    const raw = cmdStr.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
    const tok = tokenize(raw);
    let idx   = 0;

    while (idx < tok.length && tok[idx] !== "gatk") idx++;
    idx++;

    let javaOptsStr = "";
    if (idx < tok.length && tok[idx] === "--java-options") {
        idx++;
        if (idx < tok.length) { javaOptsStr = tok[idx++]; }
    }

    // Skip subcommand (HaplotypeCaller)
    if (idx < tok.length && !tok[idx].startsWith("-")) idx++;

    const rev = {};
    for (const pn in GATK_FLAGS) rev[GATK_FLAGS[pn].flag] = { param: pn, def: GATK_FLAGS[pn] };

    const params         = {};
    const kmerSizes      = [];
    const annotGroups    = [];
    const extraAnnots    = [];
    const gvcfBands      = [];
    const disableFilters = [];
    let bamIn = "";
    let vcfOut = "";

    while (idx < tok.length) {
        const t = tok[idx];
        if (t === "-I" && idx + 1 < tok.length) { bamIn  = tok[++idx]; idx++; continue; }
        if (t === "-O" && idx + 1 < tok.length) { vcfOut = tok[++idx]; idx++; continue; }
        if (t === "--kmer-size"          && idx + 1 < tok.length) { kmerSizes.push(tok[++idx]);      idx++; continue; }
        if (t === "-G"                   && idx + 1 < tok.length) { annotGroups.push(tok[++idx]);    idx++; continue; }
        if (t === "-A"                   && idx + 1 < tok.length) { extraAnnots.push(tok[++idx]);    idx++; continue; }
        if (t === "--gvcf-gq-bands"      && idx + 1 < tok.length) { gvcfBands.push(tok[++idx]);      idx++; continue; }
        if (t === "--disable-read-filter"&& idx + 1 < tok.length) { disableFilters.push(tok[++idx]); idx++; continue; }
        if (t === "--pcr-indel-model"    && idx + 1 < tok.length) {
            const pcrVal = tok[++idx]; idx++;
            if (pcrVal === "NONE") { params["pcr_free"] = true; }
            else { params["pcr_indel_model"] = pcrVal; }
            continue;
        }
        if (rev[t]) {
            const r = rev[t];
            if (r.def.type === "bool") { params[r.param] = true; idx++; continue; }
            if (idx + 1 < tok.length) { params[r.param] = tok[++idx]; idx++; continue; }
        }
        idx++;
    }

    if (kmerSizes.length)      params["kmer_size"]           = kmerSizes.join(",");
    if (annotGroups.length)    params["annotation_groups"]   = annotGroups.join(",");
    if (extraAnnots.length)    params["extra_annotations"]   = extraAnnots.join(",");
    if (gvcfBands.length)      params["gvcf_gq_bands"]       = gvcfBands.join(",");
    if (disableFilters.length) params["disable_read_filter"] = disableFilters.join(",");

    if (javaOptsStr) {
        const xmxM = javaOptsStr.match(/-Xmx(\S+)/);
        if (xmxM) params["java_memory"] = xmxM[1];
        const restOpts = javaOptsStr.replace(/-Xmx\S+/, "").trim();
        if (restOpts) params["java_extra_opts"] = restOpts;
    }

    const INT_PARAMS   = ["max_alternate_alleles","min_base_quality_score","interval_padding",
                          "max_reads_per_alignment_start","assembly_region_padding",
                          "native_pair_hmm_threads","minimum_mapping_quality"];
    const FLOAT_PARAMS = ["stand_call_conf","heterozygosity","heterozygosity_stdev",
                          "indel_heterozygosity","contamination_fraction",
                          "active_probability_threshold"];

    for (const k in params) {
        if (INT_PARAMS.includes(k))   params[k] = parseInt(params[k], 10) || 0;
        else if (FLOAT_PARAMS.includes(k)) params[k] = parseFloat(params[k]) || 0;
    }

    node.params      = params;
    node.inputs_map  = {};
    node.outputs_map = {};
    if (bamIn)  node.inputs_map["bam_in"]   = bamIn;
    if (vcfOut) node.outputs_map["vcf_out"] = vcfOut;
}
