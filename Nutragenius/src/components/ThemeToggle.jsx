import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 rounded-full border-2 gold-border hover:gold-bg hover:text-primary transition-all no-print"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 gold-accent" />
      ) : (
        <Moon className="h-5 w-5 text-primary" />
      )}
    </Button>
  );
};

export default ThemeToggle;