// Adress: src/components/
// File: Navigation.jsx
// Extension: .jsx

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpenCheck, LayoutDashboard, Calendar, MessageSquare, History, User, LogOut, Crown, Mail, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/components/ui/use-toast';

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

const Navigation = () => {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isManaging, setIsManaging] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
        const response = await fetch(`${API_BASE_URL}/manage_subscription.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: user.id })
        });
        const result = await response.json();
        if (result.success && result.url) {
            window.location.href = result.url; // Redirect to Stripe Portal
        } else {
            throw new Error(result.error || 'Não foi possível aceder à sua assinatura.');
        }
    } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
        setIsManaging(false);
    }
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
    { path: '/schedule', icon: Calendar, label: 'Cronograma' },
    { path: '/sentences', icon: MessageSquare, label: 'Frases Diárias' },
    { path: '/history', icon: History, label: 'Histórico' },
    { path: '/contact', icon: Mail, label: 'Contacto' },
    { path: '/profile', icon: User, label: 'Perfil' }
  ];

  return (
    <nav className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BookOpenCheck className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground hidden sm:inline">Perfect English</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button variant="ghost" className={`flex items-center gap-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {user?.plan === 'premium' && user.is_active ? (
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={isManaging} className="hidden sm:flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                    <Crown className="w-4 h-4" />
                    <span>Gerir Premium</span>
                    <ExternalLink className="w-3 h-3" />
                </Button>
            ) : (
              <Link to="/pricing">
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                  <Crown className="w-4 h-4" />
                  <span>Upgrade</span>
                </Button>
              </Link>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
