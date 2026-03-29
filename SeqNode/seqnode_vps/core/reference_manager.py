import os
import json
import shutil
import asyncio
import threading
import logging
from typing import Dict, Any, List, Optional, Callable

logger = logging.getLogger("seqnode.reference_manager")

REFERENCE_CATALOG: Dict[str, Any] = {
    "genomes": {
        "hg38_ucsc": {
            "label": "hg38 (UCSC)",
            "url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/bigZips/hg38.fa.gz",
            "filename": "hg38.fa.gz",
            "subdir": "genomes/hg38",
            "build": "hg38",
            "index_files": ["hg38.fa.fai", "hg38.fa.amb", "hg38.fa.ann", "hg38.fa.bwt"],
        },
        "hg19_ucsc": {
            "label": "hg19 (UCSC)",
            "url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/bigZips/hg19.fa.gz",
            "filename": "hg19.fa.gz",
            "subdir": "genomes/hg19",
            "build": "hg19",
            "index_files": ["hg19.fa.fai", "hg19.fa.amb", "hg19.fa.ann", "hg19.fa.bwt"],
        },
        "grch38_ensembl": {
            "label": "GRCh38 (Ensembl)",
            "url": "https://ftp.ensembl.org/pub/release-113/fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.primary_assembly.fa.gz",
            "filename": "GRCh38.primary_assembly.fa.gz",
            "subdir": "genomes/GRCh38",
            "build": "GRCh38",
            "index_files": [],
        },
        "grch37_ensembl": {
            "label": "GRCh37 (Ensembl)",
            "url": "https://ftp.ensembl.org/pub/grch37/current/fasta/homo_sapiens/dna/Homo_sapiens.GRCh37.dna.primary_assembly.fa.gz",
            "filename": "GRCh37.primary_assembly.fa.gz",
            "subdir": "genomes/GRCh37",
            "build": "GRCh37",
            "index_files": [],
        },
        "hs37d5": {
            "label": "hs37d5 (1000G Phase2 decoy)",
            "url": "ftp://ftp.1000genomes.ebi.ac.uk/vol1/ftp/technical/reference/phase2_reference_assembly_sequence/hs37d5.fa.gz",
            "filename": "hs37d5.fa.gz",
            "subdir": "genomes/hs37d5",
            "build": "GRCh37",
            "index_files": [],
        },
        "grch38dh": {
            "label": "GRCh38DH (1000G + ALT + HLA)",
            "url": "ftp://ftp.1000genomes.ebi.ac.uk/vol1/ftp/technical/reference/GRCh38_reference_genome/GRCh38_full_analysis_set_plus_decoy_hlas.fa",
            "filename": "GRCh38DH.fa",
            "subdir": "genomes/GRCh38DH",
            "build": "GRCh38",
            "index_files": [],
        },
    },
    "annotation": {
        "clinvar_grch38": {
            "label": "ClinVar VCF (GRCh38)",
            "url": "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/clinvar.vcf.gz",
            "filename": "clinvar_grch38.vcf.gz",
            "subdir": "annotation/clinvar",
            "build": "hg38",
            "index_files": ["clinvar_grch38.vcf.gz.tbi"],
        },
        "clinvar_grch37": {
            "label": "ClinVar VCF (GRCh37)",
            "url": "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh37/clinvar.vcf.gz",
            "filename": "clinvar_grch37.vcf.gz",
            "subdir": "annotation/clinvar",
            "build": "hg19",
            "index_files": ["clinvar_grch37.vcf.gz.tbi"],
        },
        "dbsnp_grch38": {
            "label": "dbSNP 156 (GRCh38)",
            "url": "https://ftp.ncbi.nlm.nih.gov/snp/latest_release/VCF/GCF_000001405.40.gz",
            "filename": "dbsnp156_grch38.vcf.gz",
            "subdir": "annotation/dbsnp",
            "build": "hg38",
            "index_files": [],
        },
        "segdups_hg38": {
            "label": "Segmental Duplications (hg38)",
            "url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/database/genomicSuperDups.txt.gz",
            "filename": "genomicSuperDups_hg38.txt.gz",
            "subdir": "annotation/segdups",
            "build": "hg38",
            "index_files": [],
        },
    },
    "tool_dbs": {
        "annotsv_db": {
            "label": "AnnotSV Annotation Database",
            "url": "https://github.com/lgmgeo/AnnotSV/releases/download/v3.4/AnnotSV_annotations_Exomiser.tar.gz",
            "filename": "AnnotSV_annotations_Exomiser.tar.gz",
            "subdir": "tool_dbs/annotsv",
            "build": "all",
            "index_files": [],
        },
        "gnomad_sv_hg38": {
            "label": "gnomAD SV v4.1 (hg38)",
            "url": "https://storage.googleapis.com/gcp-public-data--gnomad/papers/2019-sv/gnomad_v2.1_sv.sites.vcf.gz",
            "filename": "gnomad_sv_hg38.vcf.gz",
            "subdir": "tool_dbs/gnomad_sv",
            "build": "hg38",
            "index_files": ["gnomad_sv_hg38.vcf.gz.tbi"],
        },
    },
}

