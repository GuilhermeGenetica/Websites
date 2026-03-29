// File: src/components/Popup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { debounce } from '../lib/utils.js'; // [NEW] Import debounce

const Popup = ({ id, title, children, isVisible, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // [UPDATED] Initial position is now responsive
  const [position, setPosition] = useState(() => {
    const isMobile = window.innerWidth <= 800;
    // On mobile, default to 10px. On desktop, default to 10% (to center the 80% width).
    const initialX = isMobile ? 10 : window.innerWidth * 0.1;
    const initialY = isMobile ? 10 : window.innerHeight * 0.1;
    return { x: initialX, y: initialY };
  });

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef(null);

  const handleMouseDown = (e) => {
    // Só arrasta pelo header, e não pelo botão de fechar
    if (e.target.classList.contains('popup-header') && !e.target.classList.contains('close-btn')) {
      setIsDragging(true);
      const rect = popupRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    // [UPDATED] Add responsive boundaries
    const isMobile = window.innerWidth <= 800;
    const margin = isMobile ? 10 : 0; // 10px margin for mobile, 0 for desktop

    let newLeft = e.clientX - offset.x;
    let newTop = e.clientY - offset.y;

    // Limites (para não arrastar para fora do ecrã)
    const maxLeft = window.innerWidth - popupRef.current.offsetWidth - margin;
    const maxTop = window.innerHeight - popupRef.current.offsetHeight - margin;

    if (newLeft < margin) newLeft = margin; // Respect left margin
    if (newTop < margin) newTop = margin; // Respect top margin
    if (newLeft > maxLeft) newLeft = maxLeft;
    if (newTop > maxTop) newTop = maxTop;

    setPosition({ x: newLeft, y: newTop });
  };

  // Effect for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]); // Dependencies mantidas

  // [NEW EFFECT] - Repositions popup on resize if it goes out of bounds
  useEffect(() => {
    // Function to check and correct position
    const checkPosition = () => {
      if (popupRef.current && isVisible) {
        const rect = popupRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth <= 800;
        
        let newX = rect.left;
        let newY = rect.top;
        
        // Define boundaries (10px for mobile, 0 for desktop drag)
        const margin = isMobile ? 10 : 0;
        const maxLeft = window.innerWidth - rect.width - margin;
        const maxTop = window.innerHeight - rect.height - margin;
        
        let positionChanged = false;
        
        // Check right/bottom bounds
        if (rect.left > maxLeft) {
          newX = maxLeft;
          positionChanged = true;
        }
        if (rect.top > maxTop) {
          newY = maxTop;
          positionChanged = true;
        }
        
        // Check left/top bounds
        if (rect.left < margin) {
          newX = margin;
          positionChanged = true;
        }
        if (rect.top < margin) {
          newY = margin;
          positionChanged = true;
        }
        
        if (positionChanged) {
          setPosition({ x: newX, y: newY });
        }
      }
    };
    
    // Debounce the check for performance
    const debouncedCheckPosition = debounce(checkPosition, 200);
    
    window.addEventListener('resize', debouncedCheckPosition);
    
    // Initial check when popup opens
    checkPosition(); 
    
    return () => {
      window.removeEventListener('resize', debouncedCheckPosition);
    };
  }, [isVisible]); // Re-run if popup becomes visible or dependencies change

  if (!isVisible) {
    return null;
  }

  return (
    <div
      id={id}
      className="popup visible"
      ref={popupRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        className="popup-header"
        onMouseDown={handleMouseDown}
      >
        {title}
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="popup-content">
        {children}
      </div>
    </div>
  );
};

export default Popup;