/**
 * components/LogoutButton.jsx
 * Fixed-position account menu rendered on top of the App canvas.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate }                              from 'react-router-dom';
import { clearAuth, getUserName, getUserEmail, getRefreshToken } from '../utils/auth.js';
import { AUTH_URL }                                from '../config.js';

export default function LogoutButton() {
    const navigate   = useNavigate();
    const [open,    setOpen]    = useState(false);
    const [loading, setLoading] = useState(false);
    const widgetRef  = useRef(null);

    // Close when clicking anywhere outside the widget
    useEffect(() => {
        if (!open) return;
        function handleOutside(e) {
            if (widgetRef.current && !widgetRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [open]);

    const handleLogout = useCallback(async () => {
        setLoading(true);
        try {
            const refreshToken = getRefreshToken();
            await fetch(AUTH_URL + '/auth/logout', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ refresh_token: refreshToken }),
            });
        } catch {
            // Network error — clear locally regardless
        } finally {
            clearAuth();
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="logout-widget" ref={widgetRef}>
            <button
                className="logout-trigger"
                title="Account"
                onClick={() => setOpen(v => !v)}
            >
                👤
            </button>
            {open && (
                <div className="logout-menu">
                    <div className="logout-menu-user">
                        <span className="logout-menu-name">{getUserName()}</span>
                        <span className="logout-menu-email">{getUserEmail()}</span>
                    </div>
                    <div className="logout-menu-divider" />
                    <button className="logout-menu-item" onClick={() => { setOpen(false); navigate('/help'); }}>
                        📖 Documentation
                    </button>
                    <button className="logout-menu-item logout-menu-signout"
                        onClick={handleLogout} disabled={loading}>
                        {loading ? '⏳ Signing out...' : '🚪 Sign Out'}
                    </button>
                </div>
            )}
        </div>
    );
}
