/**
 * pages/Register.jsx — SeqNode-OS Registration Page
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate }                       from 'react-router-dom';
import { isAuthenticated }                   from '../utils/auth.js';
import { AUTH_URL }                          from '../config.js';

const ROLES = [
    { value: 'researcher',       label: 'Researcher' },
    { value: 'physician',        label: 'Physician / Medical Doctor' },
    { value: 'bioinformatician', label: 'Bioinformatician' },
    { value: 'student',          label: 'Student' },
    { value: 'university_staff', label: 'University Staff' },
    { value: 'institution',      label: 'Institution / Organization' },
];

export default function Register() {
    const navigate = useNavigate();

    const [fullName, setFullName]   = useState('');
    const [email,    setEmail]      = useState('');
    const [role,     setRole]       = useState('researcher');
    const [password, setPassword]   = useState('');
    const [confirm,  setConfirm]    = useState('');
    const [loading,  setLoading]    = useState(false);
    const [error,    setError]      = useState('');
    const [showPwd,  setShowPwd]    = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('seqnode-theme') || 'dark';
        document.body.className = 'theme-' + savedTheme;
        if (isAuthenticated()) navigate('/app', { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Password strength
    const strength = (() => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= 8)          s++;
        if (/[A-Z]/.test(password))        s++;
        if (/[0-9]/.test(password))        s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    })();
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthClass = ['', 'pwd-weak', 'pwd-fair', 'pwd-good', 'pwd-strong'][strength];

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!fullName.trim())          { setError('Full name is required.');                       return; }
        if (!email.trim())             { setError('Email is required.');                           return; }
        if (!password)                 { setError('Password is required.');                        return; }
        if (password.length < 8)       { setError('Password must be at least 8 characters.');     return; }
        if (password !== confirm)      { setError('Passwords do not match.');                      return; }
        setLoading(true);
        setError('');

        try {
            const res  = await fetch(AUTH_URL + '/auth/register', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    full_name:             fullName.trim(),
                    email:                 email.trim().toLowerCase(),
                    role,
                    password,
                    password_confirmation: confirm,
                }),
            });
            const data = await res.json();

            if (data.success) {
                navigate('/login?registered=1');
            } else {
                // Show field-level errors if present
                if (data.errors) {
                    const msgs = Object.values(data.errors).flat();
                    setError(msgs.join(' '));
                } else {
                    setError(data.message || 'Registration failed. Please try again.');
                }
            }
        } catch {
            setError('Could not reach the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [fullName, email, role, password, confirm, navigate]);

    return (
        <div className="login-root">
            <div className="login-card" style={{ maxWidth: 460 }}>
                <div className="login-logo">
                    <span className="login-logo-icon">🧬</span>
                    <span className="login-logo-text">SeqNode-OS</span>
                </div>
                <p className="login-subtitle">Create your account</p>

                {error && <div className="login-error" role="alert">{error}</div>}

                <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
                    <div className="login-field">
                        <label htmlFor="reg-name">Full Name</label>
                        <input
                            id="reg-name"
                            type="text"
                            autoComplete="name"
                            placeholder="Jane Smith"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@institution.edu"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="reg-role">Role / Profile</label>
                        <select
                            id="reg-role"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {ROLES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="login-field">
                        <label htmlFor="reg-password">
                            Password
                            {password && (
                                <span className={'pwd-strength ' + strengthClass}>{strengthLabel}</span>
                            )}
                        </label>
                        <div className="login-pwd-wrap">
                            <input
                                id="reg-password"
                                type={showPwd ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder="Min. 8 chars"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button type="button" className="login-pwd-toggle"
                                onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                                {showPwd ? '🙈' : '👁'}
                            </button>
                        </div>
                        {password && (
                            <div className="pwd-bar-wrap">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className={'pwd-bar ' + (strength >= i ? strengthClass : '')} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="login-field">
                        <label htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            type={showPwd ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Repeat password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? '⏳ Creating account...' : '✔ Create Account'}
                    </button>
                </form>

                <div className="login-links" style={{ justifyContent: 'center', gap: '1.5rem' }}>
                    <button onClick={() => navigate('/login')} className="login-link">← Back to Sign In</button>
                    <button onClick={() => navigate('/help')}  className="login-link">📖 Documentation</button>
                </div>
            </div>

            <div className="login-bg-deco" aria-hidden="true">
                <span>ATCG</span><span>GCTA</span><span>TAGC</span>
                <span>CGAT</span><span>ATCG</span><span>GCTA</span>
            </div>
        </div>
    );
}
