import React, { useState } from 'react'

const CV_URLS = {
  en: 'https://europa.eu/europass/eportfolio/api/eprofile/shared-profile/guilherme-de+macedo+oliveira/6a2514a9-e9b3-4d2b-81d0-6881f359b52c?view=html',
  pt: 'https://europa.eu/europass/eportfolio/api/eprofile/shared-profile/guilherme-de+macedo+oliveira/6a2514a9-e9b3-4d2b-81d0-6881f359b52c?view=html',
  it: 'https://europa.eu/europass/eportfolio/api/eprofile/shared-profile/guilherme-de+macedo+oliveira/6a2514a9-e9b3-4d2b-81d0-6881f359b52c?view=html'
}

const CurriculumViewer = () => {
  const [lang, setLang] = useState('en')
  const [loading, setLoading] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#181825', borderBottom: '1px solid #313244' }}>
        <span style={{ fontSize: '12px', color: '#a6adc8' }}>Language:</span>
        {Object.keys(CV_URLS).map(l => (
          <button
            key={l}
            onClick={() => { setLang(l); setLoading(true) }}
            style={{
              background: lang === l ? '#89b4fa' : '#313244',
              color: lang === l ? '#1e1e2e' : '#cdd6f4',
              border: 'none',
              padding: '3px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}
          >
            {l}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <a href={CV_URLS[lang]} target="_blank" rel="noopener noreferrer" style={{ color: '#a6e3a1', fontSize: '11px', textDecoration: 'none' }}>Open in new tab ↗</a>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e2e', zIndex: 2, color: '#585b70' }}>Loading CV...</div>
        )}
        <iframe
          src={CV_URLS[lang]}
          onLoad={() => setLoading(false)}
          style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
          title="Curriculum Vitae"
        />
      </div>
    </div>
  )
}

export default CurriculumViewer