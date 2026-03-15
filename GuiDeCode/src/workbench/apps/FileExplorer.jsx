import React, { useState, useEffect, useCallback, useRef } from 'react'

/* ── API pública ── */
const FE_API = '/api/filexplorer.php'

async function feGet(action, params = '') {
  const url = `${FE_API}?action=${action}${params ? '&' + params : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/* ── Ícones KDE Breeze ── */
const B = 'https://cdn.jsdelivr.net/gh/KDE/breeze-icons@master/icons/mimetypes/64/'
const P = 'https://cdn.jsdelivr.net/gh/KDE/breeze-icons@master/icons/places/64/'

const ICONS = {
  folder: `${P}folder.svg`,
  pdf:`${B}application-pdf.svg`, doc:`${B}application-msword.svg`, docx:`${B}application-msword.svg`,
  xls:`${B}application-vnd.ms-excel.svg`, xlsx:`${B}application-vnd.ms-excel.svg`,
  ppt:`${B}application-vnd.ms-powerpoint.svg`, pptx:`${B}application-vnd.ms-powerpoint.svg`,
  jpg:`${B}image-x-generic.svg`, jpeg:`${B}image-x-generic.svg`, png:`${B}image-x-generic.svg`,
  gif:`${B}image-x-generic.svg`, svg:`${B}image-x-generic.svg`, webp:`${B}image-x-generic.svg`,
  mp3:`${B}audio-x-generic.svg`, wav:`${B}audio-x-generic.svg`,
  mp4:`${B}video-x-generic.svg`, avi:`${B}video-x-generic.svg`,
  zip:`${B}application-zip.svg`, rar:`${B}application-x-rar.svg`,
  txt:`${B}text-plain.svg`, html:`${B}text-html.svg`, css:`${B}text-css.svg`,
  js:`${B}application-javascript.svg`, php:`${B}application-x-php.svg`,
  py:`${B}application-x-python.svg`, json:`${B}application-json.svg`,
  sql:`${B}application-sql.svg`, csv:`${B}text-csv.svg`, md:`${B}text-markdown.svg`,
  default:`${B}application-x-zerosize.svg`
}

const icon = (item) => item.isDir ? ICONS.folder : (ICONS[item.extension] || ICONS.default)
const fmtSize = (b) => {
  if (!b) return '--'
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB'
  return (b / 1073741824).toFixed(2) + ' GB'
}

/* ── Hook mobile ── */
const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return m
}

/* ══════════════════════════════════════════════════════════════
   CollapseBtn — Com botão opcional de FullWindow
   ══════════════════════════════════════════════════════════════ */
const CollapseBtn = ({ collapsed, onToggle, direction = 'horizontal', side = 'left', label, showFullWindow, isFullWindow, onFullWindowToggle }) => {
  const isH = direction === 'horizontal'

  let arrow
  if (isH) {
    if (side === 'left') { arrow = collapsed ? '▶' : '◀' }
    else { arrow = collapsed ? '◀' : '▶' }
  } else {
    if (side === 'left') { arrow = collapsed ? '▼' : '▲' }
    else { arrow = collapsed ? '▲' : '▼' }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#313244', userSelect: 'none',
      color: '#f9e2af', fontSize: '12px', fontWeight: 'bold',
      ...(isH
        ? { width: '20px', minWidth: '20px', flexShrink: 0, flexDirection: 'column', gap: '8px' }
        : { height: '24px', minHeight: '24px', flexShrink: 0, width: '100%', flexDirection: 'row', gap: '12px' }
      )
    }}>
      {/* Botão collapse/expand */}
      <div onClick={onToggle}
        title={collapsed ? `Expandir ${label}` : `Colapsar ${label}`}
        style={{ cursor: 'pointer', padding: isH ? '8px 0' : '0 8px', display: 'flex', alignItems: 'center', flexDirection: isH ? 'column' : 'row', gap: '4px' }}>
        {arrow}
        <span style={{ 
          fontSize: '10px', 
          opacity: 0.7,
          ...(isH ? { writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' } : {})
        }}>
          {collapsed ? label : ''}
        </span>
      </div>

      {/* Botão fullwindow (só no preview) */}
      {showFullWindow && (
        <div onClick={onFullWindowToggle}
          title={isFullWindow ? 'Sair de janela cheia' : 'Expandir para janela cheia'}
          style={{
            cursor: 'pointer', padding: isH ? '6px 0' : '0 6px',
            color: isFullWindow ? '#a6e3a1' : '#89b4fa',
            fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s'
          }}>
          {isFullWindow ? '⊡' : '⬜'}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════ */
const FileExplorer = () => {
  const isMobile = useIsMobile()

  const [currentPath, setCurrentPath]   = useState('')
  const [items, setItems]               = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [viewMode, setViewMode]         = useState('list')
  const [selectedItem, setSelectedItem] = useState(null)
  const [pathHistory, setPathHistory]   = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [sortConfig, setSortConfig]     = useState({ key: 'name', direction: 'asc' })

  const [loadedPaths, setLoadedPaths]     = useState({})
  const [expandedPaths, setExpandedPaths] = useState({ '': true })
  const [loadingPaths, setLoadingPaths]   = useState({})
  const [previewData, setPreviewData]     = useState(null)

  // Painéis colapsáveis
  const [treeCollapsed, setTreeCollapsed]       = useState(false)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)

  // FullWindow do preview
  const [previewFullWindow, setPreviewFullWindow] = useState(false)

  // Larguras desktop (redimensionáveis)
  const [leftWidth, setLeftWidth]   = useState(220)
  const [rightWidth, setRightWidth] = useState(300)
  const containerRef = useRef(null)

  /* ── Sair de FullWindow ao restaurar painéis ── */
  const exitFullWindow = useCallback(() => {
    setPreviewFullWindow(false)
    setTreeCollapsed(false)
    setPreviewCollapsed(false)
  }, [])

  const toggleFullWindow = useCallback(() => {
    setPreviewFullWindow(prev => !prev)
  }, [])

  /* ────────────────────────────────────
     Carregar Diretório
     ──────────────────────────────────── */
  const loadDirectory = useCallback(async (path, addToHistory = true) => {
    setLoading(true); setError(''); setSelectedItem(null)
    try {
      const res = await feGet('listFiles', 'path=' + encodeURIComponent(path || ''))
      if (res.success) {
        setItems(res.items)
        setCurrentPath(res.currentPath || '')
        setLoadedPaths(prev => ({ ...prev, [res.currentPath || '']: res.items }))
        if (addToHistory) {
          const h = [...pathHistory.slice(0, historyIndex + 1), res.currentPath || '']
          setPathHistory(h); setHistoryIndex(h.length - 1)
        }
      } else { setError(res.error || 'Erro ao listar.') }
    } catch (e) { setError(e.message); setItems([]) }
    setLoading(false)
  }, [pathHistory, historyIndex])

  useEffect(() => { loadDirectory('', true) }, [])

  const fetchTree = useCallback(async (path) => {
    setLoadingPaths(prev => ({ ...prev, [path]: true }))
    try {
      const res = await feGet('listFiles', 'path=' + encodeURIComponent(path || ''))
      if (res.success) setLoadedPaths(prev => ({ ...prev, [path]: res.items }))
    } catch (e) { console.error(e) }
    setLoadingPaths(prev => ({ ...prev, [path]: false }))
  }, [])

  /* ────────────────────────────────────
     Navegação
     ──────────────────────────────────── */
  const navigateTo = (p) => { setPreviewData(null); loadDirectory(p, true) }
  const goBack    = () => { if (historyIndex > 0) { const i = historyIndex - 1; setHistoryIndex(i); loadDirectory(pathHistory[i], false) } }
  const goForward = () => { if (historyIndex < pathHistory.length - 1) { const i = historyIndex + 1; setHistoryIndex(i); loadDirectory(pathHistory[i], false) } }
  const goUp      = () => { if (!currentPath) return; const p = currentPath.split('/'); p.pop(); navigateTo(p.join('/')) }

  const toggleFolder = (path, e) => {
    e.stopPropagation()
    setExpandedPaths(prev => {
      const open = !prev[path]
      if (open && !loadedPaths[path]) fetchTree(path)
      return { ...prev, [path]: open }
    })
  }

  /* ────────────────────────────────────
     Seleção / Preview
     ──────────────────────────────────── */
  const handleClick = (item) => { setSelectedItem(item); if (!item.isDir) handlePreview(item) }
  const handleDblClick = (item) => {
    if (item.isDir) { navigateTo(item.path); setExpandedPaths(prev => ({ ...prev, [item.path]: true })) }
  }

  const handlePreview = async (item) => {
    setPreviewCollapsed(false)
    const ext = item.extension
    const directExts = ['pdf', 'html', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'mp3', 'wav', 'mp4', 'avi']
    const officeExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
    const enc = item.path.split('/').map(encodeURIComponent).join('/')
    const pub = `https://guilherme.onnetweb.com/filexplorer/${enc}`
    const rel = `/filexplorer/${enc}`

    if (directExts.includes(ext)) {
      setPreviewData({ type: 'iframe', url: rel, item })
    } else if (officeExts.includes(ext)) {
      setPreviewData({ type: 'iframe', url: `https://docs.google.com/gview?url=${pub}&embedded=true`, item })
    } else {
      try {
        const res = await feGet('previewFile', 'path=' + encodeURIComponent(item.path))
        if (res.success && res.type === 'text') setPreviewData({ type: 'text', content: res.content, item })
        else if (res.success && res.type === 'image') setPreviewData({ type: 'image', content: res.content, item })
        else setPreviewData({ type: 'unsupported', item })
      } catch { setPreviewData({ type: 'unsupported', item }) }
    }
  }

  const handleDownload = (item) => {
    const a = document.createElement('a')
    a.href = `${FE_API}?action=downloadFile&path=${encodeURIComponent(item.path)}`
    a.download = item.name; a.click()
  }

  /* Fechar preview também sai de fullwindow */
  const closePreview = () => {
    setPreviewData(null)
    setPreviewFullWindow(false)
  }

  /* ────────────────────────────────────
     Ordenação
     ──────────────────────────────────── */
  const requestSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))
  }

  const sortedItems = [...items].sort((a, b) => {
    if (a.isDir && !b.isDir) return -1
    if (!a.isDir && b.isDir) return 1
    let aV = a[sortConfig.key], bV = b[sortConfig.key]
    if (sortConfig.key === 'name' || sortConfig.key === 'extension') {
      aV = (aV || '').toString().toLowerCase(); bV = (bV || '').toString().toLowerCase()
    }
    if (aV < bV) return sortConfig.direction === 'asc' ? -1 : 1
    if (aV > bV) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  /* ────────────────────────────────────
     Resize Desktop (drag)
     ──────────────────────────────────── */
  const handleLeftResize = useCallback((e) => {
    e.preventDefault()
    const onMove = (me) => {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      const w = me.clientX - r.left
      if (w > 150 && w < r.width / 2) setLeftWidth(w)
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [])

  const handleRightResize = useCallback((e) => {
    e.preventDefault()
    const onMove = (me) => {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      const w = r.right - me.clientX
      if (w > 200 && w < r.width / 2) setRightWidth(w)
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }, [])

  /* ────────────────────────────────────
     Árvore de Pastas (recursiva)
     ──────────────────────────────────── */
  const renderTree = (path, depth = 0) => {
    const dir = loadedPaths[path]
    if (!dir) return null
    return dir.map(item => {
      const isExp = expandedPaths[item.path]
      const isLd  = loadingPaths[item.path]
      const isSel = selectedItem?.path === item.path || currentPath === item.path
      return (
        <div key={item.path}>
          <div onClick={() => item.isDir ? navigateTo(item.path) : handleClick(item)}
            onDoubleClick={() => handleDblClick(item)}
            style={{
              display: 'flex', alignItems: 'center', padding: `4px 4px 4px ${8 + depth * 14}px`,
              cursor: 'pointer', background: isSel ? '#313244' : 'transparent',
              color: item.isDir ? '#89b4fa' : '#cdd6f4', userSelect: 'none', whiteSpace: 'nowrap'
            }}>
            {item.isDir ? (
              <span onClick={e => toggleFolder(item.path, e)}
                style={{ display: 'inline-block', width: '16px', textAlign: 'center', marginRight: '4px', cursor: 'pointer', color: '#585b70' }}>
                {isLd ? '⌛' : (isExp ? '▼' : '▶')}
              </span>
            ) : <span style={{ display: 'inline-block', width: '16px', marginRight: '4px' }} />}
            <img src={icon(item)} alt="" style={{ width: '16px', height: '16px', marginRight: '6px' }}
              onError={e => { e.target.src = ICONS.default }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px' }}>{item.name}</span>
          </div>
          {item.isDir && isExp && <div>{renderTree(item.path, depth + 1)}</div>}
        </div>
      )
    })
  }

  const breadcrumbs = currentPath ? currentPath.split('/') : []
  const sortArrow = (k) => sortConfig.key === k ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''

  /* ────────────────────────────────────
     Sub-Componentes
     ──────────────────────────────────── */

  const TreeContent = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#181825', borderBottom: '1px solid #313244', fontWeight: 'bold', color: '#a6adc8' }}>
        <span>Pastas</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0', WebkitOverflowScrolling: 'touch' }}>
        <div onClick={() => navigateTo('')}
          style={{
            display: 'flex', alignItems: 'center', padding: '4px 8px', cursor: 'pointer',
            background: currentPath === '' ? '#313244' : 'transparent',
            color: '#f9e2af', fontWeight: 'bold', userSelect: 'none'
          }}>
          <span style={{ display: 'inline-block', width: '16px', textAlign: 'center', marginRight: '4px' }}>▼</span>
          <img src={ICONS.folder} alt="" style={{ width: '16px', height: '16px', marginRight: '6px' }} />
          Raiz
        </div>
        {renderTree('')}
      </div>
    </>
  )

  const NavBar = () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', background: '#181825',
      borderBottom: '1px solid #313244', flexWrap: isMobile ? 'wrap' : 'nowrap', minHeight: '36px'
    }}>
      <button onClick={goBack} disabled={historyIndex <= 0}
        style={{ background: 'none', border: 'none', color: historyIndex <= 0 ? '#585b70' : '#89b4fa', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>◀</button>
      <button onClick={goForward} disabled={historyIndex >= pathHistory.length - 1}
        style={{ background: 'none', border: 'none', color: historyIndex >= pathHistory.length - 1 ? '#585b70' : '#89b4fa', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>▶</button>
      <button onClick={goUp} disabled={!currentPath}
        style={{ background: 'none', border: 'none', color: !currentPath ? '#585b70' : '#89b4fa', cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>▲</button>
      <button onClick={() => loadDirectory(currentPath)}
        style={{ background: 'none', border: 'none', color: '#a6e3a1', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}>↻</button>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', background: '#11111b', borderRadius: '4px',
        padding: '4px 8px', overflowX: 'auto', whiteSpace: 'nowrap', minWidth: 0
      }}>
        <span style={{ color: '#585b70', marginRight: '6px', flexShrink: 0 }}>/filexplorer/</span>
        {breadcrumbs.map((c, i) => {
          const p = breadcrumbs.slice(0, i + 1).join('/')
          return (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: '#585b70', margin: '0 4px' }}>/</span>}
              <span onClick={() => navigateTo(p)} style={{ color: '#f9e2af', cursor: 'pointer' }}>{c}</span>
            </React.Fragment>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        <button onClick={() => setViewMode('list')}
          style={{ background: viewMode === 'list' ? '#313244' : 'none', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: '3px', fontSize: '12px' }}>Lista</button>
        <button onClick={() => setViewMode('grid')}
          style={{ background: viewMode === 'grid' ? '#313244' : 'none', border: 'none', color: '#cdd6f4', cursor: 'pointer', padding: '4px 8px', borderRadius: '3px', fontSize: '12px' }}>Grelha</button>
      </div>
    </div>
  )

  const FileList = () => (
    <div style={{ flex: 1, overflow: 'auto', padding: '4px', background: '#1e1e2e', WebkitOverflowScrolling: 'touch' }}>
      {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#585b70' }}>A carregar...</div>}
      {error && <div style={{ textAlign: 'center', padding: '20px', color: '#f38ba8' }}>{error}</div>}

      {!loading && !error && viewMode === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244', color: '#a6adc8', fontSize: '11px', textAlign: 'left', userSelect: 'none' }}>
              <th onClick={() => requestSort('name')} style={{ padding: '6px 8px', cursor: 'pointer', width: isMobile ? '70%' : '50%' }}>
                Nome {sortArrow('name')}
              </th>
              {!isMobile && <th onClick={() => requestSort('extension')} style={{ padding: '6px 8px', cursor: 'pointer', width: '15%' }}>Tipo {sortArrow('extension')}</th>}
              {!isMobile && <th onClick={() => requestSort('size')} style={{ padding: '6px 8px', cursor: 'pointer', width: '15%' }}>Tamanho {sortArrow('size')}</th>}
              <th onClick={() => requestSort('modified')} style={{ padding: '6px 8px', cursor: 'pointer', width: isMobile ? '30%' : '20%' }}>
                {isMobile ? 'Data' : 'Modificado'} {sortArrow('modified')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, i) => (
              <tr key={i} onClick={() => handleClick(item)} onDoubleClick={() => handleDblClick(item)}
                style={{ cursor: 'pointer', background: selectedItem?.path === item.path ? '#313244' : 'transparent', borderBottom: '1px solid #181825' }}>
                <td style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <img src={icon(item)} alt="" style={{ width: '20px', height: '20px', flexShrink: 0 }} onError={e => { e.target.src = ICONS.default }} />
                  <span style={{ color: item.isDir ? '#89b4fa' : '#cdd6f4', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                </td>
                {!isMobile && <td style={{ padding: '6px 8px', color: '#a6adc8', fontSize: '11px' }}>{item.isDir ? 'Pasta' : (item.extension.toUpperCase() || 'Ficheiro')}</td>}
                {!isMobile && <td style={{ padding: '6px 8px', color: '#a6adc8', fontSize: '11px' }}>{fmtSize(item.size)}</td>}
                <td style={{ padding: '6px 8px', color: '#a6adc8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isMobile ? (item.modified || '').slice(0, 10) : item.modified}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(80px,1fr))' : 'repeat(auto-fill, minmax(100px,1fr))', gap: '12px', padding: '12px' }}>
          {sortedItems.map((item, i) => (
            <div key={i} onClick={() => handleClick(item)} onDoubleClick={() => handleDblClick(item)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 6px', borderRadius: '6px', cursor: 'pointer',
                background: selectedItem?.path === item.path ? '#313244' : 'transparent', textAlign: 'center'
              }}>
              <img src={icon(item)} alt="" style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', marginBottom: '8px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                onError={e => { e.target.src = ICONS.default }} />
              <span style={{ fontSize: '11px', wordBreak: 'break-word', color: item.isDir ? '#89b4fa' : '#cdd6f4', lineHeight: '1.3', maxHeight: '3.9em', overflow: 'hidden' }}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const StatusBar = () => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#181825',
      borderTop: '1px solid #313244', fontSize: '11px', color: '#585b70', flexWrap: 'wrap', gap: '4px'
    }}>
      <span>{items.length} itens {selectedItem && ` | ${selectedItem.name} (${fmtSize(selectedItem.size)})`}</span>
      {selectedItem && !selectedItem.isDir && (
        <button onClick={() => handleDownload(selectedItem)}
          style={{ background: '#313244', border: '1px solid #45475a', color: '#89b4fa', cursor: 'pointer', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
          Download
        </button>
      )}
    </div>
  )

  const PreviewContent = () => {
    if (!previewData) return null
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#181825', borderBottom: '1px solid #313244' }}>
          <span style={{ color: '#f9e2af', fontWeight: 'bold', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {previewData.item?.name || 'Pré-visualização'}
          </span>
          <button onClick={closePreview}
            style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: '18px', lineHeight: 1, marginLeft: '8px' }}>&times;</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '16px', WebkitOverflowScrolling: 'touch' }}>
          {previewData.type === 'iframe' && (
            <iframe src={previewData.url}
              style={{ width: '100%', height: '100%', minHeight: '300px', border: 'none', background: '#fff', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              title="Preview" />
          )}
          {previewData.type === 'text' && (
            <pre style={{ width: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#a6e3a1', margin: 0, fontSize: '11px', lineHeight: '1.4' }}>
              {previewData.content}
            </pre>
          )}
          {previewData.type === 'image' && (
            <img src={previewData.content} alt=""
              style={{ maxWidth: '100%', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
          )}
          {previewData.type === 'unsupported' && (
            <div style={{ color: '#585b70', marginTop: '20vh', textAlign: 'center', padding: '0 20px' }}>
              <img src={icon(previewData.item)} alt="" style={{ width: '64px', height: '64px', marginBottom: '16px', opacity: 0.5 }} />
              <p>Pré-visualização indisponível para .{previewData.item.extension}</p>
            </div>
          )}
        </div>
      </>
    )
  }

  /* ═══════════════════════════════════════
     LAYOUT MOBILE (vertical empilhado)
     ═══════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace', fontSize: '13px', overflow: 'hidden' }}>

        {/* ── Árvore (topo) — oculta em fullwindow, mas botão sempre visível ── */}
        <CollapseBtn
          collapsed={treeCollapsed || previewFullWindow}
          onToggle={() => { if (previewFullWindow) { exitFullWindow() } else { setTreeCollapsed(v => !v) } }}
          direction="vertical" side="left" label="Pastas" />
        {!treeCollapsed && !previewFullWindow && (
          <div style={{ maxHeight: '35vh', overflow: 'auto', background: '#11111b', borderBottom: '1px solid #313244', WebkitOverflowScrolling: 'touch' }}>
            <TreeContent />
          </div>
        )}

        {/* ── Navegação + Lista (centro) — oculta em fullwindow ── */}
        {!previewFullWindow && (
          <>
            <NavBar />
            <FileList />
            <StatusBar />
          </>
        )}

        {/* ── Pré-visualização (fundo) ── */}
        {previewData && (
          <>
            <CollapseBtn
              collapsed={previewCollapsed}
              onToggle={() => { if (previewFullWindow) { exitFullWindow() } else { setPreviewCollapsed(v => !v) } }}
              direction="vertical" side="right" label="Preview"
              showFullWindow={true}
              isFullWindow={previewFullWindow}
              onFullWindowToggle={toggleFullWindow} />
            {!previewCollapsed && (
              <div style={{
                display: 'flex', flexDirection: 'column', background: '#11111b',
                borderTop: '1px solid #313244', overflow: 'hidden',
                ...(previewFullWindow ? { flex: 1 } : { height: '50vh' })
              }}>
                <PreviewContent />
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  /* ═══════════════════════════════════════
     LAYOUT DESKTOP (horizontal lado a lado)
     ═══════════════════════════════════════ */
  return (
    <div ref={containerRef} style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'monospace', fontSize: '13px' }}>

      {/* ── Árvore (esquerda) — oculta em fullwindow, mas botão sempre visível ── */}
      {!treeCollapsed && !previewFullWindow && (
        <div style={{ width: leftWidth, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', background: '#11111b' }}>
          <TreeContent />
        </div>
      )}
      <CollapseBtn
        collapsed={treeCollapsed || previewFullWindow}
        onToggle={() => { if (previewFullWindow) { exitFullWindow() } else { setTreeCollapsed(v => !v) } }}
        direction="horizontal" side="left" label="Pastas" />

      {/* Resizer esquerdo (só quando árvore visível e não fullwindow) */}
      {!treeCollapsed && !previewFullWindow && (
        <div onMouseDown={handleLeftResize} style={{ width: '4px', background: '#313244', cursor: 'col-resize', zIndex: 10 }} />
      )}

      {/* ── Painel Central (ficheiros) — oculto em fullwindow ── */}
      {!previewFullWindow && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <NavBar />
          <FileList />
          <StatusBar />
        </div>
      )}

      {/* ── Pré-visualização (direita) ── */}
      {previewData && (
        <>
          {/* Resizer direito (só quando não colapsado e não fullwindow) */}
          {!previewCollapsed && !previewFullWindow && (
            <div onMouseDown={handleRightResize} style={{ width: '4px', background: '#313244', cursor: 'col-resize', zIndex: 10 }} />
          )}
          <CollapseBtn
            collapsed={previewCollapsed}
            onToggle={() => { if (previewFullWindow) { exitFullWindow() } else { setPreviewCollapsed(v => !v) } }}
            direction="horizontal" side="right" label="Preview"
            showFullWindow={true}
            isFullWindow={previewFullWindow}
            onFullWindowToggle={toggleFullWindow} />
          {!previewCollapsed && (
            <div style={{
              display: 'flex', flexDirection: 'column', background: '#11111b', flexShrink: 0, overflow: 'hidden',
              ...(previewFullWindow ? { flex: 1 } : { width: rightWidth })
            }}>
              <PreviewContent />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FileExplorer