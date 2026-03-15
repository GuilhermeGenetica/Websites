import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { SYSTEMS, allCalculators, getCalculatorsBySystem, getCalculatorsBySpecialty, searchCalculators } from './medcalc/registry'
import CalculatorShell from './medcalc/CalculatorShell'

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A→Z' },
  { value: 'name_desc', label: 'Name Z→A' },
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'updated_asc', label: 'Oldest Updated' },
  { value: 'system', label: 'By System' },
]

const GROUP_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'system', label: 'By System' },
  { value: 'specialty', label: 'By Specialty' },
]

const FAVORITES_KEY = 'medcalc_favorites'
const RECENTS_KEY = 'medcalc_recents'
const MAX_RECENTS = 15

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

const saveToStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

const MedCalc = () => {
  const [selectedCalc, setSelectedCalc] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [groupBy, setGroupBy] = useState('system')
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [favorites, setFavorites] = useState(() => loadFromStorage(FAVORITES_KEY, []))
  const [recents, setRecents] = useState(() => loadFromStorage(RECENTS_KEY, []))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => { saveToStorage(FAVORITES_KEY, favorites) }, [favorites])
  useEffect(() => { saveToStorage(RECENTS_KEY, recents) }, [recents])

  const toggleFavorite = useCallback((calcId) => {
    setFavorites(prev => {
      if (prev.includes(calcId)) return prev.filter(id => id !== calcId)
      return [...prev, calcId]
    })
  }, [])

  const addToRecents = useCallback((calcId) => {
    setRecents(prev => {
      const filtered = prev.filter(id => id !== calcId)
      return [calcId, ...filtered].slice(0, MAX_RECENTS)
    })
  }, [])

  const handleSelectCalc = useCallback((calc) => {
    setSelectedCalc(calc)
    addToRecents(calc.id)
  }, [addToRecents])

  const handleBack = useCallback(() => {
    setSelectedCalc(null)
  }, [])

  const filteredCalcs = useMemo(() => {
    let calcs = searchQuery ? searchCalculators(searchQuery) : [...allCalculators]
    if (selectedSystem) {
      calcs = calcs.filter(c => c.system === selectedSystem)
    }
    calcs.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc': return b.name.localeCompare(a.name)
        case 'updated_desc': return (b.updatedAt || '').localeCompare(a.updatedAt || '')
        case 'updated_asc': return (a.updatedAt || '').localeCompare(b.updatedAt || '')
        case 'system': return (a.system || '').localeCompare(b.system || '') || a.name.localeCompare(b.name)
        default: return a.name.localeCompare(b.name)
      }
    })
    return calcs
  }, [searchQuery, selectedSystem, sortBy])

  const groupedCalcs = useMemo(() => {
    if (groupBy === 'none' || searchQuery) return { _all: filteredCalcs }
    if (groupBy === 'system') {
      const groups = {}
      filteredCalcs.forEach(c => {
        const key = c.system || 'utilities'
        if (!groups[key]) groups[key] = []
        groups[key].push(c)
      })
      return groups
    }
    if (groupBy === 'specialty') {
      const groups = {}
      filteredCalcs.forEach(c => {
        const specs = c.specialty && c.specialty.length > 0 ? c.specialty : ['Other']
        specs.forEach(s => {
          if (!groups[s]) groups[s] = []
          if (!groups[s].find(x => x.id === c.id)) groups[s].push(c)
        })
      })
      return groups
    }
    return { _all: filteredCalcs }
  }, [filteredCalcs, groupBy, searchQuery])

  const favoriteCalcs = useMemo(() => {
    return favorites.map(id => allCalculators.find(c => c.id === id)).filter(Boolean)
  }, [favorites])

  const recentCalcs = useMemo(() => {
    return recents.map(id => allCalculators.find(c => c.id === id)).filter(Boolean).slice(0, 6)
  }, [recents])

  const systemCounts = useMemo(() => {
    const counts = {}
    allCalculators.forEach(c => {
      const sys = c.system || 'utilities'
      counts[sys] = (counts[sys] || 0) + 1
    })
    return counts
  }, [])

  const renderCalcCard = (calc) => {
    const sys = SYSTEMS[calc.system] || SYSTEMS.utilities
    const isFav = favorites.includes(calc.id)
    return (
      <div
        key={calc.id}
        onClick={() => handleSelectCalc(calc)}
        style={{
          background: '#181825', border: '1px solid #313244', borderRadius: '10px',
          padding: '14px 16px', cursor: 'pointer',
          transition: 'all 0.15s ease', position: 'relative',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = sys.color; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#313244'; e.currentTarget.style.transform = 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{
            padding: '2px 7px', borderRadius: '4px', fontSize: '9px',
            fontWeight: '700', textTransform: 'uppercase',
            background: `${sys.color}18`, color: sys.color,
            letterSpacing: '0.4px',
          }}>
            {sys.icon} {sys.name}
          </span>
          <button
            onClick={e => { e.stopPropagation(); toggleFavorite(calc.id) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isFav ? '#f9e2af' : '#45475a', fontSize: '14px',
              padding: '0', lineHeight: 1,
            }}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFav ? '★' : '☆'}
          </button>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#cdd6f4' }}>{calc.name}</div>
        {calc.shortDescription && (
          <div style={{ fontSize: '11px', color: '#585b70', lineHeight: '1.4' }}>
            {calc.shortDescription}
          </div>
        )}
        <div style={{ display: 'flex', gap: '4px', marginTop: 'auto', flexWrap: 'wrap' }}>
          {calc.tags && calc.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              padding: '1px 6px', borderRadius: '3px', fontSize: '9px',
              background: '#1e1e2e', color: '#585b70', border: '1px solid #313244',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderListItem = (calc) => {
    const sys = SYSTEMS[calc.system] || SYSTEMS.utilities
    const isFav = favorites.includes(calc.id)
    return (
      <div
        key={calc.id}
        onClick={() => handleSelectCalc(calc)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: '#181825', borderBottom: '1px solid #1e1e2e',
          padding: '10px 16px', cursor: 'pointer',
          transition: 'background 0.1s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1e1e2e' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#181825' }}
      >
        <span style={{ color: sys.color, fontSize: '14px', width: '20px', textAlign: 'center' }}>{sys.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#cdd6f4' }}>{calc.name}</div>
          {calc.shortDescription && (
            <div style={{ fontSize: '11px', color: '#585b70', marginTop: '1px' }}>{calc.shortDescription}</div>
          )}
        </div>
        <span style={{ fontSize: '10px', color: '#45475a' }}>{calc.updatedAt}</span>
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(calc.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: isFav ? '#f9e2af' : '#45475a', fontSize: '13px',
            padding: '2px', lineHeight: 1,
          }}
        >
          {isFav ? '★' : '☆'}
        </button>
      </div>
    )
  }

  const renderGroupedContent = () => {
    const entries = Object.entries(groupedCalcs).sort((a, b) => {
      if (a[0] === '_all') return -1
      if (b[0] === '_all') return 1
      const aName = SYSTEMS[a[0]]?.name || a[0]
      const bName = SYSTEMS[b[0]]?.name || b[0]
      return aName.localeCompare(bName)
    })

    return entries.map(([groupKey, calcs]) => (
      <div key={groupKey} style={{ marginBottom: '24px' }}>
        {groupKey !== '_all' && (
          <div style={{
            fontSize: '12px', fontWeight: '700', color: SYSTEMS[groupKey]?.color || '#a6adc8',
            marginBottom: '10px', padding: '0 4px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {SYSTEMS[groupKey]?.icon && <span>{SYSTEMS[groupKey].icon}</span>}
            <span>{SYSTEMS[groupKey]?.name || groupKey}</span>
            <span style={{ color: '#45475a', fontWeight: '400', fontSize: '11px' }}>({calcs.length})</span>
          </div>
        )}
        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '10px',
          }}>
            {calcs.map(renderCalcCard)}
          </div>
        ) : (
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #313244' }}>
            {calcs.map(renderListItem)}
          </div>
        )}
      </div>
    ))
  }

  if (selectedCalc) {
    return (
      <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CalculatorShell calculator={selectedCalc} onBack={handleBack} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px' }}>
      {!sidebarCollapsed && (
        <div style={{
          width: '220px', borderRight: '1px solid #313244', overflow: 'auto',
          background: '#181825', flexShrink: 0, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 12px 8px', borderBottom: '1px solid #313244',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#89b4fa' }}>MedCalc</div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              style={{ background: 'none', border: 'none', color: '#585b70', cursor: 'pointer', fontSize: '14px', padding: '2px' }}
              title="Collapse sidebar"
            >
              ◂
            </button>
          </div>

          <div style={{ padding: '8px 8px 4px' }}>
            <button
              onClick={() => setSelectedSystem(null)}
              style={{
                width: '100%', textAlign: 'left', padding: '7px 10px',
                background: selectedSystem === null ? '#313244' : 'transparent',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                color: '#cdd6f4', fontSize: '12px', fontWeight: selectedSystem === null ? '700' : '400',
              }}
            >
              All Calculators <span style={{ color: '#585b70', float: 'right' }}>{allCalculators.length}</span>
            </button>
          </div>

          {favoriteCalcs.length > 0 && (
            <div style={{ padding: '4px 8px' }}>
              <div style={{
                fontSize: '10px', color: '#f9e2af', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                padding: '4px 10px', marginBottom: '2px',
              }}>
                ★ Favorites
              </div>
              {favoriteCalcs.map(calc => (
                <button
                  key={calc.id}
                  onClick={() => handleSelectCalc(calc)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '5px 10px',
                    background: 'transparent', border: 'none', borderRadius: '4px',
                    cursor: 'pointer', color: '#cdd6f4', fontSize: '11px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#313244' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {calc.name}
                </button>
              ))}
            </div>
          )}

          {recentCalcs.length > 0 && (
            <div style={{ padding: '4px 8px' }}>
              <div style={{
                fontSize: '10px', color: '#585b70', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                padding: '4px 10px', marginBottom: '2px',
              }}>
                Recent
              </div>
              {recentCalcs.map(calc => (
                <button
                  key={calc.id}
                  onClick={() => handleSelectCalc(calc)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '5px 10px',
                    background: 'transparent', border: 'none', borderRadius: '4px',
                    cursor: 'pointer', color: '#a6adc8', fontSize: '11px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#313244' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {calc.name}
                </button>
              ))}
            </div>
          )}

          <div style={{
            padding: '4px 8px', borderTop: '1px solid #313244', marginTop: '4px',
          }}>
            <div style={{
              fontSize: '10px', color: '#585b70', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              padding: '4px 10px', marginBottom: '2px',
            }}>
              Systems
            </div>
            {Object.entries(SYSTEMS).map(([key, sys]) => {
              const count = systemCounts[key] || 0
              if (count === 0) return null
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSystem(prev => prev === key ? null : key)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '6px 10px',
                    background: selectedSystem === key ? `${sys.color}15` : 'transparent',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    color: selectedSystem === key ? sys.color : '#a6adc8',
                    fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px',
                    fontWeight: selectedSystem === key ? '600' : '400',
                    borderLeft: selectedSystem === key ? `2px solid ${sys.color}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (selectedSystem !== key) e.currentTarget.style.background = '#1e1e2e' }}
                  onMouseLeave={e => { if (selectedSystem !== key) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: '14px', textAlign: 'center', fontSize: '11px' }}>{sys.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sys.name}</span>
                  <span style={{ fontSize: '10px', color: '#45475a' }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid #313244',
          display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
          background: '#181825',
        }}>
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              style={{ background: 'none', border: 'none', color: '#585b70', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}
              title="Expand sidebar"
            >
              ▸
            </button>
          )}

          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search calculators..."
              style={{
                width: '100%', padding: '7px 12px 7px 30px',
                background: '#11111b', border: '1px solid #313244', borderRadius: '8px',
                color: '#cdd6f4', fontSize: '12px', boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = '#89b4fa' }}
              onBlur={e => { e.target.style.borderColor = '#313244' }}
            />
            <span style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: '#585b70', fontSize: '13px', pointerEvents: 'none',
            }}>
              ⌕
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#585b70', cursor: 'pointer',
                  fontSize: '14px', padding: '0 2px', lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value)}
              style={{
                background: '#11111b', border: '1px solid #313244', borderRadius: '6px',
                color: '#a6adc8', padding: '6px 8px', fontSize: '11px', cursor: 'pointer',
                outline: 'none',
              }}
            >
              {GROUP_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: '#11111b', border: '1px solid #313244', borderRadius: '6px',
                color: '#a6adc8', padding: '6px 8px', fontSize: '11px', cursor: 'pointer',
                outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', border: '1px solid #313244', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? '#313244' : '#11111b',
                  border: 'none', color: viewMode === 'grid' ? '#cdd6f4' : '#585b70',
                  padding: '5px 8px', cursor: 'pointer', fontSize: '12px',
                }}
                title="Grid view"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? '#313244' : '#11111b',
                  border: 'none', color: viewMode === 'list' ? '#cdd6f4' : '#585b70',
                  padding: '5px 8px', cursor: 'pointer', fontSize: '12px',
                  borderLeft: '1px solid #313244',
                }}
                title="List view"
              >
                ☰
              </button>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#45475a', marginLeft: 'auto' }}>
            {filteredCalcs.length} calculator{filteredCalcs.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {selectedSystem && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px 4px 12px', background: `${(SYSTEMS[selectedSystem]?.color || '#89b4fa')}18`,
              borderRadius: '20px', marginBottom: '14px', fontSize: '11px',
              color: SYSTEMS[selectedSystem]?.color || '#89b4fa',
            }}>
              <span>{SYSTEMS[selectedSystem]?.icon}</span>
              <span>{SYSTEMS[selectedSystem]?.name}</span>
              <button
                onClick={() => setSelectedSystem(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontSize: '14px', padding: '0 2px', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          )}

          {searchQuery && (
            <div style={{ marginBottom: '14px', fontSize: '12px', color: '#585b70' }}>
              {filteredCalcs.length === 0
                ? 'No calculators found.'
                : `Showing ${filteredCalcs.length} result${filteredCalcs.length !== 1 ? 's' : ''} for "${searchQuery}"`
              }
            </div>
          )}

          {renderGroupedContent()}
        </div>
      </div>
    </div>
  )
}

export default MedCalc
