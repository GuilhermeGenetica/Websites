/**
 * modules/tools/vep.js — SeqNode-OS Ensembl VEP Tool Module
 *
 * Porta 1:1 de gf-vep.js.
 * Exporta: isVep, buildVepCommand, parseVepCommand,
 *           VEP_BOOL_FLAGS, VEP_STRING_FLAGS.
 */

import { tokenize } from "./samtools.js";

export const VEP_BOOL_FLAGS = [
    "offline","merged","refseq","check_ref","force_overwrite",
    "canonical","mane","hgvs","hgvsg","symbol","numbers","domains",
    "regulatory","protein","biotype","tsl","appris","uniprot","ccds",
    "xref_refseq","gencode_basic","af","af_1kg","af_gnomade","af_gnomadg",
    "max_af","af_exac","pubmed","variant_class","gene_phenotype",
    "total_length","allele_number","minimal","no_escape","check_existing",
    "filter_common","pick","per_gene","exclude_null_alleles","allow_non_variant",
    "shift_genomic",
];

export const VEP_STRING_FLAGS = {
    species:       "--species",
    assembly:      "--assembly",
    cache_dir:     "--dir",
    fasta:         "--fasta",
    fork:          "--fork",
    buffer_size:   "--buffer_size",
    sift:          "--sift",
    polyphen:      "--polyphen",
    pick_order:    "--pick_order",
    filter_string: "--filter",
};

export function isVep(plugin) {
    if (!plugin) return false;
    if (plugin.id === "ensembl_vep" || plugin.id.indexOf("vep") >= 0) return true;
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    return (cmdStr.trim().split(/\s+/)[0] || "") === "vep";
}

export function buildVepCommand(node, _plugin, resolveRef) {
    const p = node.params;

    const vcfIn    = resolveRef(node.inputs_map["vcf_in"] || "");
    const vcfOut   = node.outputs_map["vcf_out"]   || "output.vcf";
    const statsHtml = node.outputs_map["stats_html"] || "";

    const parts = ["vep"];
    parts.push("--input_file",  vcfIn);
    parts.push("--output_file", vcfOut);

    const fmt = p["output_format"] || "vcf";
    if (fmt === "vcf")  parts.push("--vcf");
    if (fmt === "json") parts.push("--json");
    if (fmt === "tab")  parts.push("--tab");

    if (p["compress_output"]) parts.push("--compress_output", "bgzip");

    for (const sp in VEP_STRING_FLAGS) {
        const val = p[sp];
        if (val === undefined || val === null || val === "" || val === 0) continue;
        parts.push(VEP_STRING_FLAGS[sp]);
        parts.push(String(val));
    }

    for (const bflag of VEP_BOOL_FLAGS) {
        if (p[bflag]) parts.push("--" + bflag);
    }

    if (p["shift_hgvs"])  parts.push("--shift_hgvs", "1");
    if (p["failed"])      parts.push("--failed", "1");
    if (p["pick_allele"]) parts.push("--flag_pick_allele");
    if (p["everything"])  parts.push("--everything");

    if (p["no_stats"]) {
        parts.push("--no_stats");
    } else if (p["stats_file"] && statsHtml) {
        parts.push("--stats_file", statsHtml);
    }

    if (p["dir_plugins"]) parts.push("--dir_plugins", p["dir_plugins"]);

    if (p["clinvar_vcf"]) {
        const fields = p["clinvar_fields"] || "CLNSIG,CLNREVSTAT,CLNDN";
        parts.push("--custom", "file=" + p["clinvar_vcf"] +
            ",short_name=ClinVar,format=vcf,type=exact,coords=0,fields=" + fields);
    }

    if (p["cadd_snv"] && p["cadd_indel"]) {
        parts.push("--plugin", "CADD," + p["cadd_snv"] + "," + p["cadd_indel"]);
    } else if (p["cadd_snv"]) {
        parts.push("--plugin", "CADD," + p["cadd_snv"]);
    }

    if (p["revel_file"]) parts.push("--plugin", "REVEL," + p["revel_file"]);

    if (p["alphamissense_file"])
        parts.push("--plugin", "AlphaMissense,file=" + p["alphamissense_file"]);

    if (p["spliceai_snv"] && p["spliceai_indel"]) {
        parts.push("--plugin", "SpliceAI,snv=" + p["spliceai_snv"] + ",indel=" + p["spliceai_indel"]);
    } else if (p["spliceai_snv"]) {
        parts.push("--plugin", "SpliceAI,snv=" + p["spliceai_snv"]);
    }

    if (p["loftee_enabled"] && p["loftee_ancestor_fa"]) {
        const lofteeDir = p["dir_plugins"] ? p["dir_plugins"] + "/loftee" : "~/.vep/Plugins/loftee";
        parts.push("--plugin", "LoF,loftee_path:" + lofteeDir +
            ",human_ancestor_fa:" + p["loftee_ancestor_fa"]);
    }

    if (p["maxentscan_dir"]) parts.push("--plugin", "MaxEntScan," + p["maxentscan_dir"]);
    if (p["utr_annotator_enabled"]) parts.push("--plugin", "UTRAnnotator");
    if (p["custom_annotations"])    parts.push(p["custom_annotations"]);

    return parts.join(" ");
}

