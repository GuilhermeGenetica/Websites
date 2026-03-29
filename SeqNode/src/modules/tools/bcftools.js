/**
 * modules/tools/bcftools.js — SeqNode-OS BCFtools Tool Module
 *
 * Porta 1:1 de gf-bcftools.js.
 * Exporta: isBcftools, buildBcftoolsCommand, parseBcftoolsCommand.
 */

import { tokenize } from "./samtools.js";

export function isBcftools(plugin) {
    if (!plugin) return false;
    if (plugin.id === "bcftools_filter" || plugin.id.indexOf("bcftools") === 0) return true;
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    return (cmdStr.trim().split(/\s+/)[0] || "") === "bcftools";
}

export function buildBcftoolsCommand(node, _plugin, resolveRef) {
    const p = node.params;

    const vcfIn  = resolveRef(node.inputs_map["vcf_in"]  || "");
    const vcfOut = node.outputs_map["vcf_out"] || "output.vcf.gz";

    const threads = p["threads"]     || 4;
    const outType = p["output_type"] || "z";

    const steps = [];

    // Step 1: norm
    if (p["normalize"]) {
        const normParts = ["bcftools", "norm"];
        if (p["reference_fa"])       { normParts.push("-f",  p["reference_fa"]); }
        if (p["split_multiallelic"]) { normParts.push("-m",  p["split_multiallelic"]); }
        if (p["check_ref"])          { normParts.push("-c",  p["check_ref"]); }
        if (p["do_not_normalize"])   normParts.push("--no-normalize");
        normParts.push("--threads", String(threads), "-O", "z", vcfIn);
        steps.push(normParts.join(" "));
    }

    // Step 2: annotate
    if (p["annotate_db_vcf"]) {
        const annotParts = ["bcftools", "annotate"];
        annotParts.push("--annotations", p["annotate_db_vcf"]);
        annotParts.push("--columns", p["annotate_columns"] || "ID");
        if (p["remove_info_fields"]) { annotParts.push("--remove", p["remove_info_fields"]); }
        annotParts.push("--threads", String(threads), "-O", "z");
        if (steps.length === 0) annotParts.push(vcfIn);
        steps.push(annotParts.join(" "));
    }

    // Step 3: filter
    {
        const filterParts = ["bcftools", "filter"];
        let expr = "QUAL>=" + (p["min_qual"]   !== undefined ? p["min_qual"]   : 30) +
                   " && INFO/DP>=" + (p["min_depth"] !== undefined ? p["min_depth"] : 8);
        if (p["min_gq"]          && parseInt(p["min_gq"],          10) > 0) expr += " && FORMAT/GQ>="      + p["min_gq"];
        if (p["min_depth_format"]&& parseInt(p["min_depth_format"],10) > 0) expr += " && FORMAT/DP>="      + p["min_depth_format"];
        if (p["min_alt_reads"]   && parseInt(p["min_alt_reads"],   10) > 0) expr += " && FORMAT/AD[*:1]>=" + p["min_alt_reads"];
        if (p["include_expression"]) expr = "(" + expr + ") && (" + p["include_expression"] + ")";
        filterParts.push("-i", '"' + expr + '"');
        if (p["soft_filter_name"]) {
            filterParts.push("--soft-filter", '"' + p["soft_filter_name"] + '"');
            filterParts.push("--mode", p["filter_mode"] || "+");
        }
        if (p["exclude_expression"]) filterParts.push("-e", '"' + p["exclude_expression"] + '"');
        filterParts.push("--threads", String(threads), "-O", "z");
        if (steps.length === 0) filterParts.push(vcfIn);
        steps.push(filterParts.join(" "));
    }

    // Step 4: view
    {
        const viewParts = ["bcftools", "view"];
        if (p["pass_only"]) viewParts.push("-f", "PASS,.");
        if (p["variant_type"] && p["variant_type"] !== "all" && !p["exclude_type"]) {
            viewParts.push("-v", p["variant_type"]);
        }
        if (p["exclude_type"])                                         viewParts.push("-V", p["exclude_type"]);
        if (p["max_alleles"] && parseInt(p["max_alleles"], 10) > 0)   viewParts.push("-M", String(p["max_alleles"]));
        if (p["min_alleles"] && parseInt(p["min_alleles"], 10) > 2)   viewParts.push("-m", String(p["min_alleles"]));
        if (p["known_only"])      viewParts.push("-k");
        if (p["novel_only"])      viewParts.push("-n");
        if (p["genotype_filter"]) viewParts.push("-g", p["genotype_filter"]);
        if (p["samples"])         viewParts.push("-s", p["samples"]);
        if (p["samples_file"])    viewParts.push("-S", p["samples_file"]);
        if (p["regions"])         viewParts.push("-r", p["regions"]);
        if (p["regions_file"])    viewParts.push("-R", p["regions_file"]);
        if (p["targets"])         viewParts.push("-t", p["targets"]);
        if (p["targets_file"])    viewParts.push("-T", p["targets_file"]);
        viewParts.push("--threads", String(threads), "-O", outType, "-o", vcfOut);
        steps.push(viewParts.join(" "));
    }

    return steps.join(" \\\n  | ");
}

