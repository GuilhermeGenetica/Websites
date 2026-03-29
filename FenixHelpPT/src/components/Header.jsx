import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Heart, AlertTriangle, UserCog, Gift, ShieldCheck, UserPlus, LogOut } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  const adminMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  // ALTERAÇÃO: Função de logoff autónoma, sem depender de AuthContext.
  const handleLogout = () => {
    // Remove os dados do utilizador do localStorage.
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    
    // Mostra a notificação.
    toast({ title: "Sessão terminada", description: "Você foi desconectado." });
    
    // Opcional: Recarrega a página para garantir que o estado da aplicação é atualizado.
    window.location.reload();
  };

  const mainNavigation = [
    { name: 'Início', href: '/' },
    { name: 'Mural', href: '/mural' },
    { name: 'Ações Ativas', href: '/acoes' },
    { name: 'Avisos', href: '/blog' },
    { name: 'Mapa', href: '/mapa' },
  ];

  const adminNavigation = [
    { name: 'Registar', href: '/registar', icon: UserPlus },
    { name: 'Validador', href: '/validador', icon: ShieldCheck },
    { name: 'Admin', href: '/admin', icon: UserCog },
  ];

  const isActive = (path) => location.pathname === path;

  const linkClasses = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-gray-800'
        : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
    }`;

  const mobileLinkClasses = (path) =>
    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
        isActive(path)
        ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-gray-800'
        : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
    }`;


  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white hidden sm:block">
              Projeto Fénix
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {mainNavigation.map((item) => (
              <Link key={item.name} to={item.href} className={linkClasses(item.href)}>
                {item.name}
              </Link>
            ))}
            <Link to="/doar" className={`${linkClasses('/doar')} flex items-center`}>
              <Gift className="w-4 h-4 mr-2" />
              Doar
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Link to="/preciso-ajuda">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Preciso de Ajuda
              </Button>
            </Link>
            <Link to="/quero-ajudar">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Heart className="w-4 h-4 mr-2" />
                Quero Ajudar
              </Button>
            </Link>
            
            <div className="relative" ref={adminMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                className="text-gray-700 dark:text-gray-300 rounded-full"
              >
                <UserCog className="w-5 h-5" />
              </Button>
              <AnimatePresence>
                {isAdminMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700"
                  >
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                    {/* ALTERAÇÃO: Botão de Sair sempre visível */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-700 dark:text-gray-300 rounded-full"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-700 dark:text-gray-300"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-2 pb-4 space-y-1 border-t border-gray-200 dark:border-gray-700">
                {mainNavigation.map((item) => (
                  <Link key={item.name} to={item.href} className={mobileLinkClasses(item.href)}>
                    {item.name}
                  </Link>
                ))}
                <Link to="/doar" className={`${mobileLinkClasses('/doar')} flex items-center`}>
                    <Gift className="w-5 h-5 mr-3" />
                    Doar
                </Link>

                <div className="pt-4 pb-2">
                    <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                        Administração
                    </h3>
                    <div className="mt-2 space-y-1">
                        {adminNavigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} to={item.href} className={`${mobileLinkClasses(item.href)} flex items-center`}>
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        {/* ALTERAÇÃO: Botão de Sair móvel sempre visível */}
                        <button
                            onClick={handleLogout}
                            className={`${mobileLinkClasses('')} flex items-center w-full text-left`}
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Sair
                        </button>
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Link to="/preciso-ajuda">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Preciso de Ajuda
                    </Button>
                  </Link>
                  <Link to="/quero-ajudar">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <Heart className="w-4 h-4 mr-2" />
                      Quero Ajudar
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
