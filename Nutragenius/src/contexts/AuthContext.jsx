// /src/contexts/AuthContext.jsx
// This version includes a more robust listener for the Google OAuth popup
// to handle all success and error scenarios correctly.

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Set axios to send credentials (cookies) with every request
axios.defaults.withCredentials = true;
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAuthStatus = useCallback(async () => {
    // No need to set loading here to avoid flashes, the main useEffect handles it.
    try {
      const response = await axios.get(`${API_URL}/session.php`);
      if (response.data && response.data.loggedIn) {
        setUser(response.data.user);
        setIsAdmin(response.data.user.is_admin === 1);
        return response.data.user;
      } else {
        setUser(null);
        setIsAdmin(false);
        return null;
      }
    } catch (error) {
      setUser(null);
      setIsAdmin(false);
      // This is expected if not logged in, so no need for an error toast.
      return null;
    }
  }, []);

  useEffect(() => {
    const initialAuthCheck = async () => {
        setLoading(true);
        await checkAuthStatus();
        setLoading(false);
    };
    initialAuthCheck();
  }, [checkAuthStatus]);

  // --- GOOGLE OAUTH POPUP LISTENER ---
  // This listener handles messages from the google-callback.php popup window.
  useEffect(() => {
    const handleGooglePopupMessage = async (event) => {
        // Security check: only accept messages from the same origin
        if (event.origin !== window.location.origin) {
            return;
        }

        const { data } = event;
        // Ensure the message is from our specific OAuth flow
        if (data && data.source === 'google-oauth') {
            if (data.success) {
                toast({ 
                    title: "Google Sign-In Successful", 
                    description: "Welcome to NutraGenius!" 
                });
                // The backend has set the cookie. Re-fetch user state to log in.
                const loggedInUser = await checkAuthStatus();
                if (loggedInUser) {
                   // Navigate based on user role after successful login.
                   navigate(loggedInUser.is_admin ? '/admin' : '/dashboard');
                }
            } else {
                // Display the user-friendly error message from the backend.
                toast({
                    title: "Google Sign-In Failed",
                    description: data.error || "An unknown error occurred. Please try again or sign up manually.",
                    variant: 'destructive',
                    duration: 8000, // Show for longer
                });
            }
        }
    };

    window.addEventListener('message', handleGooglePopupMessage);

    // Cleanup: remove the event listener when the component unmounts.
    return () => {
        window.removeEventListener('message', handleGooglePopupMessage);
    };
  }, [checkAuthStatus, navigate, toast]);


  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login.php`, { email, password });
      if (response.data && response.data.user) {
        setUser(response.data.user);
        setIsAdmin(response.data.user.is_admin === 1);
        toast({ title: "Login Successful", description: "Welcome back!" });
        return response.data.user;
      }
    } catch (error) {
      toast({ 
        title: "Login Failed", 
        description: error.response?.data?.error || "An error occurred.", 
        variant: 'destructive' 
      });
      throw error;
    }
  };
  
  const register = async (fullName, email, password) => {
      try {
          await axios.post(`${API_URL}/register.php`, { fullName, email, password });
          return true; // Indicate success for the modal to handle redirection
      } catch(error) {
          toast({
              title: "Registration Failed",
              description: error.response?.data?.error || "An error occurred.",
              variant: 'destructive',
          });
          throw error;
      }
  };

  const loginWithGoogle = () => {
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      // The target URL now correctly points to the API endpoint that starts the flow.
      const url = `${API_URL}/google_oauth.php`;
      // Open the popup, which will eventually be closed by the callback script.
      window.open(url, 'googleLogin', `width=${width},height=${height},top=${top},left=${left}`);
  };
  
  const adminLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login.php`, { email, password });
      if (response.data && response.data.user && response.data.user.is_admin) {
        setUser(response.data.user);
        setIsAdmin(true);
        toast({ title: "Admin Login Successful", description: "Welcome, Administrator." });
        return response.data.user;
      } else {
         toast({ 
            title: "Admin Login Failed", 
            description: "You do not have administrator privileges.", 
            variant: 'destructive' 
        });
         throw new Error("Not an admin");
      }
    } catch (error) {
      toast({ 
        title: "Admin Login Failed", 
        description: error.response?.data?.error || "Invalid credentials.", 
        variant: 'destructive' 
    });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout.php`);
    } catch (error) {
      // Log error but proceed with frontend logout regardless.
      console.error("Server logout request failed:", error);
    } finally {
      setUser(null);
      setIsAdmin(false);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      navigate('/');
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    login,
    register,
    loginWithGoogle,
    adminLogin,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
