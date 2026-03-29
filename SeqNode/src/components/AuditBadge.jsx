// src/components/AuditBadge.jsx
import { API_URL } from '../config.js'

/**
 * AuditBadge — export buttons for audit of a specific run.
 * Use in run history.
 * Props:
 *   runId — string run ID
 */
export function AuditBadge({ runId }) {
  async function download(format) {
    const url = `${API_URL}/api/runs/${encodeURIComponent(runId)}/audit?format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_${runId}.${format === 'jsonld' ? 'json' : format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <span className="audit-badge">
      <button
        onClick={() => download('pdf')}
        title="Download PDF audit report"
        className="btn-audit"
      >
        &#x1F4CB; PDF
      </button>
      <button
        onClick={() => download('jsonld')}
        title="Download JSON-LD audit"
        className="btn-audit"
      >
        &#x1F517; JSON-LD
      </button>
    </span>
  )
}
