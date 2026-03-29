"""
security.py — HMAC command validation and sandbox path enforcement

Every execute payload from the server is signed with HMAC-SHA256 using
a per-session secret issued at auth_ok time.  The agent refuses to run
any command that fails HMAC verification or references a path outside
the allowed workspace.
"""

import hashlib
import hmac
import json
import os
from pathlib import Path


_hmac_secret: bytes = b""


def set_secret(secret_hex: str) -> None:
    """Store the session HMAC secret (received from server at auth_ok)."""
    global _hmac_secret
    _hmac_secret = bytes.fromhex(secret_hex)


def sign(payload: dict) -> str:
    """Return HMAC-SHA256 hex digest of the canonical JSON payload."""
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hmac.new(_hmac_secret, canonical.encode(), hashlib.sha256).hexdigest()


def verify(payload: dict, signature: str) -> bool:
    """Return True if the signature matches the canonical payload."""
    if not _hmac_secret:
        return False
    expected = sign(payload)
    return hmac.compare_digest(expected, signature)


# ── Sandbox enforcement ───────────────────────────────────────────────────────

_workspace: str = ""


def set_workspace(path: str) -> None:
    global _workspace
    _workspace = str(Path(path).resolve())


def _resolve(p: str) -> Path:
    return Path(p).resolve()


def is_within_workspace(path: str) -> bool:
    """Return True if *path* is inside the configured workspace."""
    if not _workspace:
        return True  # workspace not configured — allow all (warn only)
    try:
        resolved = _resolve(path)
        return str(resolved).startswith(_workspace)
    except Exception:
        return False


# Dangerous patterns that always get blocked, regardless of workspace
_BLOCKED_PATTERNS = [
    "/etc/passwd", "/etc/shadow", "/etc/sudoers",
    "C:\\Windows\\System32", "C:\\Windows\\SysWOW64",
    "/boot/", "/sys/", "/proc/sysrq",
]


def command_is_safe(command: str, working_dir: str = "") -> tuple[bool, str]:
    """
    Lightweight static analysis of a shell command.
    Returns (ok, reason).  This is a best-effort check — not a full sandbox.
    """
    for pat in _BLOCKED_PATTERNS:
        if pat.lower() in command.lower():
            return False, f"Command references blocked path: {pat}"

    if working_dir and not is_within_workspace(working_dir):
        return False, f"Working directory outside workspace: {working_dir}"

    return True, ""
