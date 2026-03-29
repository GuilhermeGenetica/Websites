# core/auth_service.py
"""
SeqNode-OS Auth Service
JWT-based authentication with roles.
Activated via settings auth.enabled = true.
Default DISABLED — existing installations are not affected.
"""
from __future__ import annotations

import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

logger = logging.getLogger("seqnode.auth")

_BASE_DIR    = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SECRET_FILE  = os.path.join(_BASE_DIR, ".seqnode_jwt_secret")
USERS_FILE   = os.path.join(_BASE_DIR, ".seqnode_users.json")

ROLES = ["admin", "analyst", "viewer"]

ROLE_PERMISSIONS = {
    "admin":   {"execute", "cancel", "settings_write", "plugins_write", "users_manage", "read"},
    "analyst": {"execute", "cancel", "read"},
    "viewer":  {"read"},
}


def _get_secret() -> str:
    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE) as f:
            return f.read().strip()
    secret = secrets.token_hex(64)
    with open(SECRET_FILE, "w") as f:
        f.write(secret)
    try:
        os.chmod(SECRET_FILE, 0o600)
    except OSError:
        pass
    return secret


def _load_users() -> Dict:
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE) as f:
        return json.load(f)


def _save_users(users: Dict) -> None:
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)
    try:
        os.chmod(USERS_FILE, 0o600)
    except OSError:
        pass


def hash_password(password: str) -> str:
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    except ImportError:
        # Fallback if bcrypt not installed — uses hashlib (less secure, warns)
        import hashlib
        logger.warning("bcrypt not installed — using SHA256 password hashing (install bcrypt for production)")
        salt = secrets.token_hex(16)
        h = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
        return f"sha256:{salt}:{h}"


def verify_password(password: str, hashed: str) -> bool:
    if hashed.startswith("sha256:"):
        import hashlib
        _, salt, expected = hashed.split(":", 2)
        h = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
        return h == expected
    try:
        import bcrypt
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ImportError:
        return False


def create_token(username: str, role: str, expires_hours: int = 24) -> str:
    try:
        import jwt
    except ImportError:
        raise RuntimeError("PyJWT not installed. Run: pip install PyJWT>=2.8.0")
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expires_hours),
        "iat": datetime.now(timezone.utc),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, _get_secret(), algorithm="HS256")


def verify_token(token: str) -> Optional[Dict]:
    try:
        import jwt
        return jwt.decode(token, _get_secret(), algorithms=["HS256"])
    except Exception:
        return None


def create_user(username: str, password: str, role: str = "analyst") -> Dict:
    if role not in ROLES:
        raise ValueError(f"Invalid role. Must be one of: {ROLES}")
    users = _load_users()
    if username in users:
        raise ValueError(f"User '{username}' already exists")
    users[username] = {
        "password_hash": hash_password(password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    _save_users(users)
    logger.info(f"User created: {username} ({role})")
    return {"username": username, "role": role}


def authenticate_user(username: str, password: str) -> Optional[Dict]:
    users = _load_users()
    user = users.get(username)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return {"username": username, "role": user["role"]}


def list_users() -> List[Dict]:
    users = _load_users()
    return [{"username": k, "role": v["role"], "created_at": v.get("created_at")} for k, v in users.items()]


def delete_user(username: str) -> bool:
    users = _load_users()
    if username not in users:
        return False
    del users[username]
    _save_users(users)
    return True


def has_users() -> bool:
    return bool(_load_users())


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
