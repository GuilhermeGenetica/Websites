import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import Taskbar from './Taskbar';
import WindowManager from './WindowManager';
import DesktopIcon from './DesktopIcon';
import ContextMenu from './ContextMenu';
import UserSidebar from './UserSidebar';
import { StickyNoteWidget } from './apps/StickerNotes';
import { APP_REGISTRY } from './apps/_AppRegistry';

const WALLPAPERS = {
  retro80s:  'repeating-linear-gradient(0deg, #002200 0px, #001100 2px, #003300 4px)',
  early90s:  '#c0c0c0',
  teal95:    '#008080',
  bliss00s:  'linear-gradient(to bottom, #4da1ff 0%, #7ec0ee 45%, #55a630 100%)',
  cosmic00s: 'radial-gradient(at 50% 50%, #4b0082 0%, #000000 100%)',
  aero10s:   'linear-gradient(135deg, #89cff0 0%, #e0f2fe 50%, #f0f8ff 100%)',
  flat15s:   'linear-gradient(135deg, #ff9a7b 0%, #fbd0c5 100%)',
  modern20s: 'radial-gradient(at 0% 0%, #1a1a1a 0%, #000000 100%)',
};

function getGridSize() {
  const vw = window.innerWidth;
  const scale = Math.max(0.82, Math.min(3.5, vw / 1920));
  return { w: Math.round(88 * scale), h: Math.round(100 * scale) };
}

function getTaskbarHeight() {
  // Mirrors CSS clamp(38px, 3vw, 76px)
  return Math.max(38, Math.min(76, window.innerWidth * 0.03));
}

