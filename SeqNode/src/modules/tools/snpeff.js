/**
 * modules/tools/snpeff.js — SeqNode-OS SnpEff + SnpSift Tool Module
 *
 * Porta 1:1 de gf-snpeff.js.
 * Exporta: isSnpeff, buildSnpeffCommand, parseSnpeffCommand, SNPEFF_BOOL_FLAGS.
 */

import { tokenize } from "./samtools.js";

export const SNPEFF_BOOL_FLAGS = {
    canon_only:            "-canon",
    only_protein_coding:   "-onlyProtein",
    one_per_line:          "-onePerLine",
    hgvs:                  "-hgvs",
    hgvs_1_letter:         "-hgvs1LetterAa",
    hgvs_old:              "-hgvsOld",
    no_downstream:         "-noDownstream",
    no_upstream:           "-noUpstream",
    no_intron:             "-noIntron",
    no_intergenic:         "-noIntergenic",
};

export function isSnpeff(plugin) {
    if (!plugin) return false;
    if (plugin.id === "snpeff_annotate" || plugin.id.indexOf("snpeff") === 0) return true;
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    const firstWord = cmdStr.trim().split(/\s+/)[0] || "";
    return (firstWord === "snpEff" || firstWord === "SnpSift");
}

export function buildSnpeffCommand(node, _plugin, resolveRef) {
    const p = node.params;

    const vcfIn    = resolveRef(node.inputs_map["vcf_in"]    || "");
    const vcfOut   = node.outputs_map["vcf_out"]                        || "snpeff_out.vcf";
    const statsHtml = node.outputs_map["stats_html"]                    || "";
    const statsCsv  = node.outputs_map["stats_csv"]                     || "";
    const finalVcf  = node.outputs_map["clinvar_annotated_vcf"]         || vcfOut;

    const jmem     = p["java_memory"] || "8g";
    const genomeDb = p["genome_db"]   || "GRCh38.p14";

    // Step 1: snpEff
    const snpeffParts = ["snpEff", "-Xmx" + jmem];
    if (p["snpeff_data_dir"]) { snpeffParts.push("-dataDir", p["snpeff_data_dir"]); }
    snpeffParts.push(genomeDb);

    for (const bflag in SNPEFF_BOOL_FLAGS) {
        if (p[bflag]) snpeffParts.push(SNPEFF_BOOL_FLAGS[bflag]);
    }
    if (p["preferred_transcripts_file"]) {
        snpeffParts.push("-canonList", p["preferred_transcripts_file"]);
    }
    if (p["generate_html_stats"] && statsHtml) {
        snpeffParts.push("-stats", statsHtml);
    }
    if (p["csv_stats"] && statsCsv) {
        snpeffParts.push("-csvStats", statsCsv);
    }
    snpeffParts.push(vcfIn);
    snpeffParts.push(">", vcfOut);

    const steps = [snpeffParts.join(" ")];

    // Step 2: SnpSift ClinVar
    if (p["clinvar_vcf"]) {
        const cvParts = ["SnpSift", "-Xmx" + jmem, "annotate"];
        cvParts.push("-info", p["clinvar_fields"] || "CLNSIG,CLNREVSTAT,CLNDN");
        cvParts.push(p["clinvar_vcf"]);
        cvParts.push("$CURRENT_VCF");
        cvParts.push("> $TMP_CV");
        steps.push(cvParts.join(" "));
    }

    // Step 3: SnpSift dbSNP
    if (p["dbsnp_vcf"]) {
        const dbParts = ["SnpSift", "-Xmx" + jmem, "annotate", "-id"];
        dbParts.push(p["dbsnp_vcf"]);
        dbParts.push("$CURRENT_VCF");
        dbParts.push("> $TMP_DB");
        steps.push(dbParts.join(" "));
    }

    // Step 4: extra DB
    if (p["extra_db_vcf"]) {
        const exParts = ["SnpSift", "-Xmx" + jmem, "annotate"];
        if (p["extra_db_fields"]) { exParts.push("-info", p["extra_db_fields"]); }
        exParts.push(p["extra_db_vcf"]);
        exParts.push("$CURRENT_VCF");
        exParts.push("> $TMP_EX");
        steps.push(exParts.join(" "));
    }

    // Step 5: SnpSift filter
    if (p["snpsift_filter_expression"]) {
        const filtParts = ["SnpSift", "-Xmx" + jmem, "filter"];
        if (p["snpsift_filter_inverse"]) filtParts.push("-n");
        filtParts.push('"' + p["snpsift_filter_expression"] + '"');
        filtParts.push("$CURRENT_VCF");
        filtParts.push(">", finalVcf);
        steps.push(filtParts.join(" "));
    } else if (p["clinvar_vcf"] || p["dbsnp_vcf"] || p["extra_db_vcf"]) {
        steps.push("cp $CURRENT_VCF " + finalVcf);
    }

    return steps.join("\n");
}

