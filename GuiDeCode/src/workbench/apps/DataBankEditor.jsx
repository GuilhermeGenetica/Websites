import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { workbenchApi } from '@/services/api'

const S = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: "'Segoe UI', monospace", fontSize: '13px', overflow: 'hidden' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', background: '#181825', borderBottom: '1px solid #313244', flexWrap: 'wrap', minHeight: '36px' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' },
  select: { background: '#11111b', color: '#cdd6f4', border: '1px solid #313244', padding: '3px 6px', borderRadius: '3px', fontSize: '12px', maxWidth: '200px' },
  input: { padding: '3px 8px', background: '#11111b', border: '1px solid #313244', borderRadius: '3px', color: '#cdd6f4', fontSize: '12px' },
  btnPrimary: { background: '#89b4fa', color: '#1e1e2e', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  btnSuccess: { background: '#a6e3a1', color: '#1e1e2e', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  btnDanger: { background: '#f38ba8', color: '#1e1e2e', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  btnWarn: { background: '#f9e2af', color: '#1e1e2e', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  btnGhost: { background: 'transparent', color: '#cdd6f4', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' },
  btnTab: (active) => ({ background: active ? '#313244' : 'transparent', color: '#cdd6f4', border: 'none', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }),
  msgBar: (type) => ({ padding: '3px 8px', fontSize: '11px', textAlign: 'center', background: type === 'error' ? '#f38ba822' : type === 'success' ? '#a6e3a122' : '#89b4fa22', color: type === 'error' ? '#f38ba8' : type === 'success' ? '#a6e3a1' : '#89b4fa' }),
  tableWrap: { flex: 1, overflow: 'auto', position: 'relative' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'auto' },
  th: { padding: '5px 8px', borderBottom: '2px solid #313244', color: '#89b4fa', textAlign: 'left', whiteSpace: 'nowrap', background: '#11111b', position: 'sticky', top: 0, zIndex: 2, cursor: 'default', userSelect: 'none' },
  thResizer: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px', cursor: 'col-resize', background: 'transparent' },
  td: { padding: '2px 4px', borderBottom: '1px solid #1e1e2e22', verticalAlign: 'top' },
  cellInput: (edited) => ({ width: '100%', padding: '2px 4px', background: edited ? '#f9e2af22' : 'transparent', border: edited ? '1px solid #f9e2af44' : '1px solid transparent', borderRadius: '2px', color: '#cdd6f4', fontSize: '12px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }),
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: '#181825', borderTop: '1px solid #313244', fontSize: '11px', color: '#585b70', minHeight: '28px' },
  footerBtn: { background: '#313244', border: 'none', color: '#cdd6f4', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' },
  sqlArea: { flex: '0 0 140px', resize: 'vertical', background: '#11111b', border: '1px solid #313244', borderRadius: '4px', color: '#a6e3a1', fontFamily: 'monospace', fontSize: '13px', padding: '8px', width: '100%', boxSizing: 'border-box' },
  loginWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#1e1e2e', color: '#cdd6f4', padding: '20px' },
  loginBox: { background: '#181825', padding: '24px', borderRadius: '8px', border: '1px solid #313244', width: '340px' },
  loginTitle: { margin: '0 0 16px', color: '#89b4fa', fontSize: '16px', textAlign: 'center' },
  loginLabel: { display: 'block', fontSize: '11px', color: '#a6adc8', marginBottom: '3px', textTransform: 'capitalize' },
  loginInput: { width: '100%', padding: '6px 8px', background: '#11111b', border: '1px solid #313244', borderRadius: '4px', color: '#cdd6f4', fontSize: '13px', boxSizing: 'border-box' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#585b70', fontSize: '14px' },
  contextMenu: { position: 'fixed', background: '#181825', border: '1px solid #313244', borderRadius: '6px', padding: '4px 0', zIndex: 9999, minWidth: '180px', boxShadow: '0 4px 16px #00000066' },
  ctxItem: { padding: '5px 14px', fontSize: '12px', cursor: 'pointer', color: '#cdd6f4', display: 'flex', alignItems: 'center', gap: '8px' },
  ctxItemHover: { background: '#313244' },
  ctxDivider: { height: '1px', background: '#313244', margin: '3px 0' },
  checkboxCol: { width: '30px', textAlign: 'center', padding: '2px' },
  deleteCol: { width: '30px', textAlign: 'center', padding: '2px' },
  newRowBg: '#a6e3a118',
  deletedRowBg: '#f38ba822',
  editedRowBg: '#f9e2af11',
  evenRow: '#1e1e2e',
  oddRow: '#181825',
  selectedRow: '#313244',
}

const ContextMenuItem = ({ label, icon, onClick, danger }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...S.ctxItem, ...(hovered ? S.ctxItemHover : {}), ...(danger ? { color: '#f38ba8' } : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >{icon} {label}</div>
  )
}

const DataBankEditor = () => {
  const [connected, setConnected] = useState(false)
  const [credentials, setCredentials] = useState({ host: 'localhost', user: '', password: '', database: '' })
  const [databases, setDatabases] = useState([])
  const [tables, setTables] = useState([])
  const [selectedDb, setSelectedDb] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [tableData, setTableData] = useState({ rows: [], columns: [], primaryKey: null, total: 0 })
  const [editedRows, setEditedRows] = useState({})
  const [newRows, setNewRows] = useState([])
  const [deletedRows, setDeletedRows] = useState([])
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchDebounce, setSearchDebounce] = useState('')
  const [sqlQuery, setSqlQuery] = useState('')
  const [sqlResult, setSqlResult] = useState(null)
  const [activeTab, setActiveTab] = useState('browser')
  const [contextMenu, setContextMenu] = useState(null)
  const [columnWidths, setColumnWidths] = useState({})
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [terminalLogs, setTerminalLogs] = useState([])
  const [showTerminal, setShowTerminal] = useState(true)
  const [activeCell, setActiveCell] = useState(null)
  const terminalRef = useRef(null)
  const searchTimerRef = useRef(null)
  const tableWrapRef = useRef(null)
  const LIMIT = 50

  const creds = useMemo(() => ({
    host: credentials.host,
    user: credentials.user,
    password: credentials.password,
  }), [credentials.host, credentials.user, credentials.password])

  const log = useCallback((msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString()
    setTerminalLogs(prev => [...prev.slice(-200), { ts, msg, type }])
  }, [])

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [terminalLogs])

  const showMsg = useCallback((text, type) => {
    setMessage({ text, type })
    log(text, type)
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }, [log])

  useEffect(() => {
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearchDebounce(search)
    }, 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  useEffect(() => {
    if (connected && selectedDb && selectedTable) {
      setPage(0)
      loadTableContent(selectedTable, 0, searchDebounce)
    }
  }, [searchDebounce])

  const handleConnect = async () => {
    setLoading(true)
    log('Conectando a ' + credentials.host + '...', 'info')
    try {
      const res = await workbenchApi.dbConnect(credentials)
      if (res.success) {
        setConnected(true)
        showMsg('Conectado com sucesso!', 'success')
        await loadDatabases()
      } else {
        showMsg(res.error || 'Erro ao conectar.', 'error')
      }
    } catch (e) {
      showMsg('Erro de conexao: ' + e.message, 'error')
    }
    setLoading(false)
  }

  const handleDisconnect = () => {
    setConnected(false)
    setDatabases([])
    setTables([])
    setSelectedDb('')
    setSelectedTable('')
    setTableData({ rows: [], columns: [], primaryKey: null, total: 0 })
    resetEdits()
    setSqlResult(null)
    setSearch('')
    setSearchDebounce('')
    setColumnWidths({})
    setSortColumn(null)
    setSelectedRows(new Set())
    showMsg('Desconectado.', 'success')
  }

  const resetEdits = () => {
    setEditedRows({})
    setNewRows([])
    setDeletedRows([])
    setSelectedRows(new Set())
    setActiveCell(null)
  }

  const loadDatabases = async () => {
    log('SHOW DATABASES', 'command')
    try {
      const res = await workbenchApi.dbListDatabases(creds)
      if (res.success) {
        setDatabases(res.databases || [])
        log(res.databases.length + ' databases found.', 'success')
      } else {
        showMsg(res.error, 'error')
      }
    } catch (e) { showMsg(e.message, 'error') }
  }

  const loadTables = async (db) => {
    setSelectedDb(db)
    setSelectedTable('')
    setTableData({ rows: [], columns: [], primaryKey: null, total: 0 })
    resetEdits()
    setSearch('')
    setSearchDebounce('')
    setColumnWidths({})
    setSortColumn(null)
    if (!db) return
    log('SHOW TABLES FROM `' + db + '`', 'command')
    try {
      const res = await workbenchApi.dbListTables({ ...creds, database: db })
      if (res.success) {
        setTables(res.tables || [])
        log(res.tables.length + ' tables found.', 'success')
      } else { showMsg(res.error, 'error') }
    } catch (e) { showMsg(e.message, 'error') }
  }

  const loadTableContent = useCallback(async (table, pageNum, searchTerm) => {
    if (!selectedDb || !table) return
    setLoading(true)
    const offset = (pageNum || 0) * LIMIT
    log('SELECT * FROM `' + table + '` LIMIT ' + LIMIT + ' OFFSET ' + offset + (searchTerm ? ' [search: ' + searchTerm + ']' : ''), 'command')
    try {
      const res = await workbenchApi.dbGetTableContent({
        ...creds,
        database: selectedDb,
        table: table,
        limit: LIMIT,
        offset: offset,
        search: searchTerm || ''
      })
      if (res.success) {
        setTableData({ rows: res.rows || [], columns: res.columns || [], primaryKey: res.primaryKey, total: res.total || 0 })
        resetEdits()
        log(res.total + ' total records. Showing ' + (res.rows || []).length + '.', 'success')
      } else { showMsg(res.error, 'error') }
    } catch (e) { showMsg(e.message, 'error') }
    setLoading(false)
  }, [creds, selectedDb, log, showMsg])

  const handleSelectTable = (table) => {
    setSelectedTable(table)
    setPage(0)
    setSearch('')
    setSearchDebounce('')
    setColumnWidths({})
    setSortColumn(null)
    if (table) loadTableContent(table, 0, '')
  }

  const handleCellEdit = (rowIndex, column, value) => {
    const pk = tableData.primaryKey
    if (!pk) return
    const row = tableData.rows[rowIndex]
    const pkVal = row[pk]
    const key = String(pkVal)
    const origVal = row[column]
    setEditedRows(prev => {
      const existing = prev[key] || {}
      if (String(value) === String(origVal ?? '')) {
        const updated = { ...existing }
        delete updated[column]
        if (Object.keys(updated).length === 0) {
          const newState = { ...prev }
          delete newState[key]
          return newState
        }
        return { ...prev, [key]: updated }
      }
      return { ...prev, [key]: { ...existing, [column]: value } }
    })
  }

  const handleNewRowEdit = (rowIndex, column, value) => {
    setNewRows(prev => {
      const updated = [...prev]
      updated[rowIndex] = { ...updated[rowIndex], [column]: value }
      return updated
    })
  }

const handleAddRow = () => {
    const emptyRow = {}
    tableData.columns.forEach(col => {
      if (col.Extra !== 'auto_increment') {
        if (col.Default !== null && col.Default !== undefined && !String(col.Default).toUpperCase().includes('CURRENT_TIMESTAMP')) {
          emptyRow[col.Field] = col.Default
        }
      }
    })
    setNewRows(prev => [...prev, emptyRow])
    log('New row added to buffer.', 'info')
  }

  const handleDeleteRow = (rowIndex) => {
    const pk = tableData.primaryKey
    if (!pk) return
    const row = tableData.rows[rowIndex]
    const pkVal = row[pk]
    setDeletedRows(prev => {
      if (prev.includes(pkVal)) return prev.filter(v => v !== pkVal)
      return [...prev, pkVal]
    })
  }

  const handleToggleSelectRow = (pkVal) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(pkVal)) next.delete(pkVal)
      else next.add(pkVal)
      return next
    })
  }

  const handleSelectAll = () => {
    const pk = tableData.primaryKey
    if (!pk) return
    if (selectedRows.size === tableData.rows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(tableData.rows.map(r => r[pk])))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return
    if (!confirm('Marcar ' + selectedRows.size + ' registro(s) para exclusao?')) return
    setDeletedRows(prev => {
      const next = [...prev]
      selectedRows.forEach(v => { if (!next.includes(v)) next.push(v) })
      return next
    })
    setSelectedRows(new Set())
  }

  const handleRemoveNewRow = (index) => {
    setNewRows(prev => prev.filter((_, i) => i !== index))
  }

  const hasChanges = Object.keys(editedRows).length > 0 || newRows.length > 0 || deletedRows.length > 0

  const handleSave = async () => {
    const pk = tableData.primaryKey
    if (!pk && (Object.keys(editedRows).length > 0 || deletedRows.length > 0)) {
      showMsg('Sem chave primaria, nao e possivel salvar updates/deletes.', 'error')
      return
    }
    const changes = []
    Object.entries(editedRows).forEach(([pkVal, updatedData]) => {
      changes.push({ type: 'update', primaryKeyColumn: pk, primaryKeyValue: pkVal, updatedData })
    })
    newRows.forEach(row => {
      changes.push({ type: 'insert', data: row })
    })
    deletedRows.forEach(pkVal => {
      changes.push({ type: 'delete', primaryKeyColumn: pk, primaryKeyValue: pkVal })
    })
    if (changes.length === 0) {
      showMsg('Nenhuma alteracao para salvar.', 'info')
      return
    }
    setLoading(true)
    log('Saving ' + changes.length + ' changes...', 'command')
    try {
      const res = await workbenchApi.dbSaveChanges({
        ...creds, database: selectedDb, table: selectedTable, changes
      })
      if (res.success) {
        showMsg('Salvo com sucesso! ' + changes.length + ' operacao(oes).', 'success')
        loadTableContent(selectedTable, page, searchDebounce)
      } else { showMsg(res.error || 'Erro ao salvar.', 'error') }
    } catch (e) { showMsg(e.message, 'error') }
    setLoading(false)
  }

  const handleExecuteSQL = async () => {
    if (!sqlQuery.trim()) return
    setLoading(true)
    log('SQL> ' + sqlQuery, 'command')
    try {
      const res = await workbenchApi.dbExecuteSQL({
        ...creds, database: selectedDb, sql: sqlQuery
      })
      if (res.success) {
        setSqlResult(res)
        showMsg(res.message || 'Executado. ' + (res.rowCount || 0) + ' rows.', 'success')
      } else {
        setSqlResult(null)
        showMsg(res.error || 'Erro na execucao.', 'error')
      }
    } catch (e) { showMsg(e.message, 'error') }
    setLoading(false)
  }

  const handleCreateDb = async () => {
    const name = prompt('Nome do novo banco de dados:')
    if (!name) return
    log('CREATE DATABASE `' + name + '`', 'command')
    try {
      const res = await workbenchApi.dbCreateDatabase({ ...creds, dbName: name })
      if (res.success) { showMsg(res.message, 'success'); loadDatabases() }
      else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleDropDb = async () => {
    if (!selectedDb) return
    if (!confirm('APAGAR banco "' + selectedDb + '"? IRREVERSIVEL!')) return
    log('DROP DATABASE `' + selectedDb + '`', 'command')
    try {
      const res = await workbenchApi.dbDropDatabase({ ...creds, dbName: selectedDb })
      if (res.success) {
        showMsg(res.message, 'success')
        setSelectedDb(''); setTables([]); setSelectedTable('')
        setTableData({ rows: [], columns: [], primaryKey: null, total: 0 })
        resetEdits(); loadDatabases()
      } else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleCreateTable = async () => {
    if (!selectedDb) { showMsg('Selecione um banco primeiro.', 'error'); return }
    const name = prompt('Nome da nova tabela:')
    if (!name) return
    log('CREATE TABLE `' + name + '`', 'command')
    try {
      const res = await workbenchApi.dbCreateTable({ ...creds, database: selectedDb, tableName: name })
      if (res.success) { showMsg(res.message, 'success'); loadTables(selectedDb) }
      else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleDropTable = async () => {
    if (!selectedTable) return
    if (!confirm('APAGAR tabela "' + selectedTable + '"? IRREVERSIVEL!')) return
    log('DROP TABLE `' + selectedTable + '`', 'command')
    try {
      const res = await workbenchApi.dbDropTable({ ...creds, database: selectedDb, table: selectedTable })
      if (res.success) {
        showMsg(res.message, 'success'); setSelectedTable('')
        setTableData({ rows: [], columns: [], primaryKey: null, total: 0 }); resetEdits(); loadTables(selectedDb)
      } else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleRenameTable = async () => {
    if (!selectedTable) return
    const newName = prompt('Novo nome para "' + selectedTable + '":')
    if (!newName || newName === selectedTable) return
    log('RENAME TABLE `' + selectedTable + '` TO `' + newName + '`', 'command')
    try {
      const res = await workbenchApi.dbRenameTable({ ...creds, database: selectedDb, oldTableName: selectedTable, newTableName: newName })
      if (res.success) {
        showMsg(res.message, 'success'); setSelectedTable(newName); loadTables(selectedDb)
      } else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleAddColumn = async () => {
    if (!selectedTable) return
    const colName = prompt('Nome da nova coluna:')
    if (!colName) return
    const colType = prompt('Tipo (ex: VARCHAR(255), INT, TEXT, DECIMAL(10,2)):')
    if (!colType) return
    log('ALTER TABLE `' + selectedTable + '` ADD `' + colName + '` ' + colType, 'command')
    try {
      const res = await workbenchApi.dbAddColumn({ ...creds, database: selectedDb, table: selectedTable, columnName: colName, columnType: colType })
      if (res.success) { showMsg(res.message, 'success'); loadTableContent(selectedTable, page, searchDebounce) }
      else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleDropColumn = async (colName) => {
    if (!selectedTable || !colName) return
    if (!confirm('APAGAR coluna "' + colName + '"? IRREVERSIVEL!')) return
    log('ALTER TABLE `' + selectedTable + '` DROP COLUMN `' + colName + '`', 'command')
    try {
      const res = await workbenchApi.dbDropColumn({ ...creds, database: selectedDb, table: selectedTable, columnName: colName })
      if (res.success) { showMsg(res.message, 'success'); loadTableContent(selectedTable, page, searchDebounce) }
      else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleRenameColumn = async (oldName, colType) => {
    if (!selectedTable || !oldName) return
    const newName = prompt('Novo nome para coluna "' + oldName + '":')
    if (!newName || newName === oldName) return
    const type = prompt('Tipo da coluna (atual: ' + colType + '):', colType)
    if (!type) return
    log('ALTER TABLE `' + selectedTable + '` CHANGE `' + oldName + '` `' + newName + '` ' + type, 'command')
    try {
      const res = await workbenchApi.dbRenameColumn({ ...creds, database: selectedDb, table: selectedTable, oldColumnName: oldName, newColumnName: newName, columnType: type })
      if (res.success) { showMsg(res.message, 'success'); loadTableContent(selectedTable, page, searchDebounce) }
      else showMsg(res.error, 'error')
    } catch (e) { showMsg(e.message, 'error') }
  }

  const handleColumnHeaderContext = (e, col) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'column', col })
  }

  const handleTableContext = (e) => {
    if (e.target.closest('th') || e.target.closest('input') || e.target.closest('button')) return
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'table' })
  }

  const handleColumnResize = (colField, startX, startWidth) => {
    const onMove = (e) => {
      const newW = Math.max(50, startWidth + (e.clientX - startX))
      setColumnWidths(prev => ({ ...prev, [colField]: newW }))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleSort = (colField) => {
    if (sortColumn === colField) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(colField)
      setSortDir('asc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortColumn) return tableData.rows
    const sorted = [...tableData.rows]
    sorted.sort((a, b) => {
      const va = a[sortColumn] ?? ''
      const vb = b[sortColumn] ?? ''
      const na = Number(va)
      const nb = Number(vb)
      if (!isNaN(na) && !isNaN(nb)) return sortDir === 'asc' ? na - nb : nb - na
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    return sorted
  }, [tableData.rows, sortColumn, sortDir])

  const totalPages = Math.max(1, Math.ceil(tableData.total / LIMIT))

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (hasChanges) handleSave()
    }
    if (e.key === 'F5' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault()
      if (selectedTable) loadTableContent(selectedTable, page, searchDebounce)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, selectedTable, page, searchDebounce])

  if (!connected) {
    return (
      <div style={S.loginWrap}>
        <div style={S.loginBox}>
          <h3 style={S.loginTitle}>🗄️ DataBank Editor</h3>
          {['host', 'user', 'password', 'database'].map(field => (
            <div key={field} style={{ marginBottom: '10px' }}>
              <label style={S.loginLabel}>{field}</label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                value={credentials[field]}
                onChange={e => setCredentials(prev => ({ ...prev, [field]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleConnect() }}
                style={S.loginInput}
                placeholder={field === 'host' ? 'localhost' : field === 'database' ? '(opcional, lista todos)' : ''}
              />
            </div>
          ))}
          <button onClick={handleConnect} disabled={loading} style={{ ...S.btnPrimary, width: '100%', padding: '8px', fontSize: '13px', marginTop: '8px' }}>
            {loading ? 'Conectando...' : 'Conectar'}
          </button>
        </div>
        {message.text && <div style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '4px', ...S.msgBar(message.type) }}>{message.text}</div>}
      </div>
    )
  }

  return (
    <div style={S.root}>
      {/* TOOLBAR PRINCIPAL */}
      <div style={S.toolbar}>
        <button onClick={handleDisconnect} style={S.btnDanger} title="Desconectar">⏏ Disconnect</button>
        <select value={selectedDb} onChange={e => loadTables(e.target.value)} style={S.select}>
          <option value="">-- Database --</option>
          {databases.map(db => <option key={db} value={db}>{db}</option>)}
        </select>
        <button onClick={handleCreateDb} style={S.btnSuccess} title="Criar banco">+DB</button>
        {selectedDb && <button onClick={handleDropDb} style={S.btnDanger} title="Apagar banco">Drop DB</button>}
        {selectedDb && (
          <select value={selectedTable} onChange={e => handleSelectTable(e.target.value)} style={S.select}>
            <option value="">-- Table --</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {selectedDb && <button onClick={handleCreateTable} style={S.btnSuccess} title="Criar tabela">+Table</button>}
        {selectedTable && <button onClick={handleDropTable} style={S.btnDanger} title="Apagar tabela">Drop Table</button>}
        {selectedTable && <button onClick={handleRenameTable} style={S.btnWarn} title="Renomear tabela">Rename Table</button>}
        <div style={S.toolbarRight}>
          <button onClick={() => setActiveTab('browser')} style={S.btnTab(activeTab === 'browser')}>Browser</button>
          <button onClick={() => setActiveTab('sql')} style={S.btnTab(activeTab === 'sql')}>SQL</button>
          <button onClick={() => setShowTerminal(p => !p)} style={S.btnTab(showTerminal)}>Log</button>
        </div>
      </div>

      {/* MESSAGE BAR */}
      {message.text && <div style={S.msgBar(message.type)}>{message.text}</div>}

      {/* BROWSER TAB */}
      {activeTab === 'browser' && selectedTable && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* SUB TOOLBAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: '#181825', borderBottom: '1px solid #31324444' }}>
            <input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...S.input, flex: 1, minWidth: '120px' }}
            />
            <button onClick={() => { if (selectedTable) loadTableContent(selectedTable, page, searchDebounce) }} style={S.btnGhost} title="Refresh (F5)">🔄</button>
            <button onClick={handleAddRow} style={S.btnSuccess}>+ Row</button>
            <button onClick={handleAddColumn} style={S.btnSuccess}>+ Col</button>
            {selectedRows.size > 0 && (
              <button onClick={handleDeleteSelected} style={S.btnDanger}>🗑 Del ({selectedRows.size})</button>
            )}
            <button onClick={handleSave} disabled={!hasChanges || loading} style={{ ...S.btnWarn, opacity: hasChanges ? 1 : 0.4 }} title="Ctrl+S">💾 Save</button>
          </div>

          {/* TABLE */}
          <div style={S.tableWrap} ref={tableWrapRef} onContextMenu={handleTableContext}>
            {loading ? (
              <div style={S.empty}>Carregando...</div>
            ) : sortedRows.length === 0 && newRows.length === 0 ? (
              <div style={S.empty}>Tabela vazia ou nenhum resultado para a busca.</div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, ...S.checkboxCol }}>
                      <input type="checkbox" checked={selectedRows.size > 0 && selectedRows.size === tableData.rows.length} onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={{ ...S.th, ...S.deleteCol, color: '#f38ba8' }}>#</th>
                    {tableData.columns.map(col => (
                      <th
                        key={col.Field}
                        style={{ ...S.th, position: 'relative', width: columnWidths[col.Field] ? columnWidths[col.Field] + 'px' : 'auto', minWidth: '60px' }}
                        onClick={() => handleSort(col.Field)}
                        onContextMenu={e => handleColumnHeaderContext(e, col)}
                      >
                        {col.Field} {col.Key === 'PRI' ? '🔑' : ''}{' '}
                        {sortColumn === col.Field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                        <div
                          style={S.thResizer}
                          onMouseDown={e => {
                            e.stopPropagation()
                            e.preventDefault()
                            const thEl = e.target.parentElement
                            handleColumnResize(col.Field, e.clientX, thEl.offsetWidth)
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, ri) => {
                    const pk = tableData.primaryKey
                    const pkVal = pk ? row[pk] : null
                    const pkKey = String(pkVal)
                    const isDeleted = pkVal !== null && deletedRows.includes(pkVal)
                    const isEdited = pkKey in editedRows
                    const isSelected = pkVal !== null && selectedRows.has(pkVal)
                    let bgColor = ri % 2 === 0 ? S.evenRow : S.oddRow
                    if (isSelected) bgColor = S.selectedRow
                    if (isEdited) bgColor = S.editedRowBg
                    if (isDeleted) bgColor = S.deletedRowBg
                    return (
                      <tr key={pkKey + '-' + ri} style={{ background: bgColor, opacity: isDeleted ? 0.35 : 1 }}>
                        <td style={S.checkboxCol}>
                          <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelectRow(pkVal)} style={{ cursor: 'pointer' }} disabled={isDeleted} />
                        </td>
                        <td style={S.deleteCol}>
                          <button onClick={() => handleDeleteRow(ri)} style={{ background: 'none', border: 'none', color: isDeleted ? '#a6e3a1' : '#f38ba8', cursor: 'pointer', fontSize: '13px', padding: 0 }} title={isDeleted ? 'Desfazer exclusao' : 'Marcar para exclusao'}>
                            {isDeleted ? '↩' : '✕'}
                          </button>
                        </td>
                        {tableData.columns.map(col => {
                          const edited = pkKey in editedRows && editedRows[pkKey][col.Field] !== undefined
                          const val = edited ? editedRows[pkKey][col.Field] : (row[col.Field] ?? '')
                          const isAuto = col.Extra === 'auto_increment'
                          const isFocused = activeCell && activeCell.row === ri && activeCell.col === col.Field
                          return (
                            <td key={col.Field} style={{ ...S.td, width: columnWidths[col.Field] ? columnWidths[col.Field] + 'px' : 'auto' }}>
                              {isAuto ? (
                                <span style={{ color: '#585b70', fontSize: '12px', padding: '2px 4px' }}>{val}</span>
                              ) : (
                                <input
                                  value={String(val)}
                                  onChange={e => handleCellEdit(ri, col.Field, e.target.value)}
                                  onFocus={() => setActiveCell({ row: ri, col: col.Field })}
                                  onBlur={() => setActiveCell(null)}
                                  disabled={isDeleted}
                                  style={{
                                    ...S.cellInput(edited),
                                    ...(isFocused ? { borderColor: '#89b4fa', boxShadow: '0 0 0 1px #89b4fa44' } : {})
                                  }}
                                />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {/* NEW ROWS */}
                  {newRows.map((row, ri) => (
                    <tr key={'new-' + ri} style={{ background: S.newRowBg }}>
                      <td style={S.checkboxCol} />
                      <td style={S.deleteCol}>
                        <button onClick={() => handleRemoveNewRow(ri)} style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: '13px', padding: 0 }} title="Remover novo registro">✕</button>
                      </td>
                      {tableData.columns.map(col => {
                        const isAuto = col.Extra === 'auto_increment'
                        return (
                          <td key={col.Field} style={S.td}>
                            {isAuto ? (
                              <span style={{ color: '#585b70', fontSize: '11px', padding: '2px 4px', fontStyle: 'italic' }}>auto</span>
                            ) : (
                              <input
                                value={row[col.Field] ?? ''}
                                onChange={e => handleNewRowEdit(ri, col.Field, e.target.value)}
                                placeholder={col.Default || ''}
                                style={{ ...S.cellInput(true), background: '#a6e3a111', borderColor: '#a6e3a133' }}
                              />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* FOOTER / PAGINATION */}
          <div style={S.footer}>
            <span>{tableData.total} registros{hasChanges ? ' | ⚠ alteracoes nao salvas' : ''}</span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button onClick={() => { setPage(0); loadTableContent(selectedTable, 0, searchDebounce) }} disabled={page === 0} style={S.footerBtn}>⏮</button>
              <button onClick={() => { const p = Math.max(0, page - 1); setPage(p); loadTableContent(selectedTable, p, searchDebounce) }} disabled={page === 0} style={S.footerBtn}>◀ Prev</button>
              <span style={{ padding: '0 8px', color: '#cdd6f4', fontSize: '11px' }}>Pg {page + 1} / {totalPages}</span>
              <button onClick={() => { const p = Math.min(totalPages - 1, page + 1); setPage(p); loadTableContent(selectedTable, p, searchDebounce) }} disabled={page >= totalPages - 1} style={S.footerBtn}>Next ▶</button>
              <button onClick={() => { const p = totalPages - 1; setPage(p); loadTableContent(selectedTable, p, searchDebounce) }} disabled={page >= totalPages - 1} style={S.footerBtn}>⏭</button>
            </div>
          </div>
        </div>
      )}

      {/* SQL TAB */}
      {activeTab === 'sql' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', overflow: 'hidden' }}>
          <textarea
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleExecuteSQL() } }}
            placeholder={"SELECT * FROM table_name LIMIT 100;\n\n(Ctrl+Enter para executar)"}
            style={S.sqlArea}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleExecuteSQL} disabled={loading} style={S.btnPrimary}>
              {loading ? 'Executando...' : '▶ Execute SQL'}
            </button>
            {sqlResult && sqlResult.rows && <span style={{ color: '#585b70', fontSize: '11px' }}>{sqlResult.rowCount} rows returned</span>}
          </div>
          {sqlResult && sqlResult.rows && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {sqlResult.rows.length > 0 && Object.keys(sqlResult.rows[0]).map(key => (
                      <th key={key} style={S.th}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sqlResult.rows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? S.evenRow : S.oddRow }}>
                      {Object.values(row).map((val, ci) => (
                        <td key={ci} style={{ ...S.td, padding: '3px 6px', color: val === null ? '#585b70' : '#cdd6f4' }}>
                          {val === null ? 'NULL' : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sqlResult && !sqlResult.rows && sqlResult.message && (
            <div style={{ padding: '8px', background: '#a6e3a122', borderRadius: '4px', color: '#a6e3a1', fontSize: '12px' }}>{sqlResult.message}</div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {activeTab === 'browser' && !selectedTable && (
        <div style={S.empty}>
          {selectedDb ? 'Selecione uma tabela para visualizar.' : 'Selecione um banco de dados para comecar.'}
        </div>
      )}

      {/* TERMINAL / LOG */}
      {showTerminal && (
        <div style={{ height: '140px', background: '#0d1117', borderTop: '1px solid #313244', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 8px', background: '#161b22', fontSize: '11px', color: '#8b949e' }}>
            <span>Terminal Log</span>
            <button onClick={() => setTerminalLogs([])} style={{ ...S.btnGhost, fontSize: '10px', padding: '1px 6px', color: '#8b949e' }}>Clear</button>
          </div>
          <div ref={terminalRef} style={{ flex: 1, overflow: 'auto', padding: '4px 8px', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6' }}>
            {terminalLogs.map((l, i) => (
              <div key={i} style={{
                color: l.type === 'error' ? '#f38ba8' : l.type === 'success' ? '#a6e3a1' : l.type === 'command' ? '#f9e2af' : '#8b949e'
              }}>
                <span style={{ color: '#585b70' }}>[{l.ts}]</span> {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div style={{ ...S.contextMenu, left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          {contextMenu.type === 'column' && contextMenu.col && (
            <>
              <ContextMenuItem icon="✏️" label={'Renomear "' + contextMenu.col.Field + '"'} onClick={() => { handleRenameColumn(contextMenu.col.Field, contextMenu.col.Type); setContextMenu(null) }} />
              <ContextMenuItem icon="➕" label="Adicionar coluna" onClick={() => { handleAddColumn(); setContextMenu(null) }} />
              <div style={S.ctxDivider} />
              <ContextMenuItem icon="🗑" label={'Apagar "' + contextMenu.col.Field + '"'} danger onClick={() => { handleDropColumn(contextMenu.col.Field); setContextMenu(null) }} />
            </>
          )}
          {contextMenu.type === 'table' && (
            <>
              <ContextMenuItem icon="➕" label="Adicionar registro" onClick={() => { handleAddRow(); setContextMenu(null) }} />
              <ContextMenuItem icon="➕" label="Adicionar coluna" onClick={() => { handleAddColumn(); setContextMenu(null) }} />
              <div style={S.ctxDivider} />
              <ContextMenuItem icon="💾" label="Salvar alteracoes" onClick={() => { handleSave(); setContextMenu(null) }} />
              <ContextMenuItem icon="🔄" label="Recarregar" onClick={() => { loadTableContent(selectedTable, page, searchDebounce); setContextMenu(null) }} />
              <div style={S.ctxDivider} />
              <ContextMenuItem icon="✏️" label="Renomear tabela" onClick={() => { handleRenameTable(); setContextMenu(null) }} />
              <ContextMenuItem icon="🗑" label="Apagar tabela" danger onClick={() => { handleDropTable(); setContextMenu(null) }} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default DataBankEditor