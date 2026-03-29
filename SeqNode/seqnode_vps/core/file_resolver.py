import os
import re
import logging
from typing import Optional, List, Dict, Tuple

logger = logging.getLogger("seqnode.files")

EXTENSION_MAP = {
    ".fastq": "FASTQ",
    ".fq": "FASTQ",
    ".fastq.gz": "FASTQ",
    ".fq.gz": "FASTQ",
    ".bam": "BAM",
    ".cram": "CRAM",
    ".sam": "SAM",
    ".vcf": "VCF",
    ".vcf.gz": "VCF",
    ".bcf": "VCF",
    ".bed": "BED",
    ".bed.gz": "BED",
    ".gff": "GFF",
    ".gff3": "GFF",
    ".gtf": "GTF",
    ".fa": "FASTA",
    ".fasta": "FASTA",
    ".fa.gz": "FASTA",
    ".fasta.gz": "FASTA",
    ".cns": "CNVkit_CNS",
    ".cnr": "CNVkit_CNR",
    ".cnn": "CNVkit_CNN",
    ".tsv": "TSV",
    ".csv": "CSV",
    ".txt": "TEXT",
    ".pdf": "PDF",
    ".html": "HTML",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".R": "R_SCRIPT",
    ".r": "R_SCRIPT",
    ".py": "PYTHON_SCRIPT",
    ".sh": "SHELL_SCRIPT",
    ".sif": "APPTAINER_IMAGE",
}


class FileResolver:

    @staticmethod
    def detect_type(filepath: str) -> str:
        name = os.path.basename(filepath).lower()
        for ext in sorted(EXTENSION_MAP.keys(), key=len, reverse=True):
            if name.endswith(ext):
                return EXTENSION_MAP[ext]
        return "UNKNOWN"

    @staticmethod
    def match_extensions(filepath: str, allowed_extensions: List[str]) -> bool:
        name = os.path.basename(filepath).lower()
        for ext in allowed_extensions:
            if name.endswith(ext.lower()):
                return True
        return False

    @staticmethod
    def scan_directory(
        directory: str,
        extensions: Optional[List[str]] = None,
        recursive: bool = True,
    ) -> List[str]:
        results = []
        if not os.path.isdir(directory):
            return results
        walker = os.walk(directory) if recursive else [(directory, [], os.listdir(directory))]
        for root, _, files in walker:
            for f in sorted(files):
                fp = os.path.join(root, f)
                if extensions:
                    if any(f.lower().endswith(e.lower()) for e in extensions):
                        results.append(fp)
                else:
                    results.append(fp)
        return results

    @staticmethod
    def find_paired_fastq(files: List[str]) -> List[Tuple[str, Optional[str]]]:
        pairs: Dict[str, List[str]] = {}
        for fp in files:
            bn = os.path.basename(fp)
            base = re.sub(
                r"[._]?(R?[12])[._]?(fastq|fq)(\.gz)?$", "", bn, flags=re.IGNORECASE
            )
            pairs.setdefault(base, []).append(fp)
        result = []
        for base, fps in sorted(pairs.items()):
            fps.sort()
            if len(fps) == 2:
                result.append((fps[0], fps[1]))
            elif len(fps) == 1:
                result.append((fps[0], None))
            else:
                for fp in fps:
                    result.append((fp, None))
        return result

    @staticmethod
    def resolve_template(template: str, variables: Dict[str, str]) -> str:
        result = template
        for key, val in variables.items():
            result = result.replace(f"{{{key}}}", str(val))
        return result