export function parseSnpeffCommand(cmdStr, node, _plugin) {
    const params    = {};
    let vcfIn       = "";
    let vcfOut      = "";
    let statsHtml   = "";
    let statsCsv    = "";
    let finalVcf    = "";

    const lines = cmdStr.split(/\n/);
    for (const line of lines) {
        const l = line.replace(/\\\n/g, " ").trim();
        if (!l || l.startsWith("#")) continue;

        const tok  = tokenize(l);
        if (!tok.length) continue;
        const bin  = tok[0];
        let tidx   = 1;

        if (bin === "snpEff") {
            if (tidx < tok.length && tok[tidx].startsWith("-Xmx")) {
                params["java_memory"] = tok[tidx].substring(4); tidx++;
            }
            if (tidx < tok.length && tok[tidx] === "-dataDir") {
                params["snpeff_data_dir"] = tok[++tidx]; tidx++;
            }
            // Parse flags then genome_db
            while (tidx < tok.length && tok[tidx].startsWith("-")) {
                const sf = tok[tidx];
                let matched = false;
                for (const bflag in SNPEFF_BOOL_FLAGS) {
                    if (sf === SNPEFF_BOOL_FLAGS[bflag]) {
                        params[bflag] = true; matched = true; break;
                    }
                }
                if (!matched) {
                    if (sf === "-stats"     && tidx + 1 < tok.length) { statsHtml = tok[++tidx]; params["generate_html_stats"] = true; }
                    else if (sf === "-csvStats" && tidx + 1 < tok.length) { statsCsv = tok[++tidx]; params["csv_stats"] = true; }
                    else if (sf === "-canonList"&& tidx + 1 < tok.length) { params["preferred_transcripts_file"] = tok[++tidx]; }
                }
                tidx++;
            }
            if (tidx < tok.length && !tok[tidx].startsWith("-") &&
                !tok[tidx].startsWith("$") && tok[tidx] !== ">") {
                params["genome_db"] = tok[tidx]; tidx++;
            }
            const redPos  = tok.indexOf(">");
            const inputPos = (redPos > 0) ? redPos - 1 : tok.length - 1;
            if (inputPos >= tidx) vcfIn = tok[inputPos];
            if (redPos >= 0 && redPos + 1 < tok.length) vcfOut = tok[redPos + 1];

        } else if (bin === "SnpSift") {
            if (tidx < tok.length && tok[tidx].startsWith("-Xmx")) {
                if (!params["java_memory"]) params["java_memory"] = tok[tidx].substring(4);
                tidx++;
            }
            const subcmd = tok[tidx++] || "";

            if (subcmd === "annotate") {
                let isId = false;
                let infoFields = "";
                let dbFile = "";
                while (tidx < tok.length) {
                    const ta = tok[tidx];
                    if (ta === "-id") { isId = true; tidx++; continue; }
                    if (ta === "-info" && tidx + 1 < tok.length) { infoFields = tok[++tidx]; tidx++; continue; }
                    if (ta === ">"   && tidx + 1 < tok.length)   { finalVcf   = tok[++tidx]; tidx++; continue; }
                    if (!ta.startsWith("-") && !ta.startsWith("$")) { dbFile = ta; tidx++; break; }
                    tidx++;
                }
                if (isId) {
                    params["dbsnp_vcf"] = dbFile;
                } else if (infoFields) {
                    if (!params["clinvar_vcf"] && infoFields.indexOf("CLNSIG") >= 0) {
                        params["clinvar_vcf"]    = dbFile;
                        params["clinvar_fields"] = infoFields;
                    } else {
                        params["extra_db_vcf"]    = dbFile;
                        params["extra_db_fields"] = infoFields;
                    }
                } else if (dbFile) {
                    params["extra_db_vcf"] = dbFile;
                }

            } else if (subcmd === "filter") {
                if (tidx < tok.length && tok[tidx] === "-n") {
                    params["snpsift_filter_inverse"] = true; tidx++;
                }
                if (tidx < tok.length && !tok[tidx].startsWith("$")) {
                    params["snpsift_filter_expression"] = tok[tidx]; tidx++;
                }
                const fRedPos = tok.indexOf(">");
                if (fRedPos >= 0 && fRedPos + 1 < tok.length) finalVcf = tok[fRedPos + 1];
            }
        }
    }

    node.params      = params;
    node.inputs_map  = {};
    node.outputs_map = {};
    if (vcfIn)     node.inputs_map["vcf_in"]                  = vcfIn;
    if (vcfOut)    node.outputs_map["vcf_out"]                = vcfOut;
    if (statsHtml) node.outputs_map["stats_html"]             = statsHtml;
    if (statsCsv)  node.outputs_map["stats_csv"]              = statsCsv;
    if (finalVcf)  node.outputs_map["clinvar_annotated_vcf"]  = finalVcf;
}
