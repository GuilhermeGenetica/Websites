// File: src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
// Não precisamos mais do 'react-router-dom-hash-link'

const Navbar = ({ onToggleTheme, theme }) => {
  const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isNavbarHidden, setNavbarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const lastMouseY = useRef(0);
  const navbarRef = useRef(null);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    if (currentScrollY > lastScrollY.current && currentScrollY > windowHeight * 0.2) {
      if (!isMobileMenuVisible) {
        setNavbarHidden(true);
      }
    } else if (currentScrollY < lastScrollY.current || currentScrollY <= windowHeight) {
      setNavbarHidden(false);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleMouseMove = (event) => {
    if (event.clientY <= 100 && event.clientY < lastMouseY.current) {
      setNavbarHidden(false);
    }
    lastMouseY.current = event.clientY;
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobileMenuVisible]); 

  // Revertido: Adicionamos a função de clique de volta
  // (Esta é a função original do seu 'scripts.js')
  const handleLinkClick = (e) => {
    const targetId = e.currentTarget.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      e.preventDefault(); 
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setMobileMenuVisible(false); // Fecha o menu mobile ao clicar
  };

  const navbarClass = `navbar ${isNavbarHidden ? 'hidden' : ''} ${isMobileMenuVisible ? 'visible' : ''}`;

  return (
    <div className={navbarClass} id="navbar" ref={navbarRef}>
      <button 
        id="menuToggle" 
        className="menu-toggle" 
        onClick={() => setMobileMenuVisible(!isMobileMenuVisible)}
      >
        ≡
      </button>
      
      {/* Revertido para tags <a> normais com o handleLinkClick */}
      <a href="#home" onClick={handleLinkClick}>
        HoldingComp Group
      </a>
      <a href="#sustainability" onClick={handleLinkClick}>
        Sustainability
      </a>
      <a href="#welcome" onClick={handleLinkClick}>
        Welcome
      </a>
      <a href="#investors" onClick={handleLinkClick}>
        Investor Relations
      </a>
      <a href="#pressroom" onClick={handleLinkClick}>
        Press Room
      </a>
      <a href="#about" onClick={handleLinkClick}>
        About
      </a>
      
      <button onClick={onToggleTheme} className="theme-toggle-navbar" title="Toggle theme">
        {theme === 'light' ? '☀️' : '🌙'}
      </button>
    </div>
  );
};

export default Navbar;