export function parseVepCommand(cmdStr, node, _plugin) {
    const raw = cmdStr.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
    const tok = tokenize(raw);
    let idx   = 0;

    while (idx < tok.length && tok[idx] !== "vep") idx++;
    idx++;

    const params    = {};
    let vcfIn       = "";
    let vcfOut      = "";
    let statsHtml   = "";

    const revStr = {};
    for (const sp in VEP_STRING_FLAGS) revStr[VEP_STRING_FLAGS[sp]] = sp;

    const boolSet = {};
    for (const bf of VEP_BOOL_FLAGS) boolSet["--" + bf] = bf;

    while (idx < tok.length) {
        const t = tok[idx];

        if (t === "--input_file"    && idx + 1 < tok.length) { vcfIn  = tok[++idx]; idx++; continue; }
        if (t === "--output_file"   && idx + 1 < tok.length) { vcfOut = tok[++idx]; idx++; continue; }
        if (t === "--vcf")  { params["output_format"] = "vcf";  idx++; continue; }
        if (t === "--json") { params["output_format"] = "json"; idx++; continue; }
        if (t === "--tab")  { params["output_format"] = "tab";  idx++; continue; }
        if (t === "--compress_output" && idx + 1 < tok.length)       { idx++; params["compress_output"] = true; idx++; continue; }
        if (t === "--everything")                                      { params["everything"]  = true; idx++; continue; }
        if (t === "--flag_pick_allele")                                { params["pick_allele"] = true; idx++; continue; }
        if (t === "--no_stats")                                        { params["no_stats"]    = true; idx++; continue; }
        if (t === "--stats_file"    && idx + 1 < tok.length) { statsHtml = tok[++idx]; params["stats_file"] = true; idx++; continue; }
        if (t === "--shift_hgvs"    && idx + 1 < tok.length) { params["shift_hgvs"] = (tok[++idx] === "1"); idx++; continue; }
        if (t === "--failed"        && idx + 1 < tok.length) { params["failed"]     = (tok[++idx] === "1"); idx++; continue; }
        if (t === "--filter"        && idx + 1 < tok.length) { params["filter_string"] = tok[++idx]; idx++; continue; }

        if (boolSet[t]) { params[boolSet[t]] = true; idx++; continue; }

        if (revStr[t] && idx + 1 < tok.length) {
            const pname = revStr[t];
            params[pname] = tok[++idx]; idx++;
            if (pname === "fork" || pname === "buffer_size") params[pname] = parseInt(params[pname], 10);
            continue;
        }

        if (t === "--custom" && idx + 1 < tok.length) {
            const customVal = tok[++idx]; idx++;
            const fileM   = customVal.match(/file=([^,]+)/);
            const fieldsM = customVal.match(/fields=([^,\s]+)/);
            const snM     = customVal.match(/short_name=([^,]+)/);
            if (snM && snM[1] === "ClinVar") {
                if (fileM)   params["clinvar_vcf"]    = fileM[1];
                if (fieldsM) params["clinvar_fields"] = fieldsM[1].replace(/:/g, ",");
            } else {
                params["custom_annotations"] = (params["custom_annotations"] || "") + " --custom " + customVal;
            }
            continue;
        }

        if (t === "--plugin" && idx + 1 < tok.length) {
            const pluginVal = tok[++idx]; idx++;
            if (pluginVal.indexOf("CADD,") === 0) {
                const caddParts = pluginVal.substring(5).split(",");
                params["cadd_snv"]   = caddParts[0] || "";
                params["cadd_indel"] = caddParts[1] || "";
            } else if (pluginVal.indexOf("REVEL,") === 0) {
                params["revel_file"] = pluginVal.substring(6);
            } else if (pluginVal.indexOf("AlphaMissense,file=") === 0) {
                params["alphamissense_file"] = pluginVal.substring(19);
            } else if (pluginVal.indexOf("SpliceAI,") === 0) {
                const saiM = pluginVal.match(/snv=([^,]+)/);
                const iaiM = pluginVal.match(/indel=([^,]+)/);
                if (saiM) params["spliceai_snv"]   = saiM[1];
                if (iaiM) params["spliceai_indel"] = iaiM[1];
            } else if (pluginVal.indexOf("LoF,") === 0) {
                params["loftee_enabled"] = true;
                const haM = pluginVal.match(/human_ancestor_fa:([^\s,]+)/);
                if (haM) params["loftee_ancestor_fa"] = haM[1];
            } else if (pluginVal.indexOf("MaxEntScan,") === 0) {
                params["maxentscan_dir"] = pluginVal.substring(11);
            } else if (pluginVal === "UTRAnnotator") {
                params["utr_annotator_enabled"] = true;
            }
            continue;
        }

        idx++;
    }

    node.params      = params;
    node.inputs_map  = {};
    node.outputs_map = {};
    if (vcfIn)     node.inputs_map["vcf_in"]       = vcfIn;
    if (vcfOut)    node.outputs_map["vcf_out"]     = vcfOut;
    if (statsHtml) node.outputs_map["stats_html"]  = statsHtml;
}
