import os
import re
import shutil
import logging
import subprocess
from typing import Optional, Dict, List

logger = logging.getLogger("seqnode.container")


class ContainerRuntime:

    SUPPORTED_TYPES = ("system", "conda", "apptainer", "singularity", "docker", "python")

    def __init__(self):
        self._available_runtimes = self._detect_runtimes()
        logger.info(f"Available container runtimes: {self._available_runtimes}")

    def _detect_runtimes(self) -> Dict[str, bool]:
        result = {"system": True, "python": True}
        for name, bins in [
            ("conda", ["conda", "mamba"]),
            ("apptainer", ["apptainer"]),
            ("singularity", ["singularity"]),
            ("docker", ["docker"]),
        ]:
            result[name] = any(shutil.which(b) is not None for b in bins)
        return result

    def is_available(self, runtime_type: str) -> bool:
        return self._available_runtimes.get(runtime_type, False)

    # Padrão de atribuição de variável shell: NAME=... ou NAME+=...
    # Inclui arrays (NAME=() ) e atribuições com export inline (export NAME=…
    # é tratado pelo built-in "export", mas NAME=value isolado é capturado aqui).
    _VAR_ASSIGN_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*\+?=')

    # extract_binary_name.py

    @staticmethod
    def extract_binary_name(command_template: str) -> Optional[str]:
        """
        Extracts the primary binary name from a command template.
        Ex: 'fastp -i {input} ...'        -> 'fastp'
            'bwa mem -t {threads} ...'    -> 'bwa'
            'cnvkit.py batch ...'         -> 'cnvkit.py'
            '#!/bin/bash\nset -e\nbwa'  -> 'bwa'

        Ignores:
        - Shebang lines (#!)
        - Blank lines
        - Comments (#)
        - Shell built-ins that never exist in PATH (set, export, source, ...)
        - Shell variable assignments (VAR=value, PASS="✔", ERRORS=0, ...)
        - cd/env prefixes before &&
        - Jinja2 tokens ({%, {{, {%-, {#) — these are never binaries
        """
        if not command_template:
            return None

        # Shell built-ins that are not external binaries — these should never be
        # searched in PATH; otherwise, they generate false positives during pre-flight.
        SHELL_BUILTINS = {
            "set", "export", "source", ".", "unset", "readonly",
            "declare", "local", "typeset", "ulimit", "umask",
            "trap", "eval", "exec", "exit", "return", "shift",
            "alias", "unalias", "hash", "true", "false", ":",
        }

        # Pattern for shell variable assignment: NAME=... or NAME+=...
        VAR_ASSIGN_RE = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*\+?=')

        # Jinja2 tokens that are never binaries
        JINJA2_PREFIXES = ("{%", "{{", "{%-", "{#", "{%+")

        cmd = command_template.strip()

        # Remove cd/env prefixes before && (e.g., "cd /tmp && bwa ...")
        for prefix in ["cd ", "env "]:
            if cmd.startswith(prefix):
                parts = cmd.split("&&", 1)
                cmd = parts[-1].strip() if len(parts) > 1 else cmd

        # Iterate line by line, skipping shebang / comments / blank /
        # built-ins / variable assignments / Jinja2 tokens
        for line in cmd.splitlines():
            stripped = line.strip()

            if not stripped:
                continue                          # empty line

            if stripped.startswith("#"):
                continue                          # shebang or comment

            first_token = stripped.split()[0]

            # ── Jinja2 Filter: ignore lines starting with template tokens ──
            if any(first_token.startswith(jp) for jp in JINJA2_PREFIXES):
                continue                          # Jinja2 directive — ignore

            # Also ignore if the entire line starts with {%
            if stripped.startswith("{%") or stripped.startswith("{{"):
                continue

            if first_token in SHELL_BUILTINS:
                continue                          # setup built-in — ignore

            if VAR_ASSIGN_RE.match(first_token):
                continue                          # variable assignment — ignore

            # Clean potential {var} templates in the first token
            if first_token.startswith("{") and first_token.endswith("}"):
                return None

            # Ignore tokens containing residual Jinja2 markers
            if "{%" in first_token or "{{" in first_token:
                continue

            return first_token

        return None

    def check_tool_available(self, command_template: str, runtime_type: str = "system") -> Dict[str, any]:
        """Verifica se a ferramenta principal do comando está disponível.
        Retorna dict com 'available' (bool), 'binary' (str), 'message' (str).
        """
        binary = self.extract_binary_name(command_template)
        if not binary:
            return {"available": True, "binary": None, "message": "Could not determine binary name."}

        # Para runtimes containerizados, assumir que a ferramenta está dentro do container
        if runtime_type in ("docker", "apptainer", "singularity"):
            if not self.is_available(runtime_type):
                return {
                    "available": False,
                    "binary": binary,
                    "message": f"Container runtime '{runtime_type}' is not installed. "
                               f"Install {runtime_type} or switch runtime to 'system'/'conda'.",
                }
            return {"available": True, "binary": binary, "message": "Tool assumed available inside container."}

        # Para conda, verificar se conda está disponível
        if runtime_type == "conda":
            if not self.is_available("conda"):
                return {
                    "available": False,
                    "binary": binary,
                    "message": "Conda/Mamba not installed. Install conda or mamba.",
                }
            return {"available": True, "binary": binary, "message": "Tool assumed available in conda env."}

        # Para system/python, verificar se o binário existe no PATH
        found = shutil.which(binary)
        if found:
            return {"available": True, "binary": binary, "message": f"Found: {found}"}
        else:
            return {
                "available": False,
                "binary": binary,
                "message": f"Tool '{binary}' not found in PATH. "
                           f"Install it with: sudo apt install {binary} | conda install {binary} | pip install {binary}",
            }

    def wrap_command(
        self,
        command: str,
        runtime_type: str = "system",
        image: Optional[str] = None,
        conda_env: Optional[str] = None,
        env_vars: Optional[Dict[str, str]] = None,
        working_dir: Optional[str] = None,
        bind_paths: Optional[List[str]] = None,
    ) -> str:
        env_prefix = ""
        if env_vars:
            env_prefix = " ".join(f"{k}='{v}'" for k, v in env_vars.items()) + " "

        cd_prefix = ""
        if working_dir:
            cd_prefix = f"cd {working_dir} && "

        if runtime_type == "system" or runtime_type == "python":
            return f"{cd_prefix}{env_prefix}{command}"

        if runtime_type == "conda":
            conda_bin = "mamba" if shutil.which("mamba") else "conda"
            env_name = conda_env or "base"
            # Wrap in 'bash -c' so that shell built-ins (set, export, etc.) and
            # multi-statement commands (joined by '; ') execute correctly.
            # Without this, mamba/conda tries to exec the first token ('set') as
            # an external binary, failing with "exec: set: not found" (exit 127).
            safe_cmd = command.replace("'", "'\\''")
            return f"{cd_prefix}{env_prefix}{conda_bin} run -n {env_name} bash -c '{safe_cmd}'"

        if runtime_type in ("apptainer", "singularity"):
            binary = "apptainer" if shutil.which("apptainer") else "singularity"
            bind_flags = ""
            if bind_paths:
                bind_flags = " ".join(f"--bind {p}" for p in bind_paths)
            img = image or ""
            return f"{cd_prefix}{env_prefix}{binary} exec {bind_flags} {img} {command}"

        if runtime_type == "docker":
            bind_flags = ""
            if bind_paths:
                bind_flags = " ".join(f"-v {p}:{p}" for p in bind_paths)
            env_flags = ""
            if env_vars:
                env_flags = " ".join(f"-e {k}={v}" for k, v in env_vars.items())
            wd_flag = f"-w {working_dir}" if working_dir else ""
            img = image or ""
            return f"docker run --rm {bind_flags} {env_flags} {wd_flag} {img} {command}"

        return f"{cd_prefix}{env_prefix}{command}"

    def ensure_conda_env(self, env_name: str, packages: List[str], channels: Optional[List[str]] = None) -> bool:
        if not self.is_available("conda"):
            logger.error("Conda/Mamba not available for environment creation.")
            return False
        conda_bin = "mamba" if shutil.which("mamba") else "conda"
        try:
            result = subprocess.run(
                f"{conda_bin} env list", shell=True, capture_output=True, text=True
            )
            if env_name in result.stdout:
                logger.info(f"Conda env '{env_name}' already exists.")
                return True
        except Exception:
            pass
        channel_flags = ""
        if channels:
            channel_flags = " ".join(f"-c {c}" for c in channels)
        pkg_str = " ".join(packages)
        cmd = f"{conda_bin} create -y -n {env_name} {channel_flags} {pkg_str}"
        logger.info(f"Creating conda env: {cmd}")
        try:
            subprocess.run(cmd, shell=True, check=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to create conda env: {e}")
            return False