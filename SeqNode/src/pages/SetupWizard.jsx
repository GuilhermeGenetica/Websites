// src/pages/SetupWizard.jsx
/**
 * SetupWizard — First-run admin account setup for Python backend JWT auth.
 * Only shown when auth.enabled = true AND no users exist yet.
 */
import { useState } from 'react'
import { API_URL } from '../config.js'
import useStore from '../store/index.js'

export function SetupWizard({ onComplete }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const setEngineToken = useStore(s => s.setEngineToken)
  const setEngineUser  = useStore(s => s.setEngineUser)

  async function handleSetup(e) {
    e.preventDefault()
    setError(null)

    if (!username.trim()) { setError('Username is required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Setup failed')
      }

      // Auto-login after setup
      const loginResp = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      if (loginResp.ok) {
        const loginData = await loginResp.json()
        setEngineToken(loginData.access_token)
        setEngineUser({ username: loginData.username, role: loginData.role })
      }
      onComplete?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-wizard-root">
      <div className="setup-wizard-card">
        <div className="setup-wizard-header">
          <span className="setup-wizard-icon">&#x1F9EC;</span>
          <h2>SeqNode-OS — First Time Setup</h2>
        </div>
        <p className="setup-wizard-subtitle">
          Create your admin account to secure access to the workflow engine.
        </p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form onSubmit={handleSetup} autoComplete="off">
          <div className="login-field">
            <label htmlFor="setup-username">Admin Username</label>
            <input
              id="setup-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="setup-password">Password (min 8 chars)</label>
            <div className="login-pwd-wrap">
              <input
                id="setup-password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
              >
                {showPwd ? '&#x1F648;' : '&#x1F441;'}
              </button>
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="setup-confirm">Confirm Password</label>
            <input
              id="setup-confirm"
              type={showPwd ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? '\u23F3 Creating account...' : '\u2714 Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
