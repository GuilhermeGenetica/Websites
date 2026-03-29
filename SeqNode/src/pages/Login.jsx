/**
 * pages/Login.jsx — SeqNode-OS Login Page
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation }         from 'react-router-dom';
import { setAuth, isAuthenticated }         from '../utils/auth.js';
import { AUTH_URL }                         from '../config.js';

export default function Login() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [info,     setInfo]     = useState('');
    const [showPwd,  setShowPwd]  = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('seqnode-theme') || 'dark';
        document.body.className = 'theme-' + savedTheme;
        if (isAuthenticated()) { navigate('/app', { replace: true }); return; }
        const params = new URLSearchParams(location.search);
        if (params.get('verified')   === '1') setInfo('Email verified! You can now sign in.');
        if (params.get('registered') === '1') setInfo('Account created! Please check your email to verify your account.');
        if (params.get('reset')      === '1') setInfo('Password reset successfully. You can now sign in.');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) { setError('Email and password are required.'); return; }
        setLoading(true);
        setError('');
        setInfo('');

        try {
            const res  = await fetch(AUTH_URL + '/auth/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    email:    email.trim().toLowerCase(),
                    password,
                }),
            });
            const data = await res.json();

            if (data.success && data.data?.access_token) {
                setAuth({
                    access_token:  data.data.access_token,
                    refresh_token: data.data.refresh_token,
                    user:          data.data.user,
                });
                navigate('/app', { replace: true });
            } else {
                setError(data.message || 'Invalid credentials.');
            }
        } catch {
            setError('Could not reach the authentication server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [email, password, navigate]);

    return (
        <div className="login-root">
            <div className="login-card">
                <div className="login-logo">
                    <span className="login-logo-icon">🧬</span>
                    <span className="login-logo-text">SeqNode-OS</span>
                </div>
                <p className="login-subtitle">Bioinformatics Workflow Orchestrator</p>

                {info  && <div className="login-info"  role="status">{info}</div>}
                {error && <div className="login-error" role="alert">{error}</div>}

                <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
                    <div className="login-field">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="login-password">Password</label>
                        <div className="login-pwd-wrap">
                            <input
                                id="login-password"
                                type={showPwd ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button type="button" className="login-pwd-toggle"
                                onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                                {showPwd ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <div className="login-links" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <button type="button" onClick={() => navigate('/resend-verification')} className="login-link">
                            Resend verification email
                        </button>
                        <button type="button" onClick={() => navigate('/forgot-password')} className="login-link">
                            Forgot password?
                        </button>
                    </div>

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? '⏳ Signing in...' : '▶ Sign In'}
                    </button>
                </form>

                <div className="login-links">
                    <button onClick={() => navigate('/')}        className="login-link">← Back to home</button>
                    <button onClick={() => navigate('/register')} className="login-link">Create account →</button>
                </div>
                <div className="login-links" style={{ justifyContent: 'center', marginTop: '0.25rem' }}>
                    <button onClick={() => navigate('/help')} className="login-link">📖 Documentation</button>
                </div>
            </div>

            <div className="login-bg-deco" aria-hidden="true">
                <span>ATCG</span><span>GCTA</span><span>TAGC</span>
                <span>CGAT</span><span>ATCG</span><span>GCTA</span>
            </div>
        </div>
    );
}
