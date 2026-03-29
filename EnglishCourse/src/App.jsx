import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
// import { SpeechProvider } from '@/contexts/SpeechContext'; // Removido pois a lógica de áudio foi simplificada e movida para os componentes
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// Page Components
import AdminLoginPage from '@/pages/AdminLoginPage';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import Schedule from '@/pages/Schedule';
import DailySentences from '@/pages/DailySentences';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import RequestPasswordResetPage from '@/pages/RequestPasswordResetPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import TermsAndPolicy from '@/pages/TermsAndPolicy'; 
import NotFound from '@/pages/NotFound';
import AdminDashboard from '@/pages/AdminDashboard';

function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms-and-policy" element={<TermsAndPolicy />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/sentences" element={<ProtectedRoute><DailySentences /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        
        {/* Protected Route for Admins */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Catch-all Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <HelmetProvider>
        <Helmet>
          <title>Perfect English - A sua fluência em 30 dias por nível</title>
          <meta name="description" content="Plataforma de aprendizado de inglês com método exclusivo, cronograma estruturado e gamificação." />
        </Helmet>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
                <AppContent />
                <Toaster />
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </Router>
  );
}

export default App;
