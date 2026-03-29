/**
 * pages/VerifyEmail.jsx
 * Handles the /verify-email?token=... route linked from verification emails.
 * Calls the PHP backend to validate the token, then redirects to login.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AUTH_URL } from '../config.js';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const savedTheme = localStorage.getItem('seqnode-theme') || 'dark';
        document.body.className = 'theme-' + savedTheme;

        const token = new URLSearchParams(location.search).get('token');

        if (!token) {
            setStatus('error');
            setMessage('Verification token is missing. Please use the link from your email.');
            return;
        }

        fetch(AUTH_URL + '/auth/verify-email?token=' + encodeURIComponent(token), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setStatus('ok');
                    setMessage(data.message || 'Email verified successfully.');
                    // Redirect to login after 2.5 seconds
                    setTimeout(() => navigate('/login?verified=1', { replace: true }), 2500);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed. The link may have expired.');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('Could not reach the server. Please check your connection and try again.');
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="login-root">
            <div className="login-card">
                <div className="login-logo">
                    <span className="login-logo-icon">🧬</span>
                    <span className="login-logo-text">SeqNode-OS</span>
                </div>
                <p className="login-subtitle">Email Verification</p>

                {status === 'loading' && (
                    <div className="login-info" role="status">
                        ⏳ Verifying your email address…
                    </div>
                )}

                {status === 'ok' && (
                    <div>
                        <div className="login-info" role="status">
                            ✅ {message}
                            <br />
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>
                                Redirecting to Sign In…
                            </span>
                        </div>
                        <div className="login-links" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                            <button onClick={() => navigate('/login?verified=1', { replace: true })} className="login-link">
                                → Sign In now
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <div className="login-error" role="alert">
                            ❌ {message}
                        </div>
                        <div className="login-links" style={{ justifyContent: 'center', marginTop: '1rem', flexDirection: 'column', gap: '0.5rem' }}>
                            <button onClick={() => navigate('/resend-verification')} className="login-link">
                                📧 Resend verification email
                            </button>
                            <button onClick={() => navigate('/login')} className="login-link">
                                ← Back to Sign In
                            </button>
                        </div>
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
