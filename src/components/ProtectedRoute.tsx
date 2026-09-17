import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('DONOR' | 'VOLUNTEER' | 'ADMIN')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser || !userData) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return <Navigate to={`/${userData.role.toLowerCase()}`} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
