// Adress: src/contexts/
// File: ThemeProvider.jsx
// Extension: .jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
  toggleTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "perfect-english-theme", // Using a more specific key
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    root.classList.add(effectiveTheme);
  }, [theme]);

  // Using useCallback to memoize the function
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    toggleTheme, // Exposing the toggle function
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
