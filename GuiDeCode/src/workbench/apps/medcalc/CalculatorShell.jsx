import React, { useState, useMemo } from 'react'
import { SYSTEMS } from './registry'

const CalculatorShell = ({ calculator, onBack }) => {
  const [values, setValues] = useState({})
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('calculator')

  const systemInfo = SYSTEMS[calculator.system] || SYSTEMS.utilities

  const handleChange = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleCalculate = () => {
    const res = calculator.calculate(values)
    setResult(res)
  }

  const handleClear = () => {
    setValues({})
    setResult(null)
  }

  const allFieldsFilled = useMemo(() => {
    if (!calculator.fields) return false
    return calculator.fields.every(f => {
      const v = values[f.key]
      if (f.required === false) return true
      return v !== undefined && v !== '' && v !== null
    })
  }, [values, calculator.fields])

  const renderField = (field) => {
    const val = values[field.key]

    if (field.type === 'select') {
      return (
        <select
          value={val || ''}
          onChange={e => handleChange(field.key, e.target.value)}
          style={{
            width: '100%', maxWidth: '400px', padding: '8px 10px',
            background: '#11111b', border: '1px solid #313244', borderRadius: '6px',
            color: '#cdd6f4', fontSize: '13px', cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Select...</option>
          {field.options.map(opt => {
            const optVal = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? opt.label : opt
            return <option key={optVal} value={optVal}>{optLabel}</option>
          })}
        </select>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!val}
            onChange={e => handleChange(field.key, e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#89b4fa', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: '#cdd6f4' }}>{field.checkboxLabel || 'Yes'}</span>
        </label>
      )
    }

    if (field.type === 'radio') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {field.options.map(opt => {
            const optVal = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? opt.label : opt
            const selected = val === optVal
            return (
              <button
                key={optVal}
                onClick={() => handleChange(field.key, optVal)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '12px', border: '1px solid',
                  background: selected ? '#89b4fa' : '#181825',
                  color: selected ? '#1e1e2e' : '#cdd6f4',
                  borderColor: selected ? '#89b4fa' : '#313244',
                  fontWeight: selected ? 'bold' : 'normal',
                  transition: 'all 0.15s ease',
                }}
              >
                {optLabel}
              </button>
            )
          })}
        </div>
      )
    }

    if (field.type === 'score_picker') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {field.options.map(opt => {
            const optVal = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? opt.label : opt
            const selected = String(val) === String(optVal)
            return (
              <button
                key={optVal}
                onClick={() => handleChange(field.key, optVal)}
                style={{
                  padding: '5px 10px', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '11px', border: '1px solid',
                  background: selected ? systemInfo.color : '#181825',
                  color: selected ? '#1e1e2e' : '#a6adc8',
                  borderColor: selected ? systemInfo.color : '#313244',
                  fontWeight: selected ? 'bold' : 'normal',
                  minWidth: '44px', textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {optLabel}
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <input
        type="number"
        step={field.step || 'any'}
        min={field.min}
        max={field.max}
        value={val || ''}
        placeholder={field.placeholder || ''}
        onChange={e => handleChange(field.key, e.target.value)}
        style={{
          width: '100%', maxWidth: '400px', padding: '8px 10px',
          background: '#11111b', border: '1px solid #313244', borderRadius: '6px',
          color: '#cdd6f4', fontSize: '13px', boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    )
  }

  const renderCalculatorTab = () => (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {calculator.fields.map(field => (
          <div key={field.key}>
            <label style={{
              display: 'block', fontSize: '12px', color: '#a6adc8',
              marginBottom: '5px', fontWeight: '600',
            }}>
              {field.label}
              {field.hint && <span style={{ fontWeight: 'normal', color: '#585b70', marginLeft: '6px', fontSize: '11px' }}>{field.hint}</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={handleCalculate}
          disabled={!allFieldsFilled}
          style={{
            background: allFieldsFilled ? '#89b4fa' : '#45475a',
            color: allFieldsFilled ? '#1e1e2e' : '#585b70',
            border: 'none', padding: '10px 28px', borderRadius: '6px',
            cursor: allFieldsFilled ? 'pointer' : 'not-allowed',
            fontWeight: 'bold', fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
        >
          Calculate
        </button>
        <button
          onClick={handleClear}
          style={{
            background: '#313244', color: '#cdd6f4', border: 'none',
            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
          }}
        >
          Clear
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: '24px', padding: '20px', background: '#181825',
          border: '1px solid #313244', borderRadius: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#a6e3a1' }}>{result.result}</span>
            <span style={{ fontSize: '14px', color: '#a6adc8' }}>{result.unit}</span>
          </div>
          {result.interpretation && (
            <div style={{
              marginTop: '10px', fontSize: '14px', color: '#f9e2af',
              padding: '10px 14px', background: '#1e1e2e', borderRadius: '6px',
              borderLeft: `3px solid ${systemInfo.color}`,
            }}>
              {result.interpretation}
            </div>
          )}
          {result.detail && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#a6adc8', lineHeight: '1.6' }}>
              {result.detail}
            </div>
          )}
          {result.breakdown && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: '#585b70', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {result.breakdown.map((item, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#a6adc8', display: 'flex', justifyContent: 'space-between', maxWidth: '400px' }}>
                    <span>{item.label}</span>
                    <span style={{ color: '#cdd6f4', fontWeight: '600' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {calculator.interpretations && calculator.interpretations.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{
            fontSize: '12px', color: '#585b70', marginBottom: '10px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Score Interpretation
          </div>
          <div style={{
            background: '#181825', border: '1px solid #313244',
            borderRadius: '8px', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#11111b' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#a6adc8', fontWeight: '600', borderBottom: '1px solid #313244' }}>Range</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#a6adc8', fontWeight: '600', borderBottom: '1px solid #313244' }}>Interpretation</th>
                  {calculator.interpretations[0]?.action && (
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#a6adc8', fontWeight: '600', borderBottom: '1px solid #313244' }}>Recommendation</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {calculator.interpretations.map((row, i) => {
                  const isActive = result && row.range && checkInterpretationActive(result.result, row.range)
                  return (
                    <tr key={i} style={{
                      background: isActive ? `${systemInfo.color}15` : 'transparent',
                      borderLeft: isActive ? `3px solid ${systemInfo.color}` : '3px solid transparent',
                    }}>
                      <td style={{
                        padding: '8px 12px', color: '#cdd6f4', borderBottom: '1px solid #1e1e2e',
                        fontWeight: isActive ? 'bold' : 'normal',
                      }}>
                        {row.range}
                      </td>
                      <td style={{
                        padding: '8px 12px', color: isActive ? '#f9e2af' : '#a6adc8',
                        borderBottom: '1px solid #1e1e2e',
                      }}>
                        {row.label}
                      </td>
                      {row.action !== undefined && (
                        <td style={{
                          padding: '8px 12px', color: '#a6adc8',
                          borderBottom: '1px solid #1e1e2e', fontSize: '11px',
                        }}>
                          {row.action}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderAboutTab = () => (
    <div style={{ maxWidth: '700px', lineHeight: '1.7', fontSize: '13px', color: '#a6adc8' }}>
      {calculator.whyUse && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>Why Use</div>
          <div style={{ color: '#cdd6f4' }}>{calculator.whyUse}</div>
        </div>
      )}
      {calculator.description && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>About</div>
          <div style={{ color: '#cdd6f4' }}>{calculator.description}</div>
        </div>
      )}
      {calculator.whenToUse && calculator.whenToUse.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>When to Use</div>
          <ul style={{ margin: '0', paddingLeft: '18px' }}>
            {calculator.whenToUse.map((item, i) => (
              <li key={i} style={{ marginBottom: '4px', color: '#cdd6f4' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {calculator.pearls && calculator.pearls.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>Pearls / Pitfalls</div>
          <ul style={{ margin: '0', paddingLeft: '18px' }}>
            {calculator.pearls.map((item, i) => (
              <li key={i} style={{ marginBottom: '4px', color: '#cdd6f4' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {calculator.formula && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>Formula</div>
          <div style={{
            background: '#11111b', padding: '14px 16px', borderRadius: '8px',
            fontFamily: 'monospace', fontSize: '13px', color: '#89b4fa',
            border: '1px solid #313244', whiteSpace: 'pre-wrap',
          }}>
            {calculator.formula}
          </div>
        </div>
      )}
      {calculator.nextSteps && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>Next Steps</div>
          <div style={{ color: '#cdd6f4' }}>{calculator.nextSteps}</div>
        </div>
      )}
      {calculator.creatorName && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>Creator</div>
          <div style={{ color: '#cdd6f4' }}>
            {calculator.creatorName}{calculator.creatorYear ? ` (${calculator.creatorYear})` : ''}
          </div>
        </div>
      )}
    </div>
  )

  const renderEvidenceTab = () => (
    <div style={{ maxWidth: '700px', lineHeight: '1.7', fontSize: '13px', color: '#a6adc8' }}>
      {calculator.evidence && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>Evidence Summary</div>
          <div style={{ color: '#cdd6f4' }}>{calculator.evidence}</div>
        </div>
      )}
      {calculator.references && calculator.references.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>References</div>
          <ol style={{ margin: '0', paddingLeft: '18px' }}>
            {calculator.references.map((ref, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>
                <div style={{ color: '#cdd6f4' }}>{ref.text}</div>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#89b4fa', fontSize: '11px', textDecoration: 'none' }}
                  >
                    {ref.url}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
      {calculator.links && calculator.links.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeaderStyle}>Educational Resources</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {calculator.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#181825', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #313244', textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#89b4fa'; e.currentTarget.style.background = '#1e1e2e' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#313244'; e.currentTarget.style.background = '#181825' }}
              >
                <span style={{ color: '#89b4fa', fontSize: '14px' }}>↗</span>
                <div>
                  <div style={{ color: '#89b4fa', fontSize: '13px' }}>{link.title}</div>
                  {link.description && <div style={{ color: '#585b70', fontSize: '11px', marginTop: '2px' }}>{link.description}</div>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const sectionHeaderStyle = {
    fontSize: '11px', color: '#585b70', marginBottom: '8px', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '0.8px',
  }

  const tabs = [
    { id: 'calculator', label: 'Calculator' },
    { id: 'about', label: 'About' },
    { id: 'evidence', label: 'Evidence' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid #313244', background: '#181825',
        display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: '#89b4fa', cursor: 'pointer',
            fontSize: '18px', padding: '2px 6px', lineHeight: 1,
          }}
          title="Back to list"
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
              fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
              background: `${systemInfo.color}22`, color: systemInfo.color,
              letterSpacing: '0.5px',
            }}>
              {systemInfo.icon} {systemInfo.name}
            </span>
            {calculator.version && (
              <span style={{ fontSize: '10px', color: '#585b70' }}>v{calculator.version}</span>
            )}
          </div>
          <h2 style={{ margin: '4px 0 0', color: '#cdd6f4', fontSize: '17px', fontWeight: '700' }}>
            {calculator.name}
          </h2>
          {calculator.shortDescription && (
            <div style={{ fontSize: '12px', color: '#a6adc8', marginTop: '2px' }}>{calculator.shortDescription}</div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', gap: '0', borderBottom: '1px solid #313244',
        background: '#181825', padding: '0 20px', flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', borderBottom: activeTab === tab.id ? `2px solid #89b4fa` : '2px solid transparent',
              color: activeTab === tab.id ? '#89b4fa' : '#585b70',
              padding: '10px 16px', cursor: 'pointer', fontSize: '12px',
              fontWeight: activeTab === tab.id ? '700' : '500',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'calculator' && renderCalculatorTab()}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'evidence' && renderEvidenceTab()}
      </div>
    </div>
  )
}

function checkInterpretationActive(resultVal, rangeStr) {
  if (resultVal === null || resultVal === undefined) return false
  const val = parseFloat(resultVal)
  if (isNaN(val)) {
    return String(resultVal) === String(rangeStr)
  }
  const rangeMatch = rangeStr.match(/^([<>≤≥=]*)(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)$/)
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[2])
    const hi = parseFloat(rangeMatch[3])
    return val >= lo && val <= hi
  }
  const ltMatch = rangeStr.match(/^<\s*(\d+\.?\d*)$/)
  if (ltMatch) return val < parseFloat(ltMatch[1])
  const lteMatch = rangeStr.match(/^[≤<=]+\s*(\d+\.?\d*)$/)
  if (lteMatch) return val <= parseFloat(lteMatch[1])
  const gtMatch = rangeStr.match(/^>\s*(\d+\.?\d*)$/)
  if (gtMatch) return val > parseFloat(gtMatch[1])
  const gteMatch = rangeStr.match(/^[≥>=]+\s*(\d+\.?\d*)$/)
  if (gteMatch) return val >= parseFloat(gteMatch[1])
  const exact = parseFloat(rangeStr)
  if (!isNaN(exact)) return val === exact
  return false
}

export default CalculatorShell
