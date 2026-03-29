"""
config.py — SeqNode Agent configuration management

Loads/saves ~/.seqnode-agent/config.json
"""

import json
import os
from pathlib import Path

CONFIG_DIR  = Path.home() / ".seqnode-agent"
CONFIG_FILE = CONFIG_DIR / "config.json"
VERSION     = "1.0.0"

DEFAULTS = {
    "server_url": "wss://api.seqnode.onnetweb.com/ws/agent",
    "token":      "",
    "workspace":  str(Path.home() / "seqnode-workspace"),
    "log_dir":    str(CONFIG_DIR / "logs"),
    "label":      "",
    "reconnect_delay_min": 2,
    "reconnect_delay_max": 60,
    "ping_interval":       30,
    "command_timeout":     0,    # 0 = no timeout
}


def load() -> dict:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE) as f:
                data = json.load(f)
            return {**DEFAULTS, **data}
        except Exception:
            pass
    return dict(DEFAULTS)


def save(cfg: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)


def get(key: str, fallback=None):
    return load().get(key, fallback)


def set_value(key: str, value) -> None:
    cfg = load()
    cfg[key] = value
    save(cfg)


def is_configured() -> bool:
    cfg = load()
    return bool(cfg.get("token")) and bool(cfg.get("server_url"))
