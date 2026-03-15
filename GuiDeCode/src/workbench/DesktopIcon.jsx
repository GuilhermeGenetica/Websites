import React, { useState, useRef, useCallback } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';

const GRID_SIZE = 20; // Snap to grid size (ajuste fino)

const DesktopIcon = ({ app, position, selected, locked, onOpen, onSelect, onMove }) => {
  const { setContextMenu, isSubscribed, isAdmin, addNotification } = useWorkbench();
  const [hover, setHover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState(position);
  
  const dragStartRef = useRef(null);
  const clickTimerRef = useRef(null);

  // Sincroniza a posição local caso seja alterada exteriormente (ex: carregamento da página)
  React.useEffect(() => {
    if (!isDragging) setLocalPos(position);
  }, [position, isDragging]);

  const handlePointerDown = useCallback((e) => {
    // Apenas botão principal (rato) ou toque
    if (e.button !== undefined && e.button !== 0) return;
    
    e.stopPropagation(); // Evita ativar a selection box do desktop
    e.target.setPointerCapture(e.pointerId); // Mantém o foco no elemento mesmo que o cursor fuja rapidamente
    
    onSelect(app.id, e.ctrlKey || e.metaKey); // Se premir CTRL seleciona múltiplos

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: localPos.x,
      initialY: localPos.y,
      moved: false
    };

    setIsDragging(true);
  }, [app.id, localPos, onSelect]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Distância mínima para começar a arrastar (evita arrastar num clique normal)
    if (!dragStartRef.current.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    
    dragStartRef.current.moved = true;

    // Calcular nova posição com limites de viewport (evita o ícone desaparecer do ecrã)
    let newX = dragStartRef.current.initialX + dx;
    let newY = dragStartRef.current.initialY + dy;

    // Margens da viewport
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 120; // Taskbar offset
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setLocalPos({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback((e) => {
    if (!isDragging) return;
    e.target.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    if (dragStartRef.current && dragStartRef.current.moved) {
      // Snap to grid para manter o ambiente organizado
      const snappedX = Math.round(localPos.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(localPos.y / GRID_SIZE) * GRID_SIZE;
      onMove(app.id, snappedX, snappedY);
    } else {
      // Foi apenas um clique, lidamos com duplo clique para dispositivos touch/ratos
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        if (locked) {
          addNotification('This application requires a PRO subscription.', 'warning');
        } else {
          onOpen();
        }
      } else {
        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null;
        }, 300); // 300ms threshold for double click
      }
    }
  }, [isDragging, localPos, onMove, app.id, locked, addNotification, onOpen]);

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX, y: e.clientY,
      type: 'icon',
      items: [
        {
          label: locked ? `Open (PRO Required)` : `Open ${app.title}`,
          action: locked ? () => addNotification('This requires a PRO subscription.', 'warning') : () => onOpen(),
          icon: app.icon,
          disabled: locked
        },
        { separator: true },
        { label: 'Properties', action: () => {}, icon: 'ℹ️' }
      ]
    });
  };

  return (
    <div
      className={`wb-desktop-icon ${selected ? 'wb-icon-selected' : ''} ${hover ? 'wb-icon-hover' : ''} ${locked ? 'wb-icon-locked' : ''} ${isDragging ? 'wb-icon-dragging' : ''}`}
      style={{ left: localPos.x, top: localPos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={locked ? `${app.title} — PRO Required` : app.title}>

      <div className="wb-icon-image-wrap">
        <div className="wb-icon-emoji">{app.icon}</div>
        {locked && <div className="wb-icon-lock-overlay">🔒</div>}
      </div>
      <span className="wb-icon-label">{app.title}</span>
    </div>
  );
};

export default DesktopIcon;