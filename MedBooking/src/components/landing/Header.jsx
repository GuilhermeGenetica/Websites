import React, { useState, useEffect } from 'react';
import { Stethoscope, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * The main header for the landing page.
 * @param {object} props - The component props.
 * @param {Function} props.onLoginClick - Function to trigger the authentication modal.
 */
const Header = ({ onLoginClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Effect to handle scroll detection for styling the header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#search', label: 'Find a Doctor' },
    { href: '#why-us', label: 'Why Choose Us' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#for-doctors', label: 'For Doctors' },
  ];

  const menuVariants = {
    closed: { opacity: 0, y: -20 },
    open: { opacity: 1, y: 0 },
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-lg border-b' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo and App Name */}
          <a href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-md">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">MedBooking</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons and Theme Toggle */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={onLoginClick}>
              Login
            </Button>
            <Button onClick={onLoginClick} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-t"
          >
            <nav className="flex flex-col items-center space-y-4 p-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t w-full flex flex-col space-y-2">
                <Button variant="ghost" onClick={() => { onLoginClick(); setIsMenuOpen(false); }} className="w-full">
                  Login
                </Button>
                <Button onClick={() => { onLoginClick(); setIsMenuOpen(false); }} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Sign Up
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
