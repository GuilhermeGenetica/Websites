"""
monitor.py — System resource monitoring (CPU, RAM, disk)

Returns a snapshot dict suitable for sending to the server.
psutil is optional: if unavailable, returns zeros.
"""

import os
import platform

try:
    import psutil
    _HAS_PSUTIL = True
except ImportError:
    _HAS_PSUTIL = False


def snapshot(workspace: str = "") -> dict:
    info = {
        "hostname": platform.node(),
        "os":       platform.system() + " " + platform.release(),
        "arch":     platform.machine(),
        "cpu_pct":  0.0,
        "cpu_cores": os.cpu_count() or 1,
        "ram_total_gb": 0.0,
        "ram_avail_gb": 0.0,
        "ram_pct":  0.0,
        "disk_free_gb": 0.0,
    }

    if not _HAS_PSUTIL:
        return info

    try:
        info["cpu_pct"]  = psutil.cpu_percent(interval=0.2)
    except Exception:
        pass

    try:
        vm = psutil.virtual_memory()
        info["ram_total_gb"] = round(vm.total / 1e9, 2)
        info["ram_avail_gb"] = round(vm.available / 1e9, 2)
        info["ram_pct"]      = vm.percent
    except Exception:
        pass

    try:
        path = workspace if workspace and os.path.exists(workspace) else "/"
        du = psutil.disk_usage(path)
        info["disk_free_gb"] = round(du.free / 1e9, 2)
    except Exception:
        pass

    return info
