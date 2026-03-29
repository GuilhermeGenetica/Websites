/**
 * pages/ResetPassword.jsx — SeqNode-OS Reset Password Page
 *
 * Reached via the link in the password-reset email:
 *   /reset-password?token=<hex-token>
 *
 * Submits POST /auth/reset-password  { token, password, password_confirmation }
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation }         from 'react-router-dom';
import { AUTH_URL }                         from '../config.js';

/* Password strength helper (same logic as Register.jsx) */
function pwdStrength(pwd) {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak',   cls: 'pwd-weak'   };
    if (score <= 2) return { label: 'Fair',   cls: 'pwd-fair'   };
    if (score <= 3) return { label: 'Good',   cls: 'pwd-good'   };
    return             { label: 'Strong', cls: 'pwd-strong' };
}

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    const [token,        setToken]        = useState('');
    const [password,     setPassword]     = useState('');
    const [confirm,      setConfirm]      = useState('');
    const [showPwd,      setShowPwd]      = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState('');
    const [success,      setSuccess]      = useState(false);

    /* Extract token from URL on mount */
    useEffect(() => {
        const savedTheme = localStorage.getItem('seqnode-theme') || 'dark';
        document.body.className = 'theme-' + savedTheme;
        const params = new URLSearchParams(location.search);
        const t = params.get('token');
        if (t) {
            setToken(t);
        } else {
            setError('No reset token found in the link. Please request a new password reset.');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const strength = pwdStrength(password);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res  = await fetch(AUTH_URL + '/auth/reset-password', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    token,
                    password,
                    password_confirmation: confirm,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                /* Redirect to login after 3 seconds */
                setTimeout(() => navigate('/login?reset=1', { replace: true }), 3000);
            } else {
                setError(data.message || 'Could not reset password. The link may have expired.');
            }
        } catch {
            setError('Could not reach the server. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [token, password, confirm, navigate]);

    return (
        <div className="login-root">
            <div className="login-card">
                <div className="login-logo">
                    <span className="login-logo-icon">🧬</span>
                    <span className="login-logo-text">SeqNode-OS</span>
                </div>
                <p className="login-subtitle">Set a New Password</p>

                {error   && <div className="login-error" role="alert">{error}</div>}

                {success ? (
                    <div className="login-info" role="status" style={{ textAlign: 'center', padding: '18px 0' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                        <strong>Password changed successfully!</strong>
                        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            Redirecting you to Sign In…
                        </p>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
                        {/* New password */}
                        <div className="login-field">
                            <label htmlFor="rp-password">New Password</label>
                            <div className="login-pwd-wrap">
                                <input
                                    id="rp-password"
                                    type={showPwd ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    disabled={loading || !token}
                                    autoFocus
                                />
                                <button type="button" className="login-pwd-toggle"
                                    onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                                    {showPwd ? '🙈' : '👁'}
                                </button>
                            </div>
                            {/* Strength indicator */}
                            {strength && (
                                <div className="pwd-strength-bar" style={{ marginTop: 6 }}>
                                    <div className={`pwd-strength-fill ${strength.cls}`} />
                                    <span className={`pwd-strength-label ${strength.cls}`}>
                                        {strength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div className="login-field">
                            <label htmlFor="rp-confirm">Confirm Password</label>
                            <div className="login-pwd-wrap">
                                <input
                                    id="rp-confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Repeat your new password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    disabled={loading || !token}
                                />
                                <button type="button" className="login-pwd-toggle"
                                    onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                                    {showConfirm ? '🙈' : '👁'}
                                </button>
                            </div>
                            {confirm && password !== confirm && (
                                <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>
                                    Passwords do not match
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading || !token || password.length < 8 || password !== confirm}
                        >
                            {loading ? '⏳ Saving…' : '🔑 Set New Password'}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="login-links" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                        <button onClick={() => navigate('/login')} className="login-link">
                            ← Back to Sign In
                        </button>
                    </div>
                )}
            </div>

            <div className="login-bg-deco" aria-hidden="true">
                <span>ATCG</span><span>GCTA</span><span>TAGC</span>
                <span>CGAT</span><span>ATCG</span><span>GCTA</span>
            </div>
        </div>
    );
}
