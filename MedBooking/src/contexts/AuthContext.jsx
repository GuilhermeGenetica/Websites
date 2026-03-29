import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

// UPDATED: Read the API base URL from Vite's environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedUserType = localStorage.getItem('userType');
    const savedToken = localStorage.getItem('token');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedUser && savedUserType && savedToken) {
      setUser(JSON.parse(savedUser));
      setUserType(savedUserType);
      setToken(savedToken);
    }
    setTheme(savedTheme);
    setLoading(false);
  }, []);

  // IMPROVEMENT: Check if the environment variable is set
  if (!API_BASE_URL) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: VITE_API_BASE_URL is not configured.
        Please check the .env file in the project root.
      </div>
    );
  }

  const login = async (credentials, type) => {
    setLoading(true);
    try {
      // No change here, API_BASE_URL is now the environment variable
      const endpoint = `${API_BASE_URL}/auth_${type}.php`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        const userData = { ...data.user, token: data.token };
        setUser(userData);
        setUserType(type);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userType', type);
        localStorage.setItem('token', data.token);
        toast({
          title: "Login successful!",
          description: `Welcome, ${data.user.name}.`,
        });
        return { success: true, message: data.message, user: userData, userType: type };
      } else {
        toast({
          title: "Login Error",
          description: data.message || "Invalid credentials. Try again.",
          variant: "destructive",
        });
        console.error("Login Error (Backend):", data.message);
        return { success: false, message: data.message || "Unknown error." };
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Check your connection.",
        variant: "destructive",
      });
      console.error("Login Error (Frontend - Network):", error);
      return { success: false, message: "Network error or server unavailable." };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData, type) => {
    setLoading(true);
    try {
      // No change here, API_BASE_URL is now the environment variable
      const endpoint = `${API_BASE_URL}/register_${type}.php`; 
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Registration successful!",
          description: data.message || "Your account has been created. Log in to continue.",
        });
        return { success: true, message: data.message };
      } else {
        toast({
          title: "Registration Error",
          description: data.message || "Could not register. Try again.",
          variant: "destructive",
        });
        console.error("Register Error (Backend):", data.message);
        return { success: false, message: data.message || "Unknown error." };
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Check your connection.",
        variant: "destructive",
      });
      console.error("Register Error (Frontend - Network):", error);
      return { success: false, message: "Network error or server unavailable." };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('token');
    toast({
      title: "Session ended",
      description: "You have been logged out.",
    });
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const value = {
    user,
    userType,
    token,
    loading,
    theme,
    login,
    register,
    logout,
    updateUser,
    toggleTheme,
    API_BASE_URL, // This now exports the dynamic URL
    setToken,
    setUser,
    setUserType
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};