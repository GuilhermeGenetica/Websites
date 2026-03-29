/**
 * modules/tools/bedtools.js — SeqNode-OS BEDtools Tool Module
 *
 * Porta 1:1 de gf-bedtools.js.
 * Exporta: isBedtools, buildBedtoolsCommand, parseBedtoolsCommand.
 */

import { tokenize } from "./samtools.js";

export function isBedtools(plugin) {
    if (!plugin) return false;
    if (plugin.id === "bedtools_intersect" || plugin.id.indexOf("bedtools") === 0) return true;
    const cmdStr = typeof plugin.command === "string"
        ? plugin.command
        : (plugin.command && plugin.command.template ? plugin.command.template : "");
    return (cmdStr.trim().split(/\s+/)[0] || "") === "bedtools";
}

export function buildBedtoolsCommand(node, _plugin, resolveRef) {
    const p = node.params;

    const fileA  = resolveRef(node.inputs_map["file_a"] || "");
    const fileB  = resolveRef(node.inputs_map["file_b"] || "");
    const outBed = node.outputs_map["output_bed"] || "output.bed";

    const mode  = p["mode"] || "intersect";
    const parts = [];

    if (mode === "merge") {
        if (fileB) {
            parts.push("cat", fileA, fileB, "|", "bedtools sort", "|");
        } else {
            parts.push("bedtools sort -i", fileA, "|");
        }
        parts.push("bedtools merge");
        if (p["merge_distance"] && parseInt(p["merge_distance"], 10) !== 0) {
            parts.push("-d", String(p["merge_distance"]));
        }
        if (p["merge_columns"]) {
            parts.push("-c", p["merge_columns"]);
            parts.push("-o", p["merge_operations"] || "collapse");
        }

    } else if (mode === "sort") {
        parts.push("bedtools sort -i", fileA);

    } else if (mode === "subtract") {
        parts.push("bedtools subtract", "-a", fileA, "-b", fileB);
        if (p["require_overlap_fraction"] > 0) parts.push("-f", String(p["require_overlap_fraction"]));
        if (p["reciprocal"])       parts.push("-r");
        if (p["invert"])           parts.push("-v");
        if (p["same_strand"])      parts.push("-s");
        if (p["opposite_strand"])  parts.push("-S");
        if (p["chromosome_sort"])  parts.push("-sorted");

    } else if (mode === "window") {
        parts.push("bedtools window", "-a", fileA, "-b", fileB);
        const wl = parseInt(p["window_left"],  10) || 0;
        const wr = parseInt(p["window_right"], 10) || 0;
        if (wl > 0 || wr > 0) {
            parts.push("-l", String(wl), "-r", String(wr));
        } else {
            parts.push("-w", String(p["window_size"] || 1000));
        }
        if (p["invert"])           parts.push("-v");
        if (p["same_strand"])      parts.push("-sm");
        if (p["opposite_strand"])  parts.push("-Sm");
        if (p["write_original_a"]) parts.push("-wa");
        if (p["write_original_b"]) parts.push("-wb");

    } else if (mode === "closest") {
        parts.push("bedtools closest", "-a", fileA, "-b", fileB);
        parts.push("-k", String(p["closest_k"] || 1));
        if (p["closest_upstream_only"])    parts.push("-iu");
        if (p["closest_downstream_only"])  parts.push("-id");
        if (p["closest_exclude_overlaps"]) parts.push("-io");
        if (p["same_strand"])              parts.push("-s");

    } else if (mode === "coverage") {
        // coverage swaps A and B
        parts.push("bedtools coverage", "-a", fileB, "-b", fileA);
        if (p["same_strand"]) parts.push("-s");
        if (p["split_bam"])   parts.push("-split");

    } else if (mode === "slop") {
        parts.push("bedtools slop", "-i", fileA, "-g", p["genome_file"] || "");
        const fl = parseInt(p["flank_left"],  10) || 0;
        const fr = parseInt(p["flank_right"], 10) || 0;
        if (fl > 0 || fr > 0) {
            parts.push("-l", String(fl), "-r", String(fr));
        } else {
            parts.push("-b", String(p["flank_size"] || 100));
        }

    } else if (mode === "complement") {
        parts.push("bedtools complement", "-i", fileA, "-g", p["genome_file"] || "");

    } else if (mode === "genomecov") {
        parts.push("bedtools genomecov");
        const ext = (fileA || "").split(".").pop().toLowerCase();
        if (ext === "bam") {
            parts.push("-ibam", fileA);
        } else {
            parts.push("-i", fileA, "-g", p["genome_file"] || "");
        }

    } else {
        // intersect (default)
        parts.push("bedtools intersect", "-a", fileA, "-b", fileB);
        if (p["invert"])           parts.push("-v");
        if (p["write_original_a"]) parts.push("-wa");
        if (p["write_original_b"]) parts.push("-wb");
        if (p["left_outer_join"])  parts.push("-loj");
        if (p["count_overlaps"])   parts.push("-c");
        if (p["report_n_bases"])   parts.push("-wo");
        if (p["require_overlap_fraction"]   > 0) parts.push("-f", String(p["require_overlap_fraction"]));
        if (p["require_overlap_fraction_b"] > 0) parts.push("-F", String(p["require_overlap_fraction_b"]));
        if (p["reciprocal"])       parts.push("-r");
        if (p["either_direction"]) parts.push("-e");
        if (p["same_strand"])      parts.push("-s");
        if (p["opposite_strand"])  parts.push("-S");
        if (p["chromosome_sort"])  parts.push("-sorted");
        if (p["split_bam"])        parts.push("-split");
    }

    parts.push(">", outBed);
    return parts.join(" ");
}

