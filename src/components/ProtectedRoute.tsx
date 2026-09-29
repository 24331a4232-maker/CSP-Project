import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { normalizeUserRole, getDashboardPathForRole, UserRole } from '../lib/roleHelper';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();
  const notifiedRef = useRef(false);

  const normalizedUserRole = normalizeUserRole(userData?.role, 'DONOR');
  const isUnauthorized = Boolean(
    currentUser &&
    userData &&
    allowedRoles &&
    !allowedRoles.map(r => normalizeUserRole(r)).includes(normalizedUserRole)
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
    return <Navigate to={getDashboardPathForRole(normalizedUserRole)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
