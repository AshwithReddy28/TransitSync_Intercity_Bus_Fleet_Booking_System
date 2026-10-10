import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CustomerRoute = ({ children }) => {
  const { user, loading, isCustomer } = useAuth();

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading application...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/admin/dashboard" replace />;

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading admin dashboard...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};
