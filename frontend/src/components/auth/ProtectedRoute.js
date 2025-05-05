import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute component for restricting access to authenticated users
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.requireStaff - Whether the route requires staff role
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} Protected route or redirect
 */
const ProtectedRoute = ({ requireStaff = false, children }) => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If staff role is required but user is not staff, redirect to home
  if (requireStaff && !isStaff) {
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated (and has staff role if required)
  return children;
};

export default ProtectedRoute; 