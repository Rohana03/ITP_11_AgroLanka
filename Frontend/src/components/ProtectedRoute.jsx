import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Redirects unauthenticated users to login page
 * Only allows access to authenticated users
 */
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Show nothing while checking authentication status
    if (loading) {
        return <div>Loading...</div>;
    }

    // If not logged in, redirect to login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If logged in, allow access to protected page
    return children;
};

export default ProtectedRoute;