const Desktop = () => {
  const {
    userPrefs, updatePrefs, openWindows, contextMenu, setContextMenu,
    openWindow, stickyNotes, updateNoteState,
    isSubscribed, isAdmin, wbUser, notifications,
    startMenuOpen, setStartMenuOpen, subscriptionType
  } = useWorkbench();

  const desktopRef = useRef(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [selStart, setSelStart]         = useState(null);
  const [selectedIcons, setSelectedIcons] = useState([]);
  const [iconPositions, setIconPositions] = useState({});
  const [focusedNoteId, setFocusedNoteId] = useState(null);
  const [gridSize, setGridSize] = useState(getGridSize);

  // Recompute grid when window is resized
  useEffect(() => {
    const onResize = () => setGridSize(getGridSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const wallpaperStyle = WALLPAPERS[userPrefs.wallpaper] || WALLPAPERS.default;

  const desktopIcons = APP_REGISTRY.filter(app => {
    if (!app.showOnDesktop) return false;
    if (app.adminOnly && !isAdmin) return false;
    return true;
  });

  useEffect(() => {
    const autoArrangedPositions = {};
    const taskbarH = getTaskbarHeight();
    const maxRows = Math.max(1, Math.floor((window.innerHeight - taskbarH - 20) / gridSize.h));

    desktopIcons.forEach((app, index) => {
      const col = Math.floor(index / maxRows);
      const row = index % maxRows;
      autoArrangedPositions[app.id] = { x: 20 + (col * gridSize.w), y: 20 + (row * gridSize.h) };
    });

    setIconPositions(autoArrangedPositions);
    updatePrefs({ iconPositions: autoArrangedPositions });
  }, [desktopIcons.length, gridSize.w, gridSize.h]);

  const handleDesktopMouseDown = useCallback((e) => {
    if (e.target !== desktopRef.current && !e.target.classList.contains('wb-desktop-canvas')) return;
    if (e.button !== 0) return;
    setStartMenuOpen(false);
    setContextMenu(null);
    setSelectedIcons([]);
    const rect = desktopRef.current.getBoundingClientRect();
    setSelStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [setContextMenu, setStartMenuOpen]);

  const handleDesktopMouseMove = useCallback((e) => {
    if (!selStart) return;
    const rect = desktopRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    const x = Math.min(selStart.x, cx);
    const y = Math.min(selStart.y, cy);
    const w = Math.abs(cx - selStart.x);
    const h = Math.abs(cy - selStart.y);
    
    setSelectionBox({ x, y, w, h });

    const newlySelected = [];
    desktopIcons.forEach(app => {
      const pos = iconPositions[app.id];
      if (!pos) return;
      if (
        pos.x < x + w && pos.x + 80 > x &&
        pos.y < y + h && pos.y + 80 > y
      ) {
        newlySelected.push(app.id);
      }
    });
    setSelectedIcons(newlySelected);

  }, [selStart, desktopIcons, iconPositions]);

  const handleDesktopMouseUp = useCallback(() => {
    setSelStart(null);
    setSelectionBox(null);
  }, []);

  const handleDesktopRightClick = useCallback((e) => {
    if (e.target !== desktopRef.current && !e.target.classList.contains('wb-desktop-canvas')) return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX, y: e.clientY,
      type: 'desktop',
      items: [
        { label: 'Show My Sticky Notes', action: () => {
           stickyNotes.forEach(n => updateNoteState(n.id, { is_hidden: 0 }));
        }, icon: '📝' },
        { label: 'Auto-Organizar Ícones', action: () => {
            const newPositions = {};
            const taskbarH = getTaskbarHeight();
            const gs = getGridSize();
            const maxRows = Math.max(1, Math.floor((window.innerHeight - taskbarH - 20) / gs.h));
            desktopIcons.forEach((app, index) => {
              const col = Math.floor(index / maxRows);
              const row = index % maxRows;
              newPositions[app.id] = { x: 20 + (col * gs.w), y: 20 + (row * gs.h) };
            });
            setIconPositions(newPositions);
            updatePrefs({ iconPositions: newPositions });
        }, icon: '🔄' },
        { separator: true },
        { label: 'Settings', action: () => openWindow('settings', 'Settings', 'SettingsApp', {}, { width: 600, height: 480, icon: '⚙️' }), icon: '⚙️' },
      ]
    });
  }, [setContextMenu, stickyNotes, updateNoteState, openWindow, desktopIcons]);

  const handleIconMove = useCallback((id, newX, newY) => {
    const newPositions = { ...iconPositions, [id]: { x: newX, y: newY } };
    setIconPositions(newPositions);
    updatePrefs({ iconPositions: newPositions });
  }, [iconPositions, updatePrefs]);

  return (
    <div
      className={`wb-desktop theme-${userPrefs.theme || 'minimal'} ${userPrefs.animations ? 'wb-animations-enabled' : ''}`}
      style={{ background: wallpaperStyle }}
      ref={desktopRef}
      onMouseDown={handleDesktopMouseDown}
      onMouseMove={handleDesktopMouseMove}
      onMouseUp={handleDesktopMouseUp}
      onMouseLeave={handleDesktopMouseUp}
      onContextMenu={handleDesktopRightClick}
      onClick={() => { setStartMenuOpen(false); }}>

      <div className="wb-desktop-canvas">
        <div className="wb-desktop-icons-area">
          {desktopIcons.map((app) => {
            const planLevels = { free: 0, basic: 1, complete: 2 };
            const userLevel = planLevels[subscriptionType] || 0;
            const appLevel = app.freeAccess ? 0 : (planLevels[app.minPlan] || 2); // Default para 2 (complete) se não definido e não for grátis
            const isAppLocked = !isAdmin && (userLevel < appLevel);

            return (
              <DesktopIcon
                key={app.id}
                app={app}
                position={iconPositions[app.id] || { x: 20, y: 20 }}
                selected={selectedIcons.includes(app.id)}
                locked={isAppLocked}
                onOpen={() => openWindow(app.id, app.title, app.component, {}, { width: app.defaultWidth, height: app.defaultHeight, icon: app.icon })}
                onSelect={(id, multi) => {
                  if (multi) {
                    setSelectedIcons(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                  } else {
                    setSelectedIcons([id]);
                  }
                }}
                onMove={handleIconMove}
              />
            );
          })}
        </div>

        {stickyNotes.map((n, idx) => (
          <StickyNoteWidget
            key={n.id}
            note={n}
            index={idx}
            isFocused={focusedNoteId === String(n.id)}
            onFocus={setFocusedNoteId} />
        ))}

        {selectionBox && (
          <div className="wb-selection-box" style={{
            left: selectionBox.x, top: selectionBox.y,
            width: selectionBox.w, height: selectionBox.h
          }} />
        )}
      </div>

      <WindowManager />
      <UserSidebar />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      <Taskbar />

      <div className="wb-notifications-area">
        {notifications.map(n => (
          <div key={n.id} className={`wb-notification wb-notification-${n.type}`}>{n.msg}</div>
        ))}
      </div>
    </div>
  );
};

export default Desktop;