export function parseBedtoolsCommand(cmdStr, node, _plugin) {
    let raw = cmdStr.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();

    let outBed = "";
    const redIdx = raw.lastIndexOf(" > ");
    if (redIdx > 0) {
        outBed = raw.substring(redIdx + 3).trim();
        raw    = raw.substring(0, redIdx).trim();
    }

    const params = {};
    let fileA  = "";
    let fileB  = "";

    const modeMatches = raw.match(/bedtools\s+(intersect|subtract|window|merge|closest|coverage|slop|sort|complement|genomecov)/g);
    let subcmd = "intersect";
    if (modeMatches && modeMatches.length > 0) {
        subcmd = modeMatches[modeMatches.length - 1].split(/\s+/)[1];
    }
    params["mode"] = subcmd;

    const segs    = raw.split("|");
    const mainSeg = segs[segs.length - 1].trim();
    const tok     = tokenize(mainSeg);

    let tidx = 0;
    while (tidx < tok.length && tok[tidx] !== "bedtools") tidx++;
    tidx += 2; // skip "bedtools <subcmd>"

    while (tidx < tok.length) {
        const t = tok[tidx];
        switch (t) {
            case "-a":   fileA = tok[++tidx]; tidx++; break;
            case "-ibam": fileA = tok[++tidx]; tidx++; break;
            case "-i":   fileA = tok[++tidx]; tidx++; break;
            case "-b":
                if (subcmd === "slop") { params["flank_size"] = parseInt(tok[++tidx], 10); tidx++; }
                else { fileB = tok[++tidx]; tidx++; }
                break;
            case "-g":    params["genome_file"]              = tok[++tidx]; tidx++; break;
            case "-f":    params["require_overlap_fraction"] = parseFloat(tok[++tidx]); tidx++; break;
            case "-F":    params["require_overlap_fraction_b"] = parseFloat(tok[++tidx]); tidx++; break;
            case "-r":
                if (subcmd === "window") { params["window_right"] = parseInt(tok[++tidx], 10); tidx++; }
                else if (subcmd === "slop") { params["flank_right"] = parseInt(tok[++tidx], 10); tidx++; }
                else { params["reciprocal"] = true; tidx++; }
                break;
            case "-e":    params["either_direction"]   = true; tidx++; break;
            case "-v":    params["invert"]             = true; tidx++; break;
            case "-wa":   params["write_original_a"]   = true; tidx++; break;
            case "-wb":   params["write_original_b"]   = true; tidx++; break;
            case "-loj":  params["left_outer_join"]    = true; tidx++; break;
            case "-c":
                if (subcmd === "merge") { params["merge_columns"]  = tok[++tidx]; tidx++; }
                else { params["count_overlaps"] = true; tidx++; }
                break;
            case "-o":
                if (subcmd === "merge") { params["merge_operations"] = tok[++tidx]; tidx++; }
                else tidx++;
                break;
            case "-wo":   params["report_n_bases"]     = true; tidx++; break;
            case "-s":    params["same_strand"]        = true; tidx++; break;
            case "-S":    params["opposite_strand"]    = true; tidx++; break;
            case "-sm":   params["same_strand"]        = true; tidx++; break;
            case "-Sm":   params["opposite_strand"]    = true; tidx++; break;
            case "-sorted": params["chromosome_sort"]  = true; tidx++; break;
            case "-split":  params["split_bam"]        = true; tidx++; break;
            case "-w":    params["window_size"]        = parseInt(tok[++tidx], 10); tidx++; break;
            case "-l":
                if (subcmd === "window") { params["window_left"] = parseInt(tok[++tidx], 10); tidx++; }
                else { params["flank_left"] = parseInt(tok[++tidx], 10); tidx++; }
                break;
            case "-d":    params["merge_distance"]     = parseInt(tok[++tidx], 10); tidx++; break;
            case "-k":    params["closest_k"]          = parseInt(tok[++tidx], 10); tidx++; break;
            case "-iu":   params["closest_upstream_only"]    = true; tidx++; break;
            case "-id":   params["closest_downstream_only"]  = true; tidx++; break;
            case "-io":   params["closest_exclude_overlaps"] = true; tidx++; break;
            default: tidx++;
        }
    }

    if (subcmd === "merge" && segs.length > 1) {
        const firstSeg = segs[0].trim().split(/\s+/);
        if (firstSeg[0] === "cat" && firstSeg.length >= 3) {
            fileA = firstSeg[1]; fileB = firstSeg[2];
        } else if (firstSeg[0] === "bedtools") {
            const sortI = firstSeg.indexOf("-i");
            if (sortI >= 0 && sortI + 1 < firstSeg.length) fileA = firstSeg[sortI + 1];
        }
    }

    if (subcmd === "coverage") {
        const tmp = fileA; fileA = fileB; fileB = tmp;
    }

    node.params      = params;
    node.inputs_map  = {};
    node.outputs_map = {};
    if (fileA)  node.inputs_map["file_a"]      = fileA;
    if (fileB)  node.inputs_map["file_b"]      = fileB;
    if (outBed) node.outputs_map["output_bed"] = outBed;
}
