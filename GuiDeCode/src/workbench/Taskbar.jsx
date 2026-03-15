import React, { useState, useEffect } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import StartMenu from './StartMenu';

const Taskbar = () => {
  const {
    openWindows, activeWindowId, focusWindow, minimizeWindow,
    startMenuOpen, setStartMenuOpen
  } = useWorkbench();

  const [clock, setClock] = useState('');
  const [date, setDate]   = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const visibleWindows = openWindows.filter(w => !w.hidden);

  return (
    <>
      {startMenuOpen && <StartMenu onClose={() => setStartMenuOpen(false)} />}
      <div className="wb-taskbar">
        <button
          className={`wb-start-btn ${startMenuOpen ? 'wb-start-active' : ''}`}
          onClick={(e) => { 
            e.stopPropagation(); 
            setStartMenuOpen(v => !v); 
          }}>
          <span className="wb-start-icon">⊞</span>
          <span className="wb-start-label">Iniciar</span>
        </button>

        <div className="wb-taskbar-divider" />

        <div className="wb-taskbar-windows">
          {visibleWindows.map(win => (
            <button
              key={win.id}
              className={`wb-taskbar-btn ${activeWindowId === win.id && !win.minimized ? 'wb-taskbar-btn-active' : ''} ${win.minimized ? 'wb-taskbar-btn-minimized' : ''}`}
              onClick={() => {
                if (win.minimized) {
                  minimizeWindow(win.id);
                  focusWindow(win.id);
                } else if (activeWindowId === win.id) {
                  minimizeWindow(win.id);
                } else {
                  focusWindow(win.id);
                }
              }}>
              <span className="wb-taskbar-btn-icon">{win.icon || '🖥️'}</span>
              <span className="wb-taskbar-btn-title">{win.title}</span>
            </button>
          ))}
        </div>

        <div className="wb-taskbar-spacer" />

        <div className="wb-taskbar-tray">
          <div className="wb-tray-clock">
            <span className="wb-clock-time">{clock}</span>
            <span className="wb-clock-date">{date}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Taskbar;