import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PublicRoute Component
 * Redirects logged-in users to their dashboard
 * Only allows access to users who are NOT logged in
 */
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    console.log('🔓 PublicRoute - Loading:', loading, 'User:', user);

    // Show nothing while checking authentication status
    if (loading) {
        console.log('⏳ PublicRoute - Still loading...');
        return <div>Loading...</div>;
    }

    // If user is logged in, redirect to their dashboard based on role
    if (user) {
        console.log('👤 PublicRoute - User logged in, role:', user.role);
        if (user.role === 'FARMER') {
            console.log('🚜 PublicRoute - Redirecting to farmer dashboard');
            return <Navigate to="/farmer-dashboard" replace />;
        } else if (user.role === 'ADMIN') {
            console.log('👨‍💼 PublicRoute - Redirecting to admin panel');
            return <Navigate to="/admin" replace />;
        } else {
            console.log('🏠 PublicRoute - Redirecting to home');
            return <Navigate to="/" replace />;
        }
    }

    console.log('✅ PublicRoute - Rendering public page');
    // If not logged in, allow access to public page
    return children;
};

export default PublicRoute;
