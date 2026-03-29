import json
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger("seqnode.settings")

STATE_BACKEND_KEY = "state_backend"
RUNNER_TYPE_KEY   = "runner_type"
SLURM_CONFIG_KEY  = "slurm_config"


def build_default_settings(
    plugins_dir: str,
    workflows_dir: str,
) -> Dict[str, Any]:
    return {
        "dirs": {
            "plugins":    plugins_dir,
            "workflows":  workflows_dir,
            "references": os.path.abspath(os.path.join(os.path.dirname(plugins_dir), "data", "references")),
            "working":    os.path.abspath(os.path.join(os.path.dirname(plugins_dir), "data", "working")),
            "output":     os.path.abspath(os.path.join(os.path.dirname(plugins_dir), "data", "output")),
            "temp":       "/tmp/seqnode",
            "logs":       "logs",
            "state":      ".seqnode_state",
        },
        "execution": {
            "max_threads":       8,
            "max_memory_gb":     16,
            "container_runtime": "auto",
            "shell":             "/bin/bash",
            "timeout_minutes":   0,
            "retry_failed":      False,
            "retry_count":       1,
            "run_mode":          "system",
            "conda_env":         "",
            "conda_path":        "",
        },
        "ui": {
            "theme":              "dark",
            "grid_size":          20,
            "snap_to_grid":       False,
            "auto_save":          True,
            "auto_save_interval": 60,
            "show_minimap":       True,
            "log_max_lines":      2000,
        },
        STATE_BACKEND_KEY: "json",
        RUNNER_TYPE_KEY:   "local",
        SLURM_CONFIG_KEY:  {
            "partition":      "batch",
            "time_limit":     "24:00:00",
            "cpus_per_task":  1,
            "mem_gb":         4,
            "extra_headers":  [],
        },
        "auth": {
            "enabled":     False,
            "mode":        "api_key",
            "jwt_secret":  "",
            "token_ttl_h": 24,
        },
        "llm_config": {
            "provider": "openai",
            "model": "",
            "api_key": "",
            "api_base": "",
            "oauth_token": ""
        },
        "plugin_defaults":  {},
        "plugin_overrides": {},
        "plugin_paths":     {},
    }


def load_settings(settings_file: str, defaults: Dict[str, Any]) -> Dict[str, Any]:
    if os.path.exists(settings_file):
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                saved = json.load(f)
            merged = json.loads(json.dumps(defaults))
            for section_key, section_val in saved.items():
                if (
                    isinstance(section_val, dict)
                    and section_key in merged
                    and isinstance(merged[section_key], dict)
                ):
                    merged[section_key].update(section_val)
                else:
                    merged[section_key] = section_val
            return merged
        except Exception as exc:
            logger.warning(f"Failed to load settings from {settings_file}: {exc}")
    return json.loads(json.dumps(defaults))


def save_settings(settings_file: str, settings: Dict[str, Any]) -> None:
    try:
        dir_path = os.path.dirname(settings_file)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        with open(settings_file, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2, default=str)
        logger.info(f"Settings saved to {settings_file}")
    except Exception as exc:
        logger.error(f"Failed to save settings to {settings_file}: {exc}")
        raise


def reset_to_defaults(settings_file: str, defaults: Dict[str, Any]) -> Dict[str, Any]:
    fresh = json.loads(json.dumps(defaults))
    save_settings(settings_file, fresh)
    return fresh


def validate_settings(settings_dict: Dict[str, Any]) -> list:
    errors = []
    exec_cfg = settings_dict.get("execution", {})

    if "max_threads" in exec_cfg:
        try:
            v = int(exec_cfg["max_threads"])
            if v < 1 or v > 256:
                errors.append("execution.max_threads must be between 1 and 256.")
        except (ValueError, TypeError):
            errors.append("execution.max_threads must be an integer.")

    if "max_memory_gb" in exec_cfg:
        try:
            v = float(exec_cfg["max_memory_gb"])
            if v < 0:
                errors.append("execution.max_memory_gb must be non-negative.")
        except (ValueError, TypeError):
            errors.append("execution.max_memory_gb must be a number.")

    ui_cfg = settings_dict.get("ui", {})
    valid_themes = ("dark", "light")
    if "theme" in ui_cfg and ui_cfg["theme"] not in valid_themes:
        errors.append(f"ui.theme must be one of: {', '.join(valid_themes)}.")

    backend = settings_dict.get(STATE_BACKEND_KEY, "json")
    if backend not in ("json", "sqlite"):
        errors.append(f"{STATE_BACKEND_KEY} must be 'json' or 'sqlite'.")

    runner = settings_dict.get(RUNNER_TYPE_KEY, "local")
    if runner not in ("local", "slurm"):
        errors.append(f"{RUNNER_TYPE_KEY} must be 'local' or 'slurm'.")

    return errors