_download_tasks: Dict[str, Any] = {}
_dl_lock = threading.Lock()
_event_loop: Optional[asyncio.AbstractEventLoop] = None


def set_event_loop(loop: asyncio.AbstractEventLoop):
    global _event_loop
    _event_loop = loop


def load_custom_refs(custom_refs_file: str) -> Dict[str, Any]:
    if os.path.exists(custom_refs_file):
        try:
            with open(custom_refs_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_custom_refs(custom_refs_file: str, data: Dict[str, Any]):
    try:
        dir_path = os.path.dirname(custom_refs_file)
        if dir_path:  # protege contra os.makedirs('') quando dirname é vazio
            os.makedirs(dir_path, exist_ok=True)
        with open(custom_refs_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        logger.error(f"Failed to save custom refs: {e}")


def get_merged_catalog(
    custom_refs_file: str,
    refs_base: str = "/data/references",
) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    all_refs = {cat: dict(refs) for cat, refs in REFERENCE_CATALOG.items()}

    custom = load_custom_refs(custom_refs_file)
    for cat, cat_refs in custom.items():
        if cat not in all_refs:
            all_refs[cat] = {}
        for ref_id, ref_info in cat_refs.items():
            ref_info["custom"] = True
            all_refs[cat][ref_id] = ref_info

    for category, refs in all_refs.items():
        result[category] = {}
        for ref_id, ref_info in refs.items():
            subdir_path = os.path.join(refs_base, ref_info.get("subdir", ""))
            fname       = ref_info.get("filename", "")
            gz_path     = os.path.join(subdir_path, fname)
            plain_path  = os.path.join(subdir_path, fname.replace(".gz", "").replace(".tar", ""))
            installed   = os.path.exists(plain_path) or os.path.exists(gz_path)

            idx_ok = True
            if ref_info.get("index_files"):
                idx_ok = all(
                    os.path.exists(os.path.join(subdir_path, ix))
                    for ix in ref_info["index_files"]
                )

            task = _download_tasks.get(ref_id, {})
            result[category][ref_id] = {
                **ref_info,
                "installed":         installed,
                "index_ok":          idx_ok,
                "path":              plain_path if installed else gz_path if os.path.exists(gz_path) else "",
                "dest_dir":          subdir_path,
                "download_status":   task.get("status",   "idle"),
                "download_progress": task.get("progress", 0),
                "download_message":  task.get("message",  ""),
            }
    return result


def get_all_download_progress() -> Dict[str, Any]:
    return dict(_download_tasks)


def get_download_progress(ref_id: str) -> Dict[str, Any]:
    return _download_tasks.get(ref_id, {"status": "idle", "progress": 0, "message": ""})


def start_download(
    ref_id: str,
    custom_refs_file: str,
    refs_base: str = "/data/references",
    broadcast_fn: Optional[Callable] = None,
) -> Dict[str, Any]:
    ref_info = None
    for cat_refs in REFERENCE_CATALOG.values():
        if ref_id in cat_refs:
            ref_info = cat_refs[ref_id]
            break

    if not ref_info:
        custom = load_custom_refs(custom_refs_file)
        for cat_refs in custom.values():
            if ref_id in cat_refs:
                ref_info = cat_refs[ref_id]
                break

    if not ref_info:
        return {"error": f"Reference '{ref_id}' not in catalog.", "ref_id": ref_id}

    with _dl_lock:
        if _download_tasks.get(ref_id, {}).get("status") == "downloading":
            return {"status": "already_running", "ref_id": ref_id}
        _download_tasks[ref_id] = {"status": "downloading", "progress": 0, "message": "Starting..."}

    dest_dir = os.path.join(refs_base, ref_info["subdir"])

    def _do_download():
        def _broadcast(payload: dict):
            if broadcast_fn and _event_loop and not _event_loop.is_closed():
                try:
                    asyncio.run_coroutine_threadsafe(broadcast_fn(payload), _event_loop)
                except Exception as ex:
                    logger.debug(f"Broadcast error during download: {ex}")

        try:
            os.makedirs(dest_dir, exist_ok=True)
            dest_file = os.path.join(dest_dir, ref_info["filename"])
            url = ref_info["url"]

            if shutil.which("wget"):
                cmd = ["wget", "-c", "--progress=dot:giga", "-O", dest_file, url]
            elif shutil.which("curl"):
                cmd = ["curl", "-L", "-C", "-", "--progress-bar", "-o", dest_file, url]
            else:
                _download_tasks[ref_id]["status"]  = "error"
                _download_tasks[ref_id]["message"] = "Neither wget nor curl found."
                _broadcast({"type": "download_progress", "ref_id": ref_id, **_download_tasks[ref_id]})
                return

            import subprocess
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            for line in proc.stdout:
                _download_tasks[ref_id]["message"] = line.strip()[-120:]
                _broadcast({"type": "download_progress", "ref_id": ref_id, **_download_tasks[ref_id]})
            proc.wait()

            if proc.returncode == 0:
                _download_tasks[ref_id]["status"]   = "completed"
                _download_tasks[ref_id]["progress"] = 100
                _download_tasks[ref_id]["message"]  = "Download complete."
            else:
                _download_tasks[ref_id]["status"]  = "error"
                _download_tasks[ref_id]["message"] = f"Process exited with code {proc.returncode}"
        except Exception as e:
            _download_tasks[ref_id]["status"]  = "error"
            _download_tasks[ref_id]["message"] = str(e)

        _broadcast({"type": "download_progress", "ref_id": ref_id, **_download_tasks[ref_id]})

    t = threading.Thread(target=_do_download, daemon=True)
    t.start()
    return {"status": "started", "ref_id": ref_id}


def cancel_download(ref_id: str) -> Dict[str, Any]:
    with _dl_lock:
        if ref_id in _download_tasks:
            _download_tasks[ref_id]["status"] = "cancelled"
    return {"status": "cancelled", "ref_id": ref_id}


def add_custom_reference(
    custom_refs_file: str,
    ref_id: str,
    label: str,
    category: str,
    url: str,
    filename: str,
    subdir: str = "",
    build: str = "unknown",
    index_files: Optional[List[str]] = None,
) -> Dict[str, Any]:
    custom = load_custom_refs(custom_refs_file)
    if category not in custom:
        custom[category] = {}
    status = "updated" if ref_id in custom.get(category, {}) else "added"
    custom[category][ref_id] = {
        "label":       label,
        "url":         url,
        "filename":    filename,
        "subdir":      subdir or f"custom/{ref_id}",
        "build":       build,
        "index_files": index_files or [],
        "custom":      True,
    }
    save_custom_refs(custom_refs_file, custom)
    logger.info(f"Custom reference {status}: {ref_id}")
    return {"status": status, "ref_id": ref_id}


def remove_custom_reference(custom_refs_file: str, ref_id: str) -> Dict[str, Any]:
    custom = load_custom_refs(custom_refs_file)
    found = False
    for cat in list(custom.keys()):
        if ref_id in custom[cat]:
            del custom[cat][ref_id]
            if not custom[cat]:
                del custom[cat]
            found = True
            break
    if not found:
        return {"error": f"Custom reference '{ref_id}' not found.", "ref_id": ref_id}
    save_custom_refs(custom_refs_file, custom)
    logger.info(f"Custom reference removed: {ref_id}")
    return {"status": "removed", "ref_id": ref_id}


def configure_reference(
    custom_refs_file: str,
    ref_id: str,
    category: str,
    label: Optional[str] = None,
    url: Optional[str] = None,
    filename: Optional[str] = None,
    subdir: Optional[str] = None,
    build: Optional[str] = None,
    index_files: Optional[List[str]] = None,
) -> Dict[str, Any]:
    custom = load_custom_refs(custom_refs_file)

    is_builtin = any(ref_id in refs for refs in REFERENCE_CATALOG.values())
    is_custom  = any(ref_id in refs for refs in custom.values())

    def _apply_fields(ref: dict) -> dict:
        if label       is not None: ref["label"]       = label
        if url         is not None: ref["url"]         = url
        if filename    is not None: ref["filename"]    = filename
        if subdir      is not None: ref["subdir"]      = subdir
        if build       is not None: ref["build"]       = build
        if index_files is not None: ref["index_files"] = index_files
        return ref

    if is_custom:
        for cat in custom:
            if ref_id in custom[cat]:
                custom[cat][ref_id] = _apply_fields(custom[cat][ref_id])
                save_custom_refs(custom_refs_file, custom)
                logger.info(f"Custom reference configured: {ref_id}")
                return {"status": "configured", "ref_id": ref_id}

    if is_builtin:
        builtin_ref = None
        for cat, refs in REFERENCE_CATALOG.items():
            if ref_id in refs:
                builtin_ref = dict(refs[ref_id])
                break
        if builtin_ref:
            builtin_ref = _apply_fields(builtin_ref)
            builtin_ref["custom"] = True
            if category not in custom:
                custom[category] = {}
            custom[category][ref_id] = builtin_ref
            save_custom_refs(custom_refs_file, custom)
            logger.info(f"Built-in reference overridden: {ref_id}")
            return {"status": "configured", "ref_id": ref_id}

    return {"error": f"Reference '{ref_id}' not found.", "ref_id": ref_id}


def verify_index_files(ref_id: str, refs_base: str, custom_refs_file: str) -> Dict[str, Any]:
    ref_info = None
    for cat_refs in REFERENCE_CATALOG.values():
        if ref_id in cat_refs:
            ref_info = cat_refs[ref_id]
            break
    if not ref_info:
        custom = load_custom_refs(custom_refs_file)
        for cat_refs in custom.values():
            if ref_id in cat_refs:
                ref_info = cat_refs[ref_id]
                break
    if not ref_info:
        return {"ref_id": ref_id, "error": "not_found"}

    subdir_path = os.path.join(refs_base, ref_info.get("subdir", ""))
    index_files = ref_info.get("index_files", [])
    missing = [ix for ix in index_files if not os.path.exists(os.path.join(subdir_path, ix))]
    return {
        "ref_id":       ref_id,
        "index_files":  index_files,
        "missing":      missing,
        "all_present":  len(missing) == 0,
    }