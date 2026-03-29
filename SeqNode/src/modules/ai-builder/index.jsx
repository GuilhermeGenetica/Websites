// src/modules/ai-builder/index.jsx
import { useState, useCallback, useRef, useEffect } from 'react'
import { API_URL } from '../../config.js'

/**
 * AIWorkflowBuilder
 * Side panel that converts natural language into a SeqNode-OS workflow.
 * Props:
 *   onLoadWorkflow(workflowJson) — callback to load workflow into canvas
 *   onClose()                   — close the panel
 *   api                         — api.js module (for plugin YAML generation + writes)
 *   store                       — Zustand store (for plugin list + settings)
 */
export function AIWorkflowBuilder({ onLoadWorkflow, onClose, api, store }) {
  const [prompt, setPrompt]             = useState('')
  const [contextFiles, setContextFiles] = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [mode, setMode]                 = useState('generate') // 'generate' | 'result' | 'resolve'

  // Navigation history — stack of result objects, index pointer
  const [history, setHistory]   = useState([])   // array of BuildWorkflowResponse
  const [histIdx, setHistIdx]   = useState(-1)   // current position (-1 = none)

  // Current result is history[histIdx]
  const result = histIdx >= 0 && histIdx < history.length ? history[histIdx] : null

  // Resolve mode state
  const [resolvedNodes, setResolvedNodes] = useState([])  // [{node, status, plugin}]
  const [nodeActions, setNodeActions]     = useState({})  // {nodeId: 'create'|'shell'|'found'|null}
  const [yamlStatus, setYamlStatus]       = useState({})  // {nodeId: 'loading'|'ok'|'error'|msg}

  // Verbose progress log — shown while loading
  const [progressLog, setProgressLog]     = useState([])  // [{ts, msg}]
  const abortRef                          = useRef(null)  // AbortController
  const progressTimerRef                  = useRef(null)  // setInterval handle
  const startTimeRef                      = useRef(null)  // Date.now() at request start

  // Push a new result onto the navigation stack
  function _pushResult(data) {
    setHistory(prev => {
      // Truncate any forward history when adding a new result
      const truncated = prev.slice(0, histIdx + 1)
      return [...truncated, data]
    })
    setHistIdx(prev => prev + 1)
  }

  // Start verbose progress ticker
  function _startProgress(initialMsg) {
    setProgressLog([{ ts: 0, msg: initialMsg }])
    startTimeRef.current = Date.now()
    clearInterval(progressTimerRef.current)
    progressTimerRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
      let msg = `Waiting for LLM response… ${elapsed}s`
      if (elapsed === 15)  msg = 'Still working — complex pipelines can take up to 60s…'
      if (elapsed === 30)  msg = 'Large model thinking — please wait…'
      if (elapsed === 60)  msg = 'Almost there — or request may be timing out soon…'
      setProgressLog(prev => [...prev, { ts: elapsed, msg }])
    }, 5000)
  }

  function _stopProgress(finalMsg) {
    clearInterval(progressTimerRef.current)
    progressTimerRef.current = null
    if (finalMsg) {
      const elapsed = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000)
      setProgressLog(prev => [...prev, { ts: elapsed, msg: finalMsg }])
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearInterval(progressTimerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const settings  = store ? store(s => s.settings) : {}
  const plugins   = store ? store(s => s.plugins || []) : []
  const llmCfg    = settings?.llm_config || {}

  // ── Generate ───────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setProgressLog([])

    const files = contextFiles.split('\n').map(f => f.trim()).filter(Boolean)

    // Abort any previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    // 90-second timeout
    const timeoutId = setTimeout(() => ctrl.abort(), 90_000)

    _startProgress('Sending request to LLM…')

    try {
      const resp = await fetch(`${API_URL}/api/ai/build-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), context_files: files }),
        signal: ctrl.signal,
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || `Request failed (HTTP ${resp.status})`)
      }
      const data = await resp.json()
      _stopProgress('✅ Workflow received!')
      _pushResult(data)
      setMode('result')
    } catch (e) {
      if (e.name === 'AbortError') {
        _stopProgress('⏱ Request timed out after 90s — check your LLM settings.')
        setError('Request timed out. The LLM did not respond in 90 seconds. Check your API key and model in Settings → Auth.')
      } else {
        _stopProgress('❌ ' + e.message)
        setError(e.message)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  async function handleRefine() {
    if (!prompt.trim() || !result?.workflow) return
    setLoading(true)
    setError(null)
    setProgressLog([])

    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const timeoutId = setTimeout(() => ctrl.abort(), 90_000)

    _startProgress('Sending refinement request…')

    try {
      const resp = await fetch(`${API_URL}/api/ai/refine-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: result.workflow, feedback: prompt.trim() }),
        signal: ctrl.signal,
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || `Refine failed (HTTP ${resp.status})`)
      }
      const data = await resp.json()
      _stopProgress('✅ Refinement complete!')
      _pushResult(data)
    } catch (e) {
      if (e.name === 'AbortError') {
        _stopProgress('⏱ Request timed out after 90s.')
        setError('Refinement timed out. The LLM did not respond in 90 seconds.')
      } else {
        _stopProgress('❌ ' + e.message)
        setError(e.message)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.abort()
    _stopProgress('Cancelled by user.')
    setLoading(false)
  }

  // ── Plugin resolution ──────────────────────────────────────────────────────

  function _checkPlugins(workflow) {
    const nodes = workflow?.nodes || []
    return nodes.map(n => {
      const toolId = n.tool_id || n.plugin_id || n.id
      const found  = plugins.find(p => p.id === toolId)
      return {
        node:   n,
        toolId,
        status: found ? 'found' : 'missing',
        plugin: found || null,
      }
    })
  }

  function handleLoadIntoCanvas() {
    if (!result?.workflow) return

    const checked = _checkPlugins(result.workflow)
    const hasMissing = checked.some(r => r.status === 'missing')

    if (!hasMissing) {
      // All plugins present — load directly
      onLoadWorkflow(result.workflow)
      onClose()
      return
    }

    // Switch to resolve mode
    const initialActions = {}
    for (const r of checked) {
      initialActions[r.node.id] = r.status === 'found' ? 'found' : null
    }
    setResolvedNodes(checked)
    setNodeActions(initialActions)
    setYamlStatus({})
    setMode('resolve')
  }

  // ── YAML creation for a missing plugin ────────────────────────────────────

  const handleCreateYaml = useCallback(async (item) => {
    const { node, toolId } = item
    const nodeId = node.id
    setYamlStatus(s => ({ ...s, [nodeId]: 'loading' }))

    try {
      if (!api) throw new Error('api not available')

      const toolName   = node.name || node.label || toolId
      const desc       = node.description || `${toolName} bioinformatics tool`
      const category   = node.category || 'Bioinformatics'

      // 1. Generate YAML via LLM
      const genRes = await api.aiGeneratePluginYaml(toolName, toolId, desc, category)
      if (!genRes.ok) throw new Error(genRes.error || 'YAML generation failed')

      // 2. Write YAML to agent filesystem
      const pluginsDir = settings?.dirs?.plugins || ''
      if (!pluginsDir) throw new Error('Plugins directory not configured in Settings → Directories')

      await api.userPluginWrite(pluginsDir, genRes.filename, genRes.yaml_content)

      // 3. Scan / reload plugins
      await api.userPluginScan(pluginsDir)
      const freshPlugins = await api.getPlugins()
      if (store) store.getState().setPlugins(freshPlugins)

      // 4. Verify the plugin now exists
      const installed = freshPlugins.find(p => p.id === toolId)
      if (!installed) throw new Error(`Plugin written but not found after scan (id: ${toolId})`)

      // 5. Update state
      setYamlStatus(s => ({ ...s, [nodeId]: 'ok' }))
      setNodeActions(s => ({ ...s, [nodeId]: 'found' }))
      setResolvedNodes(prev => prev.map(r =>
        r.node.id === nodeId ? { ...r, status: 'found', plugin: installed } : r
      ))
    } catch (e) {
      setYamlStatus(s => ({ ...s, [nodeId]: e.message }))
    }
  }, [api, store, settings, plugins])

  function handleUseShell(item) {
    setNodeActions(s => ({ ...s, [item.node.id]: 'shell' }))
    setYamlStatus(s => {
      const next = { ...s }
      delete next[item.node.id]
      return next
    })
  }

  // ── Final canvas load after resolution ────────────────────────────────────

  function handleResolvedLoad() {
    if (!result?.workflow) return

    const wf = JSON.parse(JSON.stringify(result.workflow))

    // Apply substitutions
    wf.nodes = (wf.nodes || []).map(n => {
      const action = nodeActions[n.id]
      if (action === 'shell') {
        // Replace with shell_cmd plugin
        const toolName = n.name || n.label || n.tool_id || n.plugin_id || n.id
        return {
          ...n,
          tool_id:   'shell_cmd',
          plugin_id: 'shell_cmd',
          type:      'tool',
          node_type: 'tool',
          label:     n.label || toolName,
          params: {
            cmd: `# ${toolName}\n# TODO: replace with actual command\necho "Running ${toolName}..."`,
            ...(n.params || {}),
          },
        }
      }
      // 'found' or other — use as-is (normalizer will fix tool_id)
      return n
    })

    onLoadWorkflow(wf)
    onClose()
  }

  // ── Derived state for resolve mode ────────────────────────────────────────

  const allResolved = resolvedNodes.every(r => {
    const action = nodeActions[r.node.id]
    return action === 'found' || action === 'shell'
  })

  const missingCount = resolvedNodes.filter(r => r.status === 'missing').length

  // ── UI ────────────────────────────────────────────────────────────────────

  function handleBack() {
    if (mode === 'resolve') {
      setMode('result')
      return
    }
    if (histIdx > 0) {
      setHistIdx(i => i - 1)
      setMode('result')
    } else {
      setMode('generate')
      setError(null)
    }
  }

  function handleForward() {
    if (histIdx < history.length - 1) {
      setHistIdx(i => i + 1)
      setMode('result')
    }
  }

  const canGoBack    = mode === 'resolve' || (mode === 'result' && histIdx >= 0)
  const canGoForward = mode === 'result' && histIdx < history.length - 1

  const providerLabel = llmCfg.provider
    ? llmCfg.provider.charAt(0).toUpperCase() + llmCfg.provider.slice(1)
    : 'Not configured'
  const modelLabel = llmCfg.model || '—'

  return (
    <div className="aib-panel">

      {/* ── Header ── */}
      <div className="aib-header">
        <div className="aib-header-left">
          <button className="aib-back-btn" onClick={handleBack} disabled={!canGoBack} title="Back">
            &#x2190;
          </button>
          <button className="aib-back-btn" onClick={handleForward} disabled={!canGoForward} title="Forward">
            &#x2192;
          </button>
          <span className="aib-title">&#x1F916; AI Workflow Builder</span>
          {history.length > 1 && mode !== 'generate' && (
            <span className="aib-history-badge">{histIdx + 1}/{history.length}</span>
          )}
        </div>
        <button className="aib-close-btn" onClick={onClose} title="Close panel">
          &times;
        </button>
      </div>

      {/* ── LLM info bar ── */}
      <div className="aib-provider-bar">
        <span className="aib-provider-label">Provider</span>
        <strong className="aib-provider-value">{providerLabel}</strong>
        <span className="aib-provider-sep">/</span>
        <span className="aib-provider-model">{modelLabel}</span>
        <a
          className="aib-provider-config"
          href="#"
          onClick={e => {
            e.preventDefault()
            onClose()
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('seqnode:open-settings-auth'))
            }, 80)
          }}
        >
          Configure
        </a>
      </div>

      {/* ── Generate form ── */}
      {mode === 'generate' && (
        <div className="aib-body">
          <div className="aib-field">
            <label className="aib-label">Describe your pipeline</label>
            <textarea
              className="aib-textarea aib-textarea--large"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Align paired-end reads with BWA-MEM, sort and index with SAMtools, call variants with GATK HaplotypeCaller, then annotate with SnpEff"
              rows={6}
              disabled={loading}
            />
          </div>

          <div className="aib-field">
            <label className="aib-label">
              Input file paths
              <span className="aib-label-hint">optional — one path per line</span>
            </label>
            <textarea
              className="aib-textarea aib-textarea--small"
              value={contextFiles}
              onChange={e => setContextFiles(e.target.value)}
              placeholder={"/data/sample_R1.fastq.gz\n/data/sample_R2.fastq.gz\n/ref/hg38.fa"}
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="aib-error-box">
              <span className="aib-error-icon">&#x274C;</span>
              <span>{error}</span>
            </div>
          )}

          <div className="aib-actions">
            {loading ? (
              <div className="aib-actions aib-actions--row" style={{ gap: 8 }}>
                <button
                  className="aib-btn aib-btn--primary aib-btn--full"
                  disabled
                  style={{ flex: 1 }}
                >
                  <span className="aib-spinner">&#x23F3;</span> Generating&hellip;
                </button>
                <button
                  className="aib-btn aib-btn--muted"
                  onClick={handleCancel}
                  title="Cancel request"
                >
                  &#x274C; Cancel
                </button>
              </div>
            ) : (
              <button
                className="aib-btn aib-btn--primary aib-btn--full"
                onClick={handleGenerate}
                disabled={!prompt.trim()}
              >
                <span>&#x2728;</span> Generate Workflow
              </button>
            )}
          </div>

          <div className="aib-hint-box">
            <strong>Tips:</strong>
            <ul>
              <li>Name the tools you want to use (e.g. BWA-MEM, GATK, SAMtools)</li>
              <li>Describe the data type (WGS, WES, RNA-seq&hellip;)</li>
              <li>Mention the reference genome if applicable (hg38, GRCh37&hellip;)</li>
            </ul>
          </div>

          {/* ── Verbose progress log ── */}
          {progressLog.length > 0 && (
            <div className="aib-progress-log">
              <div className="aib-progress-log-title">&#x1F4CB; Progress</div>
              {progressLog.map((entry, i) => (
                <div key={i} className="aib-progress-entry">
                  {entry.ts > 0 && <span className="aib-progress-ts">{entry.ts}s</span>}
                  <span className="aib-progress-msg">{entry.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Result view ── */}
      {mode === 'result' && result && (
        <div className="aib-body">

          {/* Status banner */}
          <div className={`aib-status-banner ${result.is_valid ? 'aib-status-banner--ok' : 'aib-status-banner--warn'}`}>
            <span className="aib-status-icon">
              {result.is_valid ? '✅' : '⚠️'}
            </span>
            <span className="aib-status-text">
              {result.is_valid ? 'Workflow generated successfully' : 'Generated with validation warnings'}
            </span>
            <span className="aib-status-meta">
              {result.duration_ms}ms &middot; {result.provider_used}
            </span>
          </div>

          {/* Validation errors */}
          {result.validation_errors?.length > 0 && (
            <div className="aib-validation-errors">
              <div className="aib-validation-title">&#x26A0; Validation issues</div>
              {result.validation_errors.map((e, i) => (
                <div key={i} className="aib-validation-item">&bull; {e}</div>
              ))}
            </div>
          )}

          {/* Workflow summary */}
          {result.workflow && (
            <div className="aib-summary-card">
              <div className="aib-summary-name">{result.workflow.name || 'Untitled Workflow'}</div>
              <div className="aib-summary-stats">
                <span className="aib-stat"><strong>{result.workflow.nodes?.length || 0}</strong> nodes</span>
                <span className="aib-stat-sep">&middot;</span>
                <span className="aib-stat"><strong>{result.workflow.edges?.length || 0}</strong> edges</span>
                {result.workflow.description && (
                  <>
                    <span className="aib-stat-sep">&middot;</span>
                    <span className="aib-stat aib-stat--desc">{result.workflow.description}</span>
                  </>
                )}
              </div>

              {/* Node list preview */}
              {result.workflow.nodes?.length > 0 && (
                <div className="aib-node-preview">
                  {result.workflow.nodes.map((n, i) => (
                    <div key={n.id || i} className="aib-node-chip">
                      <span className="aib-node-chip-num">{i + 1}</span>
                      <span className="aib-node-chip-name">{n.name || n.label || n.tool_id || n.plugin_id || n.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="aib-error-box">
              <span className="aib-error-icon">&#x274C;</span>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="aib-actions aib-actions--col">
            <button
              className="aib-btn aib-btn--success aib-btn--full"
              onClick={handleLoadIntoCanvas}
              disabled={!result.workflow}
            >
              &#x1F4E5; Load into Canvas
            </button>

            <div className="aib-actions aib-actions--row">
              <div className="aib-field" style={{ flex: 1 }}>
                <textarea
                  className="aib-textarea aib-textarea--small"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe a refinement&hellip; (e.g. add a QC step before alignment)"
                  rows={2}
                  disabled={loading}
                />
              </div>
            </div>

            {loading ? (
              <div className="aib-actions aib-actions--row" style={{ gap: 8 }}>
                <button className="aib-btn aib-btn--secondary aib-btn--full" disabled style={{ flex: 1 }}>
                  <span className="aib-spinner">&#x23F3;</span> Refining&hellip;
                </button>
                <button className="aib-btn aib-btn--muted" onClick={handleCancel} title="Cancel">
                  &#x274C; Cancel
                </button>
              </div>
            ) : (
              <button
                className="aib-btn aib-btn--secondary aib-btn--full"
                onClick={handleRefine}
                disabled={!prompt.trim() || !result?.workflow}
              >
                &#x1F504; Refine Workflow
              </button>
            )}
          </div>

          {/* ── Verbose progress log ── */}
          {progressLog.length > 0 && (
            <div className="aib-progress-log">
              <div className="aib-progress-log-title">&#x1F4CB; Progress</div>
              {progressLog.map((entry, i) => (
                <div key={i} className="aib-progress-entry">
                  {entry.ts > 0 && <span className="aib-progress-ts">{entry.ts}s</span>}
                  <span className="aib-progress-msg">{entry.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Resolve mode ── */}
      {mode === 'resolve' && (
        <div className="aib-body">
          <div className="aib-resolve-header">
            <span className="aib-resolve-title">&#x1F50D; Plugin Resolution</span>
            <span className="aib-resolve-sub">
              {missingCount === 0
                ? 'All plugins found'
                : `${missingCount} plugin${missingCount > 1 ? 's' : ''} not installed`}
            </span>
          </div>

          <div className="aib-resolve-list">
            {resolvedNodes.map((item, i) => {
              const action = nodeActions[item.node.id]
              const yst    = yamlStatus[item.node.id]
              const label  = item.node.name || item.node.label || item.toolId

              if (item.status === 'found' || action === 'found') {
                return (
                  <div key={item.node.id} className="aib-resolve-item aib-resolve-item--found">
                    <span className="aib-resolve-icon">✅</span>
                    <span className="aib-resolve-name">{label}</span>
                    <span className="aib-resolve-hint">installed</span>
                  </div>
                )
              }

              if (action === 'shell') {
                return (
                  <div key={item.node.id} className="aib-resolve-item aib-resolve-item--shell">
                    <span className="aib-resolve-icon">&#x1F41A;</span>
                    <span className="aib-resolve-name">{label}</span>
                    <span className="aib-resolve-hint">will use Shell Command</span>
                    <button
                      className="aib-resolve-undo"
                      onClick={() => setNodeActions(s => ({ ...s, [item.node.id]: null }))}
                      title="Undo"
                    >&#x21A9;</button>
                  </div>
                )
              }

              // Missing — waiting for decision
              return (
                <div key={item.node.id} className="aib-resolve-item aib-resolve-item--missing">
                  <span className="aib-resolve-icon">⚠️</span>
                  <div className="aib-resolve-info">
                    <span className="aib-resolve-name">{label}</span>
                    <span className="aib-resolve-id">{item.toolId}</span>
                  </div>
                  <div className="aib-resolve-actions">
                    {yst === 'loading' ? (
                      <span className="aib-resolve-spinner">&#x23F3; Generating YAML&hellip;</span>
                    ) : yst === 'ok' ? (
                      <span className="aib-resolve-ok">&#x2714; Created</span>
                    ) : (
                      <>
                        <button
                          className="aib-btn aib-btn--xs aib-btn--accent"
                          onClick={() => handleCreateYaml(item)}
                          title="Generate plugin YAML and install"
                        >
                          &#x2795; Create YAML
                        </button>
                        <button
                          className="aib-btn aib-btn--xs aib-btn--muted"
                          onClick={() => handleUseShell(item)}
                          title="Replace with Shell Command node"
                        >
                          &#x1F41A; Shell Cmd
                        </button>
                      </>
                    )}
                  </div>
                  {yst && yst !== 'loading' && yst !== 'ok' && (
                    <div className="aib-resolve-error">{yst}</div>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="aib-error-box">
              <span className="aib-error-icon">&#x274C;</span>
              <span>{error}</span>
            </div>
          )}

          <div className="aib-actions aib-actions--col" style={{ marginTop: 16 }}>
            <button
              className="aib-btn aib-btn--success aib-btn--full"
              onClick={handleResolvedLoad}
              disabled={!allResolved}
              title={allResolved ? 'Load workflow into canvas' : 'Resolve all missing plugins first'}
            >
              &#x1F4E5; Load into Canvas
            </button>
            <div className="aib-resolve-hint-box">
              Resolve each missing plugin by generating a YAML or substituting with a Shell Command node.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
