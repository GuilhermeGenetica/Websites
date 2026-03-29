// src/pages/JWTLogin.jsx
/**
 * JWTLogin — Login for the Python backend JWT auth system.
 * Shown when auth.enabled = true in engine settings AND user is not authenticated.
 * This is separate from Login.jsx which handles the PHP/MySQL cloud auth.
 */
import { useState } from 'react'
import { API_URL } from '../config.js'
import useStore from '../store/index.js'

export function JWTLogin({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const setEngineToken = useStore(s => s.setEngineToken)
  const setEngineUser  = useStore(s => s.setEngineUser)

  async function handleLogin(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Username and password are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Login failed')
      }
      const data = await resp.json()
      setEngineToken(data.access_token)
      setEngineUser({ username: data.username, role: data.role })
      onSuccess?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">&#x1F9EC;</span>
          <span className="login-logo-text">SeqNode-OS</span>
        </div>
        <p className="login-subtitle">Workflow Engine — Sign In</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form className="login-form" onSubmit={handleLogin} autoComplete="on">
          <div className="login-field">
            <label htmlFor="jwt-username">Username</label>
            <input
              id="jwt-username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="jwt-password">Password</label>
            <div className="login-pwd-wrap">
              <input
                id="jwt-password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? '\u23F3 Signing in...' : '\u25B6 Sign In'}
          </button>
        </form>
      </div>

      <div className="login-bg-deco" aria-hidden="true">
        <span>ATCG</span><span>GCTA</span><span>TAGC</span>
        <span>CGAT</span><span>ATCG</span><span>GCTA</span>
      </div>
    </div>
  )
}
