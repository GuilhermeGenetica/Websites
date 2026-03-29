# api/auth_middleware.py
"""
FastAPI dependency for JWT authentication.
When auth.enabled = False in settings: all requests are anonymous admin.
When auth.enabled = True: requires valid Bearer token on protected routes.
"""
from __future__ import annotations

from typing import Callable, Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.auth_service import verify_token

_security = HTTPBearer(auto_error=False)

# Routes that never require auth
PUBLIC_PATHS = {
    "/api/auth/login",
    "/api/auth/setup",
    "/api/system/info",
    "/ws",
    "/mcp/sse",
    "/mcp/messages",
    "/mcp/manifest",
    "/",
    "/static",
}

_ANONYMOUS = {"username": "anonymous", "role": "admin"}


def _is_auth_enabled(settings_getter: Callable) -> bool:
    try:
        return settings_getter().get("auth", {}).get("enabled", False)
    except Exception:
        return False


def make_get_current_user(settings_getter: Callable):
    """
    Factory — creates the dependency with access to settings_getter from server.py.
    Usage in server.py:
        get_current_user = make_get_current_user(_get_settings)
    """
    async def get_current_user(
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(_security),
    ) -> dict:
        # If auth disabled, return anonymous admin
        if not _is_auth_enabled(settings_getter):
            return _ANONYMOUS

        # Public route — always passes
        path = request.url.path
        if any(path.startswith(p) for p in PUBLIC_PATHS):
            return _ANONYMOUS

        # Requires token
        if not credentials:
            raise HTTPException(status_code=401, detail="Authentication required")

        payload = verify_token(credentials.credentials)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return {"username": payload["sub"], "role": payload["role"]}

    return get_current_user
