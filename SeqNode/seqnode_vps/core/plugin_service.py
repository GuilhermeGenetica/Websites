import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("seqnode.plugin_service")

YAML_SNIPPETS: Dict[str, str] = {
    "script": (
        "\n\ncommand:\n"
        "  template: |\n"
        "    #!/bin/bash\n"
        "    set -euo pipefail\n"
        "    echo \"Running script\"\n"
        "    {input_file} > {output_file}\n"
        "  shell: \"/bin/bash\"\n"
        "  pre_commands:\n"
        "    - \"echo Starting...\"\n"
        "  post_commands:\n"
        "    - \"echo Done.\"\n"
    ),
    "conda": (
        "\nruntime:\n"
        "  type: \"conda\"\n"
        "  conda_env: \"my_env\"\n"
        "  conda_packages:\n"
        "    - \"samtools=1.17\"\n"
        "    - \"bcftools=1.17\"\n"
        "  conda_channels:\n"
        "    - \"conda-forge\"\n"
        "    - \"bioconda\"\n"
        "    - \"defaults\"\n"
        "  pip_packages: []\n"
        "  env_vars:\n"
        "    OMP_NUM_THREADS: \"4\"\n"
    ),
    "container": (
        "\nruntime:\n"
        "  type: \"docker\"\n"
        "  image: \"biocontainers/samtools:v1.9-4-deb_cv1\"\n"
        "  shell: \"/bin/bash\"\n"
        "  working_dir: \"/data\"\n"
        "container: \"docker://biocontainers/samtools:v1.9-4-deb_cv1\"\n"
    ),
    "rscript": (
        "\ncommand:\n"
        "  template: |\n"
        "    Rscript --vanilla -e '\n"
        "    library(ggplot2)\n"
        "    data <- read.csv(\"{input_file}\")\n"
        "    write.csv(data, \"{output_file}\")\n"
        "    '\n"
        "  shell: \"/bin/bash\"\n"
        "runtime:\n"
        "  type: \"system\"\n"
        "  env_vars:\n"
        "    R_LIBS_USER: \"/opt/R/libs\"\n"
    ),
    "python": (
        "\ncommand:\n"
        "  template: |\n"
        "    python3 -c \"\n"
        "    import pandas as pd\n"
        "    df = pd.read_csv(\\\"{input_file}\\\")\n"
        "    df.to_csv(\\\"{output_file}\\\", index=False)\n"
        "    \"\n"
        "  shell: \"/bin/bash\"\n"
        "runtime:\n"
        "  type: \"system\"\n"
        "  pip_packages:\n"
        "    - \"pandas\"\n"
        "    - \"numpy\"\n"
    ),
    "quantum": (
        "\ncommand:\n"
        "  template: |\n"
        "    python3 -c \"\n"
        "    from qiskit import QuantumCircuit, transpile\n"
        "    from qiskit_aer import AerSimulator\n"
        "    import json\n"
        "    qc = QuantumCircuit(2, 2)\n"
        "    qc.h(0)\n"
        "    qc.cx(0, 1)\n"
        "    qc.measure([0, 1], [0, 1])\n"
        "    sim = AerSimulator()\n"
        "    result = sim.run(transpile(qc, sim), shots=1024).result()\n"
        "    with open(\\\"{output_file}\\\", \\\"w\\\") as f:\n"
        "        json.dump(result.get_counts(), f)\n"
        "    \"\n"
        "  shell: \"/bin/bash\"\n"
        "runtime:\n"
        "  type: \"system\"\n"
        "  pip_packages:\n"
        "    - \"qiskit\"\n"
        "    - \"qiskit-aer\"\n"
    ),
}


def get_yaml_snippets() -> Dict[str, str]:
    return YAML_SNIPPETS


def get_snippet(snippet_type: str) -> Optional[str]:
    return YAML_SNIPPETS.get(snippet_type)


def list_snippet_types() -> list:
    return list(YAML_SNIPPETS.keys())