export function parseBcftoolsCommand(cmdStr, node, _plugin) {
    const raw      = cmdStr.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
    const segments = raw.split("|");

    const params = {};
    let vcfIn  = "";
    let vcfOut = "";

    for (const seg of segments) {
        const tok = tokenize(seg.trim());
        if (!tok.length) continue;

        let tidx   = 0;
        let subcmd = "";
        while (tidx < tok.length && tok[tidx] !== "bcftools") tidx++;
        tidx++;
        if (tidx < tok.length) { subcmd = tok[tidx]; tidx++; }

        if (subcmd === "norm") {
            params["normalize"] = true;
            while (tidx < tok.length) {
                const t = tok[tidx];
                if (t === "-f"  && tidx + 1 < tok.length) { params["reference_fa"]        = tok[++tidx]; tidx++; continue; }
                if (t === "-m"  && tidx + 1 < tok.length) { params["split_multiallelic"]   = tok[++tidx]; tidx++; continue; }
                if (t === "-c"  && tidx + 1 < tok.length) { params["check_ref"]            = tok[++tidx]; tidx++; continue; }
                if (t === "--no-normalize")                { params["do_not_normalize"]     = true; tidx++; continue; }
                if (t === "--threads" && tidx + 1 < tok.length) { params["threads"]        = parseInt(tok[++tidx], 10) || 4; tidx++; continue; }
                if ((t === "-O" || t === "-o") && tidx + 1 < tok.length) { tidx += 2; continue; }
                if (!t.startsWith("-")) vcfIn = t;
                tidx++;
            }
        } else if (subcmd === "annotate") {
            while (tidx < tok.length) {
                const ta = tok[tidx];
                if (ta === "--annotations" && tidx + 1 < tok.length) { params["annotate_db_vcf"]    = tok[++tidx]; tidx++; continue; }
                if (ta === "--columns"     && tidx + 1 < tok.length) { params["annotate_columns"]   = tok[++tidx]; tidx++; continue; }
                if (ta === "--remove"      && tidx + 1 < tok.length) { params["remove_info_fields"] = tok[++tidx]; tidx++; continue; }
                if ((ta === "-O" || ta === "--threads") && tidx + 1 < tok.length) { tidx += 2; continue; }
                if (!ta.startsWith("-") && !vcfIn) vcfIn = ta;
                tidx++;
            }
        } else if (subcmd === "filter") {
            while (tidx < tok.length) {
                const tf = tok[tidx];
                if (tf === "-i" && tidx + 1 < tok.length) {
                    const expr = tok[++tidx]; tidx++;
                    const qualM = expr.match(/QUAL>=([0-9.]+)/);
                    const dpM   = expr.match(/INFO\/DP>=(\d+)/);
                    const gqM   = expr.match(/FORMAT\/GQ>=(\d+)/);
                    const fdpM  = expr.match(/FORMAT\/DP>=(\d+)/);
                    const altM  = expr.match(/FORMAT\/AD\[\*:1\]>=(\d+)/);
                    if (qualM) params["min_qual"]         = parseFloat(qualM[1]);
                    if (dpM)   params["min_depth"]        = parseInt(dpM[1],  10);
                    if (gqM)   params["min_gq"]           = parseInt(gqM[1],  10);
                    if (fdpM)  params["min_depth_format"] = parseInt(fdpM[1], 10);
                    if (altM)  params["min_alt_reads"]    = parseInt(altM[1], 10);
                    continue;
                }
                if (tf === "-e"           && tidx + 1 < tok.length) { params["exclude_expression"] = tok[++tidx]; tidx++; continue; }
                if (tf === "--soft-filter"&& tidx + 1 < tok.length) { params["soft_filter_name"]   = tok[++tidx]; tidx++; continue; }
                if (tf === "--mode"       && tidx + 1 < tok.length) { params["filter_mode"]        = tok[++tidx]; tidx++; continue; }
                if ((tf === "-O" || tf === "--threads") && tidx + 1 < tok.length) { tidx += 2; continue; }
                tidx++;
            }
        } else if (subcmd === "view") {
            while (tidx < tok.length) {
                const tv = tok[tidx];
                if (tv === "-f"  && tidx + 1 < tok.length) { params["pass_only"]       = tok[++tidx].includes("PASS"); tidx++; continue; }
                if (tv === "-v"  && tidx + 1 < tok.length) { params["variant_type"]    = tok[++tidx]; tidx++; continue; }
                if (tv === "-V"  && tidx + 1 < tok.length) { params["exclude_type"]    = tok[++tidx]; tidx++; continue; }
                if (tv === "-M"  && tidx + 1 < tok.length) { params["max_alleles"]     = parseInt(tok[++tidx], 10); tidx++; continue; }
                if (tv === "-m"  && tidx + 1 < tok.length) { params["min_alleles"]     = parseInt(tok[++tidx], 10); tidx++; continue; }
                if (tv === "-k")                            { params["known_only"]      = true; tidx++; continue; }
                if (tv === "-n")                            { params["novel_only"]      = true; tidx++; continue; }
                if (tv === "-g"  && tidx + 1 < tok.length) { params["genotype_filter"] = tok[++tidx]; tidx++; continue; }
                if (tv === "-s"  && tidx + 1 < tok.length) { params["samples"]         = tok[++tidx]; tidx++; continue; }
                if (tv === "-S"  && tidx + 1 < tok.length) { params["samples_file"]    = tok[++tidx]; tidx++; continue; }
                if (tv === "-r"  && tidx + 1 < tok.length) { params["regions"]         = tok[++tidx]; tidx++; continue; }
                if (tv === "-R"  && tidx + 1 < tok.length) { params["regions_file"]    = tok[++tidx]; tidx++; continue; }
                if (tv === "-t"  && tidx + 1 < tok.length) { params["targets"]         = tok[++tidx]; tidx++; continue; }
                if (tv === "-T"  && tidx + 1 < tok.length) { params["targets_file"]    = tok[++tidx]; tidx++; continue; }
                if (tv === "-O"  && tidx + 1 < tok.length) { params["output_type"]     = tok[++tidx]; tidx++; continue; }
                if (tv === "-o"  && tidx + 1 < tok.length) { vcfOut                    = tok[++tidx]; tidx++; continue; }
                if (tv === "--threads" && tidx + 1 < tok.length) { params["threads"]   = parseInt(tok[++tidx], 10) || 4; tidx++; continue; }
                tidx++;
            }
        }

        if (!vcfIn) {
            for (const pt of tok) {
                if (!pt.startsWith("-") && pt !== "bcftools" && pt !== subcmd) {
                    vcfIn = pt; break;
                }
            }
        }
    }

    node.params      = params;
    node.inputs_map  = {};
    node.outputs_map = {};
    if (vcfIn)  node.inputs_map["vcf_in"]   = vcfIn;
    if (vcfOut) node.outputs_map["vcf_out"] = vcfOut;
}