def validate_directories_access(settings_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Valida permissões de escrita para TODOS os directórios configurados
    ANTES de guardar as settings. Retorna dict com:
      - "warnings": lista de caminhos sem permissão (não bloqueia o save)
      - "errors":   lista de caminhos com problemas graves
      - "valid":    lista de caminhos OK
    O frontend pode mostrar os warnings ao utilizador antes de confirmar.
    """
    warnings = []
    errors   = []
    valid    = []

    for key, dir_path in settings_dict.get("dirs", {}).items():
        if not dir_path:
            continue
        dir_path = os.path.expanduser(str(dir_path))

        # Se o directório já existe, verificar se temos escrita
        if os.path.exists(dir_path):
            if os.path.isdir(dir_path):
                if os.access(dir_path, os.W_OK):
                    valid.append(dir_path)
                else:
                    warnings.append({
                        "key": key,
                        "path": dir_path,
                        "reason": "Directory exists but no write permission. "
                                  "Run with elevated privileges or choose another path."
                    })
            else:
                errors.append({
                    "key": key,
                    "path": dir_path,
                    "reason": "Path exists but is not a directory."
                })
            continue

        # Se não existe, verificar se o directório-pai é criável
        parent = dir_path
        while parent and not os.path.exists(parent):
            parent = os.path.dirname(parent)
            if parent == os.path.dirname(parent):
                # Chegámos à raiz sem encontrar directório existente
                break

        if parent and os.path.isdir(parent):
            if os.access(parent, os.W_OK):
                valid.append(dir_path)
            else:
                warnings.append({
                    "key": key,
                    "path": dir_path,
                    "reason": f"Cannot create directory: no write permission on parent '{parent}'. "
                              f"Run with elevated privileges or choose a path under your home directory."
                })
        else:
            warnings.append({
                "key": key,
                "path": dir_path,
                "reason": f"Cannot resolve parent directory. Path may be invalid."
            })

    return {"warnings": warnings, "errors": errors, "valid": valid}


def get_state_backend(settings: Dict[str, Any]) -> str:
    return settings.get(STATE_BACKEND_KEY, "json")


def set_state_backend(settings_file: str, settings: Dict[str, Any], backend: str) -> Dict[str, Any]:
    settings[STATE_BACKEND_KEY] = backend
    save_settings(settings_file, settings)
    if backend == "sqlite":
        logger.info("state_backend switched to sqlite. Migration will run on next access.")
    return settings


def get_runner_config(settings: Dict[str, Any]) -> Dict[str, Any]:
    runner_type = settings.get(RUNNER_TYPE_KEY, "local")
    base = {"type": runner_type}
    if runner_type == "slurm":
        base.update(settings.get(SLURM_CONFIG_KEY, {}))
    return base


def build_runner_from_settings(settings: Dict[str, Any]) -> "BaseRunner":
    from core.runner_base import BaseRunner
    from core.runner_local import LocalRunner
    runner_type = settings.get(RUNNER_TYPE_KEY, "local")

    if runner_type == "slurm":
        from core.runner_slurm import SlurmRunner
        slurm_cfg = settings.get(SLURM_CONFIG_KEY, {})
        return SlurmRunner(
            partition=slurm_cfg.get("partition", "batch"),
            time_limit=slurm_cfg.get("time_limit", "24:00:00"),
            cpus_per_task=int(slurm_cfg.get("cpus_per_task", 1)),
            mem_gb=int(slurm_cfg.get("mem_gb", 4)),
            extra_headers=slurm_cfg.get("extra_headers", []),
        )
    return LocalRunner()


def build_state_manager_from_settings(settings: Dict[str, Any]) -> "UnifiedStateManager":
    from core.state_db import UnifiedStateManager
    return UnifiedStateManager.from_settings(settings)


def create_configured_dirs(settings_dict: Dict[str, Any]) -> Dict[str, Any]:
    created = []
    errors  = []

    for key, dir_path in settings_dict.get("dirs", {}).items():
        if not dir_path:
            continue
        dir_path = os.path.expanduser(str(dir_path))
        try:
            os.makedirs(dir_path, exist_ok=True)
            created.append(dir_path)
        except Exception as exc:
            errors.append({"path": dir_path, "error": str(exc)})

    for plugin_id, plugin_cfg in settings_dict.get("plugin_defaults", {}).items():
        if isinstance(plugin_cfg, dict):
            for key in ("path", "refs_path"):
                extra = plugin_cfg.get(key, "")
                if extra:
                    extra = os.path.expanduser(str(extra))
                    try:
                        os.makedirs(extra, exist_ok=True)
                        created.append(extra)
                    except Exception as exc:
                        errors.append({"path": extra, "error": str(exc)})

    return {"created": list(set(created)), "errors": errors}


def merge_plugin_paths(current: Dict[str, Any], update: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(current.get("plugin_paths"), dict):
        current["plugin_paths"] = {}
    for pid, pdata in update.items():
        if isinstance(pdata, dict):
            current["plugin_paths"][pid] = pdata
    return current