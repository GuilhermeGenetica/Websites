// /src/App.jsx
// This file is fully restored and corrected to include the password reset routes.

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

import LandingPage from '@/pages/LandingPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'; 
import ResetPasswordPage from '@/pages/ResetPasswordPage';

import DashboardPage from '@/pages/DashboardPage';
import QuestionnairePage from '@/pages/QuestionnaireForm';
import ReportPage from '@/pages/ReportPage';
import SharedReportPage from '@/pages/SharedReportPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminRulesEditor from '@/pages/admin/AdminRulesEditor';
import AdminUserManagement from '@/pages/admin/AdminUserManagement';
import ProfilePage from '@/pages/ProfilePage';
import ContactPage from '@/pages/ContactPage';
import PolicyPage from '@/pages/PolicyPage';
import CertificationsPage from '@/pages/CertificationsPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import AboutUsPage from '@/pages/AboutUsPage'; 
import NotFoundPage from '@/pages/NotFoundPage';


const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-background"><div>Loading...</div></div>;
  }
  
  if (!user) {
    // Redirect to home, which can then open the auth modal if needed.
    return <Navigate to="/" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Helmet>
          <title>NutraGenius - Precision Nutrition Platform</title>
          <meta name="description" content="An integrated platform for nutritional, genetic, and metabolic analysis, designed to translate essential data into high-precision nutritional strategies." />
        </Helmet>
        <div className="min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            {/* The old /login and /register now redirect to home to enforce modal usage */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            
            {/* NEW: Forgot and Reset Password Routes */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PolicyPage />} />
            <Route path="/certifications" element={<CertificationsPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/about-us" element={<AboutUsPage />} />

            {/* Private User Routes */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/questionnaire" element={<PrivateRoute><QuestionnairePage /></PrivateRoute>} />
            <Route path="/report/:id" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/report/shared/:token" element={<SharedReportPage />} />

            {/* Private Admin Routes */}
            <Route path="/admin" element={<PrivateRoute adminOnly={true}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/rules-editor" element={<PrivateRoute adminOnly={true}><AdminRulesEditor /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute adminOnly={true}><AdminUserManagement /></PrivateRoute>} />
            
            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

