import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('DONOR' | 'VOLUNTEER' | 'ADMIN')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();
  const notifiedRef = useRef(false);

  const normalizedUserRole = String(userData?.role || '').toUpperCase() as 'DONOR' | 'VOLUNTEER' | 'ADMIN';
  const isUnauthorized = Boolean(
    currentUser &&
    userData &&
    allowedRoles &&
    !allowedRoles.map(r => r.toUpperCase()).includes(normalizedUserRole)
  );

  useEffect(() => {
    if (isUnauthorized && !notifiedRef.current) {
      notifiedRef.current = true;
      const targetDashboard = allowedRoles ? allowedRoles.join('/') : 'this';
      toast.error(`Access Blocked: ${normalizedUserRole} accounts cannot access ${targetDashboard} dashboard. Redirected to your authorized portal.`);
    }
  }, [isUnauthorized, normalizedUserRole, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-600">Verifying authorized dashboard access...</p>
      </div>
    );
  }

  if (!currentUser || !userData) {
    return <Navigate to="/login" replace />;
  }

  if (isUnauthorized) {
    return <Navigate to={`/${normalizedUserRole.toLowerCase()}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
