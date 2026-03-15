import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import SubscriptionGate from './SubscriptionGate';

const Window = ({ win }) => {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition, updateWindowSize, activeWindowId } = useWorkbench();
  const windowRef = useRef(null);
  const dragRef   = useRef(null);
  const resizeRef = useRef(null);

  const isActive = activeWindowId === win.id;

  useEffect(() => {
    const handleResize = () => {
      if (win.minimized || win.maximized) return;
      
      let nx = win.x;
      let ny = win.y;
      let nw = win.width;
      let nh = win.height;
      let updatedSize = false;
      let updatedPos = false;

      const taskbarH = Math.max(38, Math.min(76, window.innerWidth * 0.03));
      const maxW = window.innerWidth;
      const maxH = window.innerHeight - taskbarH;

      if (nw > maxW) { nw = maxW; updatedSize = true; }
      if (nh > maxH) { nh = maxH; updatedSize = true; }

      const minX = -nw + 80;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;

      if (nx < minX) { nx = minX; updatedPos = true; }
      if (nx > maxX) { nx = maxX; updatedPos = true; }
      if (ny < 0) { ny = 0; updatedPos = true; }
      if (ny > maxY) { ny = maxY; updatedPos = true; }

      if (updatedSize) updateWindowSize(win.id, nw, nh);
      if (updatedPos) updateWindowPosition(win.id, nx, ny);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [win, updateWindowSize, updateWindowPosition]);

  const handleTitlebarMouseDown = useCallback((e) => {
    if (win.maximized) return;
    if (e.target.closest('.wb-win-controls')) return;
    e.preventDefault();
    focusWindow(win.id);
    const startX = e.clientX - win.x;
    const startY = e.clientY - win.y;
    
    const onMove = (ev) => {
      let nx = ev.clientX - startX;
      let ny = ev.clientY - startY;

      const minX = -win.width + 80;
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;

      nx = Math.max(minX, Math.min(nx, maxX));
      ny = Math.max(0, Math.min(ny, maxY));

      updateWindowPosition(win.id, nx, ny);
    };
    
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win, focusWindow, updateWindowPosition]);

  const handleResizeMouseDown = useCallback((e) => {
    if (!win.resizable || win.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = win.width;
    const startH = win.height;
    
    const onMove = (ev) => {
      let nw = startW + (ev.clientX - startX);
      let nh = startH + (ev.clientY - startY);

      const maxW = window.innerWidth - win.x;
      const maxH = window.innerHeight - win.y - Math.max(38, Math.min(76, window.innerWidth * 0.03));

      nw = Math.max(300, Math.min(nw, maxW));
      nh = Math.max(200, Math.min(nh, maxH));

      updateWindowSize(win.id, nw, nh);
    };
    
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win, updateWindowSize]);

  const taskbarH = Math.max(38, Math.min(76, window.innerWidth * 0.03));
  const windowStyle = win.maximized
    ? { left: 0, top: 0, width: '100vw', height: `calc(100vh - ${taskbarH}px)`, zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex };

  if (win.minimized) return null;

  return (
    <div
      ref={windowRef}
      className={`wb-window ${isActive ? 'wb-window-active' : 'wb-window-inactive'} ${win.maximized ? 'wb-window-maximized' : ''}`}
      style={windowStyle}
      onMouseDown={() => focusWindow(win.id)}>

      <div className="wb-window-titlebar" onMouseDown={handleTitlebarMouseDown}>
        <div className="wb-win-controls">
          <button className="wb-win-btn wb-win-close" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }} title="Close" />
          <button className="wb-win-btn wb-win-min"   onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }} title="Minimize" />
          <button className="wb-win-btn wb-win-max"   onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }} title="Maximize" />
          <button className="wb-win-btn" style={{ background: '#007aff' }} onClick={(e) => {
            e.stopPropagation();
            const nw = Math.min(win.width, window.innerWidth - 40);
            const nh = Math.min(win.height, window.innerHeight - 88);
            const nx = Math.max(0, (window.innerWidth - nw) / 2);
            const ny = Math.max(0, (window.innerHeight - nh - Math.max(38, Math.min(76, window.innerWidth * 0.03))) / 2);
            updateWindowSize(win.id, nw, nh);
            updateWindowPosition(win.id, nx, ny);
          }} title="Fit & Center" />
        </div>
        <span className="wb-win-title-text">{win.icon && <span className="wb-win-title-icon">{win.icon}</span>}{win.title}</span>
        <div className="wb-win-controls-right">
          <span className="wb-win-id-chip">{win.id.toUpperCase()}</span>
        </div>
      </div>

      <div className="wb-window-content">
        <WindowContent componentName={win.component} props={win.props} winId={win.id} />
      </div>

      {win.resizable && !win.maximized && (
        <div className="wb-resize-handle" onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  );
};

const WindowContent = React.memo(({ componentName, props, winId }) => {
  const [Component, setComponent] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [appInfo, setAppInfo] = useState({ freeAccess: true, title: '' });

  useEffect(() => {
    import(`./apps/_AppRegistry.js`).then(mod => {
      const reg = mod.APP_REGISTRY.find(a => a.component === componentName);
      if (reg && reg.module) {
        setAppInfo({ freeAccess: reg.freeAccess, title: reg.title });
        reg.module().then(m => setComponent(() => m.default)).catch(() => setLoadError(true));
      } else {
        setLoadError(true);
      }
    });
  }, [componentName]);

  if (loadError) return <div className="wb-app-error">Failed to load application: {componentName}</div>;
  if (!Component) return <div className="wb-app-loading"><span className="wb-spinner" /> Loading...</div>;

  if (!appInfo.freeAccess) {
    return (
      <SubscriptionGate appName={appInfo.title}>
        <Component {...props} winId={winId} />
      </SubscriptionGate>
    );
  }

  return <Component {...props} winId={winId} />;
});

export default Window;