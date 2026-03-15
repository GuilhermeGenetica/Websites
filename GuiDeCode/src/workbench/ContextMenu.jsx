import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, items, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const keyHandler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 200;
  const menuH = items.length * 36 + 16;
  const finalX = x + menuW > vw ? x - menuW : x;
  const finalY = y + menuH > vh ? y - menuH : y;

  return (
    <div
      ref={ref}
      className="wb-context-menu"
      style={{ left: finalX, top: finalY }}
      onContextMenu={e => e.preventDefault()}>
      {items.map((item, i) => {
        if (item.separator) return <div key={i} className="wb-ctx-separator" />;
        return (
          <button
            key={i}
            className={`wb-ctx-item ${item.disabled ? 'wb-ctx-item-disabled' : ''}`}
            onClick={() => { if (!item.disabled) { item.action(); onClose(); } }}
            disabled={item.disabled}>
            {item.icon && <span className="wb-ctx-icon">{item.icon}</span>}
            <span className="wb-ctx-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;