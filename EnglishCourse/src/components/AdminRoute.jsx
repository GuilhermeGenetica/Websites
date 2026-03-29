// Adress: src/components/
// File: AdminRoute.jsx
// Extension: .jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    // Redireciona para o login se não estiver autenticado
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  if (user && !user.is_admin) {
    // Redireciona para o dashboard se não for admin
    return <Navigate to="/dashboard" replace />;
  }

  // Se for admin, renderiza o componente filho
  return children;
};

export default AdminRoute;
