import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { adminGetUsers, adminGetUserNotes } from '@/services/workbenchService';

const CHAR_LIMIT = 1000;
const NOTE_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#fce7f3', '#d1fae5'];

const darkenColor = (hex, amount = 0.35) => {
  if (!hex || hex.length < 7) return '#888';
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToRgba = (hex, alpha = 0.92) => {
  if (!hex || hex.length < 7) return 'rgba(254,240,138,0.92)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const FOCUSED_Z = 200;
const BASE_Z = 50;

const StickyNoteWidget = ({ note, index = 0, isFocused, onFocus }) => {
  const { updateNoteState, user } = useWorkbench();
  const [dragging, setDragging] = useState(false);
  const noteRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [localContent, setLocalContent] = useState(note.content || '');
  useEffect(() => { setLocalContent(note.content || ''); }, [note.content]);

  useEffect(() => {
    if (note.x === 0 && note.y === 0) {
      const isMobile = window.innerWidth < 640;
      const w = isMobile ? Math.floor(window.innerWidth * 0.45) : 300;
      const h = isMobile ? Math.floor(window.innerHeight * 0.25) : 300;
      const rightMargin = isMobile ? 10 : 20;
      const cascadeOffsetX = isMobile ? 15 : 30;
      const cascadeOffsetY = isMobile ? 28 : 36;
      const x = window.innerWidth - w - rightMargin - (index * cascadeOffsetX);
      const y = 20 + (index * cascadeOffsetY);
      updateNoteState(note.id, { x, y, width: w, height: h });
    }
  }, []);

  const bringToFront = useCallback(() => {
    if (onFocus) onFocus(note.id);
  }, [note.id, onFocus]);

  const handlePointerDownHeader = useCallback((e) => {
    if (e.target.closest('.wb-sticky-btn')) return;
    e.preventDefault();
    bringToFront();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: cx - note.x, y: cy - note.y };
    setDragging(true);

    const onMove = (ev) => {
      ev.preventDefault();
      const mx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const my = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const newX = Math.max(0, Math.min(mx - dragOffset.current.x, window.innerWidth - 60));
      const newY = Math.max(0, Math.min(my - dragOffset.current.y, window.innerHeight - 34));
      updateNoteState(note.id, { x: newX, y: newY });
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }, [note.id, note.x, note.y, updateNoteState, bringToFront]);

  const handleNoteClick = useCallback(() => {
    bringToFront();
  }, [bringToFront]);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    resizeStart.current = { x: cx, y: cy, w: note.width, h: note.height };

    const onMove = (ev) => {
      ev.preventDefault();
      const mx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const my = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const newW = Math.max(200, resizeStart.current.w + (mx - resizeStart.current.x));
      const newH = Math.max(120, resizeStart.current.h + (my - resizeStart.current.y));
      updateNoteState(note.id, { width: newW, height: newH });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }, [note.id, note.width, note.height, updateNoteState, bringToFront]);

  const handleContentChange = (e) => {
    if (e.target.value.length <= CHAR_LIMIT) {
      setLocalContent(e.target.value);
    }
  };

  const saveContent = () => {
    if (localContent !== (note.content || '')) {
      updateNoteState(note.id, { content: localContent });
    }
  };

  const currentUserId = user?.id;
  const isAuthor = String(note.author_id) === String(currentUserId);
  const isReceived = !isAuthor;
  const authorLabel = isReceived ? `📩 De: ${note.author_name || 'Admin'}` : '📝 Nota';

  if (note.is_hidden) return null;

  const isCollapsed = !!note.is_collapsed;
  const noteColor = note.color || '#fef08a';
  const headerBg = isReceived
    ? 'linear-gradient(135deg, #1e3a8a, #3b82f6)'
    : `linear-gradient(135deg, ${darkenColor(noteColor, 0.45)}, ${darkenColor(noteColor, 0.25)})`;

  const zIndex = dragging ? 9999 : (isFocused ? FOCUSED_Z : BASE_Z + index);

  return (
    <div
      ref={noteRef}
      className={`wb-sticky-note ${dragging ? 'wb-sticky-dragging' : ''} ${isCollapsed ? 'wb-sticky-collapsed' : ''} ${isFocused ? 'wb-sticky-focused' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: isCollapsed ? 34 : note.height,
        zIndex,
      }}
      onMouseDown={handleNoteClick}
      onTouchStart={handleNoteClick}>

      <div
        className="wb-sticky-header"
        style={{ background: headerBg }}
        onMouseDown={handlePointerDownHeader}
        onTouchStart={handlePointerDownHeader}>
        <div className="wb-sticky-title">
          <span>{authorLabel}</span>
        </div>
        <div className="wb-sticky-controls">
          <button
            className="wb-sticky-btn"
            onClick={() => updateNoteState(note.id, { is_collapsed: isCollapsed ? 0 : 1 })}
            title={isCollapsed ? 'Expandir' : 'Colapsar'}>
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button
            className="wb-sticky-btn"
            onClick={() => updateNoteState(note.id, { is_hidden: 1 })}
            title="Ocultar">
            ✕
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="wb-sticky-content" style={{ background: hexToRgba(noteColor, 0.94) }}>
          <textarea
            className="wb-sticky-textarea"
            value={localContent}
            onChange={handleContentChange}
            onBlur={saveContent}
            onFocus={bringToFront}
            readOnly={isReceived}
            disabled={isReceived}
            maxLength={CHAR_LIMIT}
            placeholder={isReceived ? 'Mensagem do administrador.' : 'Escreva aqui...'} />
          <div className="wb-sticky-footer">
            <span className="wb-sticky-charcount">{localContent.length}/{CHAR_LIMIT}</span>
          </div>
          <div
            className="wb-sticky-resize"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}>
            ⟋
          </div>
        </div>
      )}
    </div>
  );
};

export { StickyNoteWidget };


const StickerNotes = ({ winId }) => {
  const { stickyNotes, updateNoteState, createNote, deleteNote, isAdmin, user, addNotification, fetchNotes } = useWorkbench();
  const [tab, setTab] = useState('manager');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#fef08a');
  const [targetType, setTargetType] = useState('self');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const [panelUserId, setPanelUserId] = useState('');
  const [panelNotes, setPanelNotes] = useState([]);
  const [loadingPanel, setLoadingPanel] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setLoadingUsers(true);
      adminGetUsers().then(res => {
        setUsers(res);
        setLoadingUsers(false);
      });
    }
  }, [isAdmin]);

  const handleCreate = async () => {
    if (!newContent.trim()) {
      addNotification('Escreva algo na nota antes de criar.', 'warning');
      return;
    }
    setCreating(true);
    const data = {
      content: newContent,
      color: newColor,
      target_type: targetType,
      target_user_ids: selectedUserIds.map(Number),
    };
    const res = await createNote(data);
    setCreating(false);
    if (res.success) {
      addNotification(`Nota criada! (${res.created_count} cópia${res.created_count > 1 ? 's' : ''})`, 'success');
      setNewContent('');
      setSelectedUserIds([]);
      setTab('manager');
    } else {
      addNotification(res.error || 'Erro ao criar nota.', 'error');
    }
  };

  const handleDelete = async (noteId) => {
    await deleteNote(noteId);
    addNotification('Nota removida.', 'info');
  };

  const toggleUserSelection = (uid) => {
    setSelectedUserIds(prev =>
      prev.includes(uid) ? prev.filter(i => i !== uid) : [...prev, uid]
    );
  };

  const loadPanelNotes = async (userId) => {
    setPanelUserId(userId);
    if (!userId) { setPanelNotes([]); return; }
    setLoadingPanel(true);
    const notes = await adminGetUserNotes(userId);
    setPanelNotes(notes);
    setLoadingPanel(false);
  };

  const resetNotePosition = (noteId) => {
    const isMobile = window.innerWidth < 640;
    const w = isMobile ? Math.floor(window.innerWidth * 0.45) : 300;
    const h = isMobile ? Math.floor(window.innerHeight * 0.25) : 300;
    const rightMargin = isMobile ? 10 : 20;
    const x = window.innerWidth - w - rightMargin;
    const y = 20;
    updateNoteState(noteId, { x, y, width: w, height: h, is_collapsed: 0, is_hidden: 0 });
  };

  const currentUserId = user?.id;

  const tabsConfig = isAdmin
    ? [
        { id: 'manager', label: '🖥️ Meu Desktop' },
        { id: 'create',  label: '➕ Nova Nota' },
        { id: 'panel',   label: '👁️ Ler Notas' },
      ]
    : [
        { id: 'manager', label: '🖥️ Minhas Notas' },
        { id: 'create',  label: '➕ Nova Nota' },
      ];

  return (
    <div className="wb-sn-app">
      <div className="wb-sn-sidebar">
        {tabsConfig.map(t => (
          <button
            key={t.id}
            className={`wb-settings-tab ${tab === t.id ? 'wb-settings-tab-active' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="wb-sn-content">

{tab === 'manager' && (
          <div className="wb-settings-section">
            <h4 className="wb-settings-heading">
              {isAdmin ? 'Notas no Meu Desktop' : 'As Minhas Notas'}
            </h4>
            <p className="wb-sn-hint">
              Gerencie a visibilidade das notas no seu ambiente de trabalho. Notas recebidas do administrador aparecem aqui automaticamente.
            </p>

            <div className="wb-sn-manager-toolbar">
              <button className="wb-btn-primary wb-sn-btn-create" onClick={() => setTab('create')}>
                ➕ Criar Nova Nota
              </button>
              <button
                className="wb-btn-primary wb-sn-btn-sm"
                onClick={() => {
                  stickyNotes.forEach(n => updateNoteState(n.id, { is_hidden: 0 }));
                  addNotification('Todas as notas visíveis!', 'info');
                }}>
                👁️ Mostrar Todas
              </button>
              <button
                className="wb-btn-primary wb-sn-btn-sm"
                onClick={() => {
                  const isMobile = window.innerWidth < 640;
                  const w = isMobile ? Math.floor(window.innerWidth * 0.45) : 300;
                  const h = isMobile ? Math.floor(window.innerHeight * 0.25) : 300;
                  const rightMargin = isMobile ? 10 : 20;
                  const cascadeX = isMobile ? 15 : 30;
                  const cascadeY = isMobile ? 28 : 36;
                  stickyNotes.forEach((n, idx) => {
                    const x = window.innerWidth - w - rightMargin - (idx * cascadeX);
                    const y = 20 + (idx * cascadeY);
                    updateNoteState(n.id, { x, y, width: w, height: h, is_collapsed: 0, is_hidden: 0 });
                  });
                  addNotification('Notas reorganizadas em cascata!', 'info');
                }}>
                🗂️ Cascata
              </button>
              <button
                className="wb-btn-primary wb-sn-btn-sm"
                onClick={() => {
                  stickyNotes.forEach(n => updateNoteState(n.id, { is_hidden: 1 }));
                  addNotification('Todas as notas ocultadas.', 'info');
                }}>
                🙈 Ocultar Todas
              </button>
              <button
                className="wb-btn-primary wb-sn-btn-sm"
                onClick={() => fetchNotes()}>
                🔄 Atualizar
              </button>
              
            </div>

            {stickyNotes.length === 0 && (
              <div className="wb-sn-empty">
                <p>Nenhuma nota adesiva ainda.</p>
                <button className="wb-btn-primary" onClick={() => setTab('create')}>Criar a primeira nota</button>
              </div>
            )}

            {stickyNotes.map(n => {
              const isOwn = String(n.author_id) === String(currentUserId);
              return (
                <div key={n.id} className="wb-sn-manager-item">
                  <div className="wb-sn-manager-info">
                    <div className="wb-sn-manager-title-row">
                      <span
                        className="wb-sn-color-badge"
                        style={{ background: n.color || '#fef08a' }} />
                      <strong>{isOwn ? '📝 Minha Nota' : `📩 De: ${n.author_name || 'Admin'}`}</strong>
                    </div>
                    <div className="wb-sn-manager-preview">
                      {(n.content || '').substring(0, 80) || '(vazia)'}
                      {(n.content || '').length > 80 ? '…' : ''}
                    </div>
                    <span className="wb-sn-manager-meta">
                      {n.is_hidden ? '⚫ Oculta' : '🟢 Visível'}
                      {n.is_collapsed ? ' · Colapsada' : ''}
                      {' · '}{n.width}×{n.height}px
                      {' · '}{(n.content || '').length} chars
                    </span>
                  </div>
                  <div className="wb-sn-manager-actions">
                    <button
                      className="wb-btn-primary wb-sn-btn-sm"
                      onClick={() => updateNoteState(n.id, { is_hidden: n.is_hidden ? 0 : 1 })}>
                      {n.is_hidden ? 'Mostrar' : 'Ocultar'}
                    </button>
                    <button
                      className="wb-btn-primary wb-sn-btn-sm wb-sn-btn-reset"
                      onClick={() => resetNotePosition(n.id)}
                      title="Reposicionar no canto superior direito">
                      ↗
                    </button>
                    <button
                      className="wb-btn-primary wb-sn-btn-sm wb-sn-btn-delete"
                      onClick={() => handleDelete(n.id)}
                      title="Apagar nota permanentemente">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'create' && (
          <div className="wb-settings-section">
            <h4 className="wb-settings-heading">➕ Criar Nova Nota Adesiva</h4>

            <label className="wb-sn-label">Conteúdo</label>
            <textarea
              className="wb-input wb-sn-create-textarea"
              rows={6}
              value={newContent}
              onChange={e => { if (e.target.value.length <= CHAR_LIMIT) setNewContent(e.target.value); }}
              placeholder="Escreva o conteúdo da nota..."
              maxLength={CHAR_LIMIT} />
            <div className="wb-sn-charcount-inline">{newContent.length}/{CHAR_LIMIT}</div>

            <label className="wb-sn-label">Cor da Nota</label>
            <div className="wb-sn-color-picker">
              {NOTE_COLORS.map(c => (
                <button
                  key={c}
                  className={`wb-sn-color-option ${newColor === c ? 'wb-sn-color-selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)} />
              ))}
            </div>

            {isAdmin && (
              <>
                <label className="wb-sn-label">Destinatário</label>
                <div className="wb-sn-target-options">
                  <label className="wb-sn-radio">
                    <input type="radio" name="target" value="self" checked={targetType === 'self'} onChange={() => setTargetType('self')} />
                    <span>Apenas para mim</span>
                  </label>
                  <label className="wb-sn-radio">
                    <input type="radio" name="target" value="all" checked={targetType === 'all'} onChange={() => setTargetType('all')} />
                    <span>Para mim e todos os utilizadores</span>
                  </label>
                  <label className="wb-sn-radio">
                    <input type="radio" name="target" value="users" checked={targetType === 'users'} onChange={() => setTargetType('users')} />
                    <span>Para mim e utilizadores selecionados</span>
                  </label>
                </div>

                {targetType === 'users' && (
                  <div className="wb-sn-user-select">
                    {loadingUsers ? (
                      <p className="wb-sn-hint">A carregar utilizadores...</p>
                    ) : users.length === 0 ? (
                      <p className="wb-sn-hint">Nenhum utilizador encontrado no sistema.</p>
                    ) : (
                      users.filter(u => String(u.id) !== String(currentUserId)).map(u => (
                        <label key={u.id} className="wb-sn-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUserSelection(u.id)} />
                          <span>{u.full_name} <small>({u.email})</small></span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            <div className="wb-sn-create-bar">
              <button
                className="wb-btn-primary"
                onClick={handleCreate}
                disabled={creating || !newContent.trim()}>
                {creating ? 'A criar...' : 'Criar Nota'}
              </button>
            </div>
          </div>
        )}

        {tab === 'panel' && isAdmin && (
          <div className="wb-settings-section">
            <h4 className="wb-settings-heading">👁️ Painel de Leitura — Notas dos Utilizadores</h4>
            <p className="wb-sn-hint">
              Selecione um utilizador para ler as notas pessoais que ele criou.
            </p>
            <select
              className="wb-input"
              value={panelUserId}
              onChange={e => loadPanelNotes(e.target.value)}>
              <option value="">-- Selecione o Utilizador --</option>
              {users.filter(u => String(u.id) !== String(currentUserId)).map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>

            {loadingPanel && <p className="wb-sn-hint">A carregar...</p>}

            {!loadingPanel && panelUserId && panelNotes.length === 0 && (
              <p className="wb-sn-hint" style={{ marginTop: '14px' }}>Este utilizador ainda não criou notas pessoais.</p>
            )}

            {!loadingPanel && panelNotes.map(n => (
              <div key={n.id} className="wb-sn-panel-note" style={{ borderLeftColor: n.color || '#fef08a' }}>
                <div className="wb-sn-panel-note-header">
                  <span className="wb-sn-color-badge" style={{ background: n.color || '#fef08a' }} />
                  <span className="wb-sn-panel-date">
                    {new Date(n.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="wb-sn-panel-note-content">
                  {n.content || '(nota vazia)'}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default StickerNotes;