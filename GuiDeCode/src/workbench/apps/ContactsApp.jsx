import React from 'react'

const CONTACTS = [
  { category: 'Professional', items: [
    { label: 'Email', value: 'guilherme@onnetweb.com', href: 'mailto:guilherme@onnetweb.com', icon: '📧' },
    { label: 'LinkedIn', value: 'linkedin.com/in/guilherme-de-macedo-oliveira', href: 'https://www.linkedin.com/in/guilherme-de-macedo-oliveira', icon: '🔗' },
    { label: 'Website', value: 'guilherme.onnetweb.com', href: 'https://guilherme.onnetweb.com', icon: '🌐' },
    { label: 'Amazon Author', value: 'amazon.com/dp/B0FFR9XM1R', href: 'https://www.amazon.com/dp/B0FFR9XM1R', icon: '📚' },
  ]},
  { category: 'Academic', items: [
    { label: 'ORCID', value: '0000-0001-8924-6894', href: 'https://orcid.org/0000-0001-8924-6894', icon: '🆔' },
    { label: 'PubMed', value: 'Oliveira GM', href: 'https://pubmed.ncbi.nlm.nih.gov/?term=oliveira+gm', icon: '🔬' },
    { label: 'QPM Portal', value: 'qpm.onnetweb.com', href: 'https://qpm.onnetweb.com', icon: '🧬' },
  ]},
  { category: 'Europass', items: [
    { label: 'Europass CV', value: 'View Full CV', href: 'https://europa.eu/europass/eportfolio/api/eprofile/shared-profile/guilherme-de+macedo+oliveira/6a2514a9-e9b3-4d2b-81d0-6881f359b52c?view=html', icon: '📋' },
  ]}
]

const ContactsApp = () => {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace', fontSize: '13px', padding: '16px' }}>
      <h2 style={{ margin: '0 0 16px', color: '#89b4fa', fontSize: '18px', borderBottom: '1px solid #313244', paddingBottom: '8px' }}>Contact Information</h2>
      {CONTACTS.map(group => (
        <div key={group.category} style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px', color: '#f9e2af', fontSize: '14px' }}>{group.category}</h3>
          {group.items.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                marginBottom: '4px',
                background: '#181825',
                borderRadius: '6px',
                border: '1px solid #313244',
                textDecoration: 'none',
                color: '#cdd6f4',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#313244'}
              onMouseLeave={e => e.currentTarget.style.background = '#181825'}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#89b4fa' }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: '#a6adc8' }}>{item.value}</div>
              </div>
            </a>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ContactsApp