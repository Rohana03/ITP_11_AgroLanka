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
        } else if (user.role === 'FINANCIAL_OFFICER') {
            return <Navigate to="/financial-dashboard" replace />;
        } else if (user.role === 'CROP_OFFICER') {
            return <Navigate to="/crop-dashboard" replace />;
        } else if (user.role === 'PRODUCT_MANAGER') {
            return <Navigate to="/product-dashboard" replace />;
        } else if (user.role === 'MACHINERY_OFFICER') {
            return <Navigate to="/machinery-dashboard" replace />;
        } else if (user.role === 'ASC_OFFICER') {
            return <Navigate to="/asc-dashboard" replace />;
        } else if (user.role === 'STORE_OFFICER') {
            return <Navigate to="/product-dashboard" replace />;
        } else {
            console.log('🏠 PublicRoute - No specific dashboard for role, showing public page or home');
            // If they are logged in but role isn't handled, we might want to let them see the landing page
            // or redirect to a common dashboard. Re-directing to "/" here would cause a loop if path is already "/"
            return children;
        }
    }

    console.log('✅ PublicRoute - Rendering public page');
    // If not logged in, allow access to public page
    return children;
};

export default PublicRoute;
