/**
 * pages/ForgotPassword.jsx — SeqNode-OS Password Recovery Page
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate }                      from 'react-router-dom';
import { AUTH_URL }              from '../config.js';

export default function ForgotPassword() {
    const navigate  = useNavigate();
    const [email,   setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [sent,    setSent]    = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('seqnode-theme') || 'dark';
        document.body.className = 'theme-' + savedTheme;
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError('Email is required.'); return; }
        setLoading(true);
        setError('');

        try {
            const res  = await fetch(AUTH_URL + '/auth/forgot-password', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            // API always returns success to prevent email enumeration
            if (data.success) setSent(true);
            else setError(data.message || 'Something went wrong. Please try again.');
        } catch {
            setError('Could not reach the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [email]);

    return (
        <div className="login-root">
            <div className="login-card">
                <div className="login-logo">
                    <span className="login-logo-icon">🧬</span>
                    <span className="login-logo-text">SeqNode-OS</span>
                </div>
                <p className="login-subtitle">Reset your password</p>

                {sent ? (
                    <div>
                        <div className="login-info" role="status">
                            If that email is registered, you will receive a reset link shortly.
                            Please check your inbox (and spam folder).
                        </div>
                        <div className="login-links" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                            <button onClick={() => navigate('/login')} className="login-link">← Back to Sign In</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {error && <div className="login-error" role="alert">{error}</div>}

                        <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
                            <div className="login-field">
                                <label htmlFor="fp-email">Email address</label>
                                <input
                                    id="fp-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="login-submit" disabled={loading}>
                                {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
                            </button>
                        </form>

                        <div className="login-links" style={{ justifyContent: 'center' }}>
                            <button onClick={() => navigate('/login')} className="login-link">← Back to Sign In</button>
                        </div>
                    </>
                )}
            </div>

            <div className="login-bg-deco" aria-hidden="true">
                <span>ATCG</span><span>GCTA</span><span>TAGC</span>
                <span>CGAT</span><span>ATCG</span><span>GCTA</span>
            </div>
        </div>
    );
}
