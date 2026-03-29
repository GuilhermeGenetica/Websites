// src/components/PluginHubPanel.jsx
import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'

/**
 * PluginHubPanel — Community Plugin Hub browser and installer.
 * Shows remote plugins from the SeqNode-OS community hub with search, tags, and install.
 */
export function PluginHubPanel() {
  const [plugins, setPlugins]         = useState([])
  const [tags, setTags]               = useState([])
  const [search, setSearch]           = useState('')
  const [activeTag, setActiveTag]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [installing, setInstalling]   = useState(null)  // plugin_id being installed
  const [error, setError]             = useState(null)
  const [successMsg, setSuccessMsg]   = useState(null)

  async function loadPlugins() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search)    params.set('search', search)
      if (activeTag) params.set('tag', activeTag)
      const resp = await fetch(`${API_URL}/api/plugins/hub?${params}`)
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Failed to load hub')
      }
      const data = await resp.json()
      setPlugins(data.plugins || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadTags() {
    try {
      const resp = await fetch(`${API_URL}/api/plugins/hub/tags`)
      if (!resp.ok) return
      const data = await resp.json()
      setTags(data.tags || [])
    } catch (_) { /* ignore */ }
  }

  async function installPlugin(plugin) {
    if (!plugin.yaml_url) {
      setError(`Plugin '${plugin.name}' has no yaml_url`)
      return
    }
    setInstalling(plugin.id)
    setError(null)
    setSuccessMsg(null)
    try {
      const resp = await fetch(`${API_URL}/api/plugins/hub/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml_url: plugin.yaml_url }),
      })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || 'Install failed')
      }
      setSuccessMsg(`Plugin '${plugin.name}' installed successfully!`)
      await loadPlugins()  // refresh to show "installed"
    } catch (e) {
      setError(`Install failed: ${e.message}`)
    } finally {
      setInstalling(null)
    }
  }

  async function refreshHub() {
    try {
      await fetch(`${API_URL}/api/plugins/hub/refresh`, { method: 'POST' })
    } catch (_) { /* ignore */ }
    await loadPlugins()
  }

  useEffect(() => { loadTags() }, [])
  useEffect(() => { loadPlugins() }, [search, activeTag]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="plugin-hub-panel">
      <div className="hub-header">
        <h4>&#x1F310; Community Plugin Hub</h4>
        <button onClick={refreshHub} className="btn-refresh" title="Refresh hub">&#x21BB;</button>
      </div>

      <input
        type="text"
        placeholder="Search plugins..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="hub-search"
      />

      <div className="hub-tags">
        <button
          className={`tag-chip${!activeTag ? ' active' : ''}`}
          onClick={() => setActiveTag('')}
        >All</button>
        {tags.map(tag => (
          <button
            key={tag}
            className={`tag-chip${activeTag === tag ? ' active' : ''}`}
            onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
          >{tag}</button>
        ))}
      </div>

      {error      && <div className="hub-error">&#x274C; {error}</div>}
      {successMsg && <div className="hub-success">&#x2705; {successMsg}</div>}
      {loading    && <div className="hub-loading">Loading hub...</div>}

      <div className="hub-plugin-list">
        {plugins.map(plugin => (
          <div key={plugin.id} className={`hub-plugin-card${plugin.installed ? ' installed' : ''}`}>
            <div className="hub-plugin-header">
              <strong>{plugin.name}</strong>
              {plugin.verified  && <span className="badge-verified">&#x2713; Verified</span>}
              {plugin.installed && <span className="badge-installed">Installed</span>}
            </div>
            <div className="hub-plugin-meta">
              v{plugin.version} &middot; by {plugin.author}
            </div>
            <div className="hub-plugin-desc">{plugin.description}</div>
            <div className="hub-plugin-tags">
              {(plugin.tags || []).map(t => (
                <span key={t} className="tag-small">{t}</span>
              ))}
            </div>
            {!plugin.installed && (
              <button
                onClick={() => installPlugin(plugin)}
                disabled={installing === plugin.id}
                className="btn-install"
              >
                {installing === plugin.id ? '\u23F3 Installing...' : '\u2B07\uFE0F Install'}
              </button>
            )}
          </div>
        ))}
        {!loading && plugins.length === 0 && (
          <div className="hub-empty">No plugins found. Try a different search.</div>
        )}
      </div>
    </div>
  )
}
