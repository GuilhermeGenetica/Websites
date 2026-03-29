// src/components/landing/Header.jsx
// NEW: Created as a modular component.
// EXPANSION: Added a fully responsive mobile menu (hamburger).
// EXPANSION: Added 'About Us' link to main navigation.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dna, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const Header = ({ onLoginClick, onRegisterClick, onFeaturesClick, onHowItWorksClick, onFaqClick }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (handler) => {
    handler();
    setIsMobileMenuOpen(false);
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 md:space-x-2" onClick={handleMobileLinkClick}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
              <Dna className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">NutraGenius</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={onFeaturesClick} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</button>
            <button onClick={onHowItWorksClick} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</button>
            <button onClick={onFaqClick} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</button>
            <Link to="/about-us" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About Us</Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
          </nav>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={onLoginClick} className="hidden sm:inline-flex">
                  Sign In
                </Button>
                <Button onClick={onRegisterClick} className="gold-bg">
                  Get Started
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu (Dropdown) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-background z-30 shadow-lg border-b">
          <nav className="flex flex-col p-4 space-y-3">
            <button onClick={() => handleMobileNavClick(onFeaturesClick)} className="text-base font-medium text-muted-foreground hover:text-primary transition-colors text-left">Features</button>
            <button onClick={() => handleMobileNavClick(onHowItWorksClick)} className="text-base font-medium text-muted-foreground hover:text-primary transition-colors text-left">How It Works</button>
            <button onClick={() => handleMobileNavClick(onFaqClick)} className="text-base font-medium text-muted-foreground hover:text-primary transition-colors text-left">FAQ</button>
            <Link to="/about-us" onClick={handleMobileLinkClick} className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">About Us</Link>
            <Link to="/contact" onClick={handleMobileLinkClick} className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            
            <div className="border-t pt-4 space-y-3">
              {user ? (
                <Button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} className="w-full">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => handleMobileNavClick(onLoginClick)} className="w-full justify-start">
                    Sign In
                  </Button>
                  <Button onClick={() => handleMobileNavClick(onRegisterClick)} className="w-full gold-bg">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;