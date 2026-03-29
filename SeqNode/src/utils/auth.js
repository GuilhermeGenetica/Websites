/**
 * utils/auth.js — SeqNode-OS Client Authentication Helpers
 *
 * Keys align with the PHP API and Zustand store:
 *   seqnode_access_token  — JWT access token
 *   seqnode_refresh_token — opaque refresh token (rotation)
 *   seqnode_user          — full user object (JSON)
 */

const ACCESS_KEY  = 'seqnode_access_token';
const REFRESH_KEY = 'seqnode_refresh_token';
const USER_KEY    = 'seqnode_user';

export function getToken()        { return localStorage.getItem(ACCESS_KEY)  || ''; }
export function getRefreshToken() { return localStorage.getItem(REFRESH_KEY) || ''; }
export function getUserId()       { return getUser()?.id || null; }

export function getUser() {
    try   { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
}

export function getUserName()  { return getUser()?.full_name    || getUser()?.email || 'User'; }
export function getUserEmail() { return getUser()?.email        || ''; }
export function getRole()      { return getUser()?.role         || 'user'; }
export function isAdmin()      { return !!(getUser()?.is_admin); }

/**
 * Persist auth data returned by POST /api/auth/login or /api/auth/refresh.
 * @param {{ access_token: string, refresh_token?: string, user?: object }} params
 */
export function setAuth({ access_token, refresh_token, user }) {
    if (access_token)  localStorage.setItem(ACCESS_KEY,  access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
    if (user)          localStorage.setItem(USER_KEY,    JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}

/** Returns true if a valid, non-expired access token exists. */
export function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    if (token === 'local_dev') return true;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
        const pad     = (4 - parts[1].length % 4) % 4;
        const b64     = parts[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
        const payload = JSON.parse(atob(b64));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            clearAuth();
            return false;
        }
        return true;
    } catch {
        return false;
    }
}
