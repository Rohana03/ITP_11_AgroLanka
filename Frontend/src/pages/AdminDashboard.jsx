import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ ascCount: 0, officerCount: 0 });

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const [ascsRes, officersRes] = await Promise.all([
                fetch('http://localhost:5000/api/ascs'),
                fetch('http://localhost:5000/api/admin/officers', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);
            const ascs = await ascsRes.json();
            const officers = await officersRes.json();
            setStats({
                ascCount: ascs.length,
                officerCount: officers.length
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    if (!user) {
        return (
            <div className="dashboard-loading">
                <Navbar />
                <div className="loading-content">
                    <p>Loading user data...</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Ministry of Agriculture Control Panel</h1>
                        <p className="welcome-text">Welcome back, <strong>{user.name}</strong></p>
                    </div>
                    <div className="header-right">
                        <span className={`role-badge role-${user.role.toLowerCase()}`}>
                            {user.role.replace('_', ' ')}
                        </span>
                        <button onClick={handleLogout} className="btn btn-outline ml-2">Logout</button>
                    </div>
                </header>

                <div className="dashboard-content">
                    {user.role === 'ADMIN' && (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{stats.ascCount}</div>
                                    <div className="stat-label">ASC Centers</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{stats.officerCount}</div>
                                    <div className="stat-label">Total Staff</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">25</div>
                                    <div className="stat-label">Districts Covered</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">Active</div>
                                    <div className="stat-label">System Status</div>
                                </div>
                            </div>

                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2>Centralized Management</h2>
                                    <p>Manage infrastructure and staff reallocation</p>
                                </div>
                                <div className="action-grid">
                                    <div className="action-card" onClick={() => navigate('/admin/ascs')}>
                                        <div className="card-icon">🏢</div>
                                        <h3>Agrarian Centers</h3>
                                        <p>Comprehensive view of all ASC centers and their assigned staff.</p>
                                        <button className="btn btn-sm">Manage Infrastructure</button>
                                    </div>
                                    <div className="action-card" onClick={() => navigate('/admin/officers')}>
                                        <div className="card-icon">👥</div>
                                        <h3>Staff & Allocation</h3>
                                        <p>Register officers and reallocate staff between different centers.</p>
                                        <button className="btn btn-sm">Manage Staff</button>
                                    </div>
                                    <div className="action-card" onClick={() => navigate('/admin/products/review')}>
                                        <div className="card-icon">📦</div>
                                        <h3>Product Approval</h3>
                                        <p>Review and approve regulated product listings from managers.</p>
                                        <button className="btn btn-sm">Review Queue</button>
                                    </div>
                                    <div className="action-card">
                                        <div className="card-icon">📊</div>
                                        <h3>Regional Reports</h3>
                                        <p>View agricultural production reports by district and province.</p>
                                        <button className="btn btn-sm">View Analytics</button>
                                    </div>
                                    <div className="action-card">
                                        <div className="card-icon">⚙️</div>
                                        <h3>System Settings</h3>
                                        <p>Modify global parameters and user access permissions.</p>
                                        <button className="btn btn-sm">Configuration</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Keep other roles simplified for now as per previous version */}
                    {user.role !== 'ADMIN' && (
                        <div className="dashboard-section">
                            <h2>Portal Dashboard</h2>
                            <p>You are logged in as {user.role.replace('_', ' ')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
