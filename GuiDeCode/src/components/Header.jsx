import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Sun, Moon, LogOut, LayoutDashboard, Menu, X, Monitor } from 'lucide-react'

const Header = () => {
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold font-display hover:text-primary transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>
          GuiDeLines
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/" className={`text-sm transition-colors ${isActive('/') ? 'text-[hsl(var(--luxury-gold))]' : 'text-muted-foreground hover:text-foreground'}`}>
            Home
          </Link>
          <Link to="/blog" className={`text-sm transition-colors ${isActive('/blog') || location.pathname.startsWith('/article') ? 'text-[hsl(var(--luxury-gold))]' : 'text-muted-foreground hover:text-foreground'}`}>
            Blog
          </Link>
          <Link to="/contact" className={`text-sm transition-colors ${isActive('/contact') ? 'text-[hsl(var(--luxury-gold))]' : 'text-muted-foreground hover:text-foreground'}`}>
            Contact
          </Link>

          {isAuthenticated && (
            <>
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <LayoutDashboard size={14} /> Admin
              </Link>
              <button onClick={() => { logout(); navigate('/blog'); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <LogOut size={14} /> Logout
              </button>
            </>
          )}

          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/workbench/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[hsl(var(--luxury-gold))] text-black font-semibold rounded text-sm hover:opacity-90 transition-all"
          >
            <Monitor size={14} /> WorkBench
          </Link>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="container mx-auto px-6 py-4 flex flex-col space-y-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Home</Link>
            <Link to="/blog" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Blog</Link>
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors">Contact</Link>
            {isAuthenticated && (
              <>
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="hover:text-[hsl(var(--luxury-gold))] transition-colors flex items-center gap-1">
                  <LayoutDashboard size={14} /> Admin
                </Link>
                <button onClick={() => { logout(); navigate('/blog'); setMobileOpen(false); }} className="hover:text-[hsl(var(--luxury-gold))] transition-colors flex items-center gap-1 text-left">
                  <LogOut size={14} /> Logout
                </button>
              </>
            )}
            <Link to="/workbench/login" onClick={() => setMobileOpen(false)} className="inline-block px-4 py-2 bg-[hsl(var(--luxury-gold))] text-black font-medium rounded hover:opacity-90 transition-all text-center">
              <Monitor size={14} className="inline mr-1" /> WorkBench
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header