"""
SeqNode-OS — setup.py
Configura o pacote para instalação via pip install -e . ou pip install .
"""

from setuptools import setup, find_packages
import os

# Lê o README como long_description
here = os.path.abspath(os.path.dirname(__file__))
readme_path = os.path.join(here, "README.md")
long_description = ""
if os.path.exists(readme_path):
    with open(readme_path, encoding="utf-8") as fh:
        long_description = fh.read()

# Lê requirements.txt para install_requires
req_path = os.path.join(here, "requirements.txt")
install_requires = []
if os.path.exists(req_path):
    with open(req_path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            # Ignora comentários, linhas vazias e opcionais comentados
            if line and not line.startswith("#"):
                install_requires.append(line)

setup(
    # ── Identificação ────────────────────────────────────────────────────────
    name="seqnode-os",
    version="0.3.0",
    description="SeqNode-OS: Modular Bioinformatics Workflow Orchestration System",
    long_description=long_description,
    long_description_content_type="text/markdown",

    # ── Autoria & Licença ────────────────────────────────────────────────────
    author="SeqNode Contributors",
    author_email="",
    license="MIT",
    url="https://github.com/your-org/seqnode-os",  # TODO: substituir pelo URL real do repositório antes de publicar no PyPI

    # ── Classificadores PyPI ─────────────────────────────────────────────────
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Bio-Informatics",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
        "Operating System :: POSIX :: Linux",
    ],
    keywords="bioinformatics workflow orchestration NGS genomics pipeline",

    # ── Pacotes Python ───────────────────────────────────────────────────────
    packages=find_packages(
        exclude=["tests*", "temp*", "novosficheiros*"]
    ),
    include_package_data=True,

    # Garante que ficheiros não-Python (YAML, HTML, JS, CSS) são incluídos
    package_data={
        "": [
            "plugins/*.yaml",
            "gui/static/*.html",
            "gui/static/*.js",
            "gui/static/*.css",
            "workflows/*.json",
        ],
    },

    # ── Versão Python mínima ─────────────────────────────────────────────────
    python_requires=">=3.10",

    # ── Dependências (lidas do requirements.txt) ─────────────────────────────
    install_requires=install_requires,

    # ── Extras opcionais ─────────────────────────────────────────────────────
    extras_require={
        # pip install seqnode-os[s3]
        "s3": ["boto3>=1.34.0"],
        # pip install seqnode-os[dev]
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.23.0",
            "httpx>=0.27.0",   # necessário para TestClient do FastAPI
        ],
    },

    # ── Entry-points (comandos de terminal) ──────────────────────────────────
    entry_points={
        "console_scripts": [
            # seqnode <subcommand>   →  cli/main.py :: main()
            "seqnode=cli.main:main",
            # seqnode-server         →  run_server.py :: main()  (conveniente)
            "seqnode-server=run_server:main",
        ],
    },

    # ── Dados adicionais instalados junto ao pacote ──────────────────────────
    data_files=[
        ("", ["requirements.txt"]),
    ],

    zip_safe=False,
)