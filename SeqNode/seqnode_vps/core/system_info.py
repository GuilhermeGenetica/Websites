import os
import platform
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("seqnode.system_info")

SEQNODE_VERSION = "0.3.0"


def _probe_runtimes() -> Dict[str, bool]:
    import shutil
    return {
        "docker":      bool(shutil.which("docker")),
        "singularity": bool(shutil.which("singularity")),
        "podman":      bool(shutil.which("podman")),
    }


def get_cpu_info() -> Dict[str, Any]:
    try:
        import psutil
        return {
            "count_logical":  psutil.cpu_count(logical=True),
            "count_physical": psutil.cpu_count(logical=False),
            "percent":        psutil.cpu_percent(interval=0.1),
        }
    except ImportError:
        return {
            "count_logical":  os.cpu_count() or 1,
            "count_physical": os.cpu_count() or 1,
            "percent":        None,
        }


def get_memory_info() -> Dict[str, Any]:
    try:
        import psutil
        mem = psutil.virtual_memory()
        return {
            "total_gb":     round(mem.total     / 1e9, 2),
            "available_gb": round(mem.available / 1e9, 2),
            "used_gb":      round(mem.used      / 1e9, 2),
            "percent":      mem.percent,
        }
    except ImportError:
        return {
            "total_gb":     0,
            "available_gb": 0,
            "used_gb":      0,
            "percent":      0,
        }


def get_disk_info(path: str = "/") -> Dict[str, Any]:
    try:
        import psutil
        disk = psutil.disk_usage(path)
        return {
            "total_gb": round(disk.total / 1e9, 2),
            "free_gb":  round(disk.free  / 1e9, 2),
            "used_gb":  round(disk.used  / 1e9, 2),
            "percent":  disk.percent,
            "path":     path,
        }
    except Exception:
        return {
            "total_gb": 0,
            "free_gb":  0,
            "used_gb":  0,
            "percent":  0,
            "path":     path,
        }


def get_platform_info() -> Dict[str, str]:
    return {
        "system":         platform.system(),
        "release":        platform.release(),
        "version":        platform.version(),
        "machine":        platform.machine(),
        "processor":      platform.processor(),
        "python_version": platform.python_version(),
        "node":           platform.node(),
    }


def get_system_info(
    plugins_loaded: int = 0,
    plugins_dir: str = "",
    workflows_dir: str = "",
    settings_file: str = "",
    settings_dirs: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    cpu    = get_cpu_info()
    memory = get_memory_info()
    disk   = get_disk_info("/")
    plat   = get_platform_info()
    runtimes = _probe_runtimes()

    return {
        "seqnode_version":     SEQNODE_VERSION,
        "platform":             plat["system"],
        "platform_release":     plat["release"],
        "platform_version":     plat["version"],
        "machine":              plat["machine"],
        "processor":            plat["processor"],
        "node":                 plat["node"],
        "python_version":       plat["python_version"],
        "cpu_count":            cpu["count_logical"],
        "cpu_count_physical":   cpu["count_physical"],
        "cpu_percent":          cpu["percent"],
        "memory_total_gb":      memory["total_gb"],
        "memory_available_gb":  memory["available_gb"],
        "memory_used_gb":       memory["used_gb"],
        "memory_percent":       memory["percent"],
        "disk_total_gb":        disk["total_gb"],
        "disk_free_gb":         disk["free_gb"],
        "disk_used_gb":         disk["used_gb"],
        "disk_percent":         disk["percent"],
        "runtimes":             runtimes,
        "plugins_loaded":       plugins_loaded,
        "plugins_dir":          plugins_dir,
        "workflows_dir":        workflows_dir,
        "settings_file":        settings_file,
        "settings_dirs":        settings_dirs or {},
    }