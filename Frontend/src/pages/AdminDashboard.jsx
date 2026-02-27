import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ ascCount: 0, officerCount: 0 });
    const [selectedDistrict, setSelectedDistrict] = useState('Colombo');

    const districtMaps = {
        'Colombo': 'https://www.arcgis.com/apps/View/index.html?appid=31819d80c90e4900a5b6e78d6ac68645',
        'Gampaha': 'https://www.arcgis.com/apps/View/index.html?appid=90ed750c43b24120b72b8ec23654db0f',
        'Kalutara': 'https://www.arcgis.com/apps/View/index.html?appid=9c4b081e44674e2b98d4870e706e7293',
        'Kandy': 'https://www.arcgis.com/apps/View/index.html?appid=73d44159b7134a939fbeeaf87b08e70a',
        'Matale': 'https://www.arcgis.com/apps/View/index.html?appid=880785c295f04a2284fbcaadb85d1f21',
        'Nuwara Eliya': 'https://www.arcgis.com/apps/View/index.html?appid=8e1e78f5c64c4bdb9ed98ca09622a7d5',
        'Hambantota': 'https://www.arcgis.com/apps/View/index.html?appid=31dd9dd925564f69bc6bd05235d36708',
        'Galle': 'https://www.arcgis.com/apps/View/index.html?appid=d9a0ea39206f4c24a9354619a49cadd8',
        'Matara': 'https://www.arcgis.com/apps/View/index.html?appid=31acfb4aedde4e98907346eb7ae13a46',
        'Kurunegala': 'https://www.arcgis.com/apps/View/index.html?appid=29282b97aca840f182d4e662d6942c52',
        'Puttalam': 'https://www.arcgis.com/apps/View/index.html?appid=1dea7212598b42bdbd01523a9439747b',
        'Anuradhapura': 'https://www.arcgis.com/apps/View/index.html?appid=ef424354e2b94454924fb7253471fc76',
        'Polonnaruwa': 'https://www.arcgis.com/apps/View/index.html?appid=12ad4ba3753c4fad86101929503aeb56',
        'Kegalle': 'https://www.arcgis.com/apps/View/index.html?appid=52758ac8ffc64a82b51183d258b85e42',
        'Ratnapura': 'https://www.arcgis.com/apps/View/index.html?appid=b82ed0afa7244ee6a15d79afd69ca857',
        'Badulla': 'https://www.arcgis.com/apps/View/index.html?appid=8946b8891b1d41e294511de6e4391e00',
        'Moneragala': 'https://www.arcgis.com/apps/View/index.html?appid=1819d18aeea84900adbe872bb08c4f98',
        'Jaffna': 'https://www.arcgis.com/apps/View/index.html?appid=47cce0dfdb5346e49595e1281f58ac0e',
        'Kilinochchi': 'https://www.arcgis.com/apps/View/index.html?appid=94253b16478e4e88835d018102f9b9e3',
        'Vavuniya': 'https://www.arcgis.com/apps/View/index.html?appid=331db40202024d7097ebcba6fb6cff68',
        'Mullaitivu': 'https://www.arcgis.com/apps/View/index.html?appid=6989a8cb4d9040c4801e31d18f54b0ce',
        'Mannar': 'https://www.arcgis.com/apps/View/index.html?appid=3245ecb5cdf04709abf91ffc4ebbfff6',
        'Trincomalee': 'https://www.arcgis.com/apps/View/index.html?appid=4f784ca89b004693aca062435f370582',
        'Batticaloa': 'https://www.arcgis.com/apps/View/index.html?appid=6db119fe17fd4c9781a589ed15ff2d09',
        'Ampara': 'https://www.arcgis.com/apps/View/index.html?appid=d48dca51c5814f96902118241fdce3a2',
    };

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
                            {/* ── District AI Range Map ── */}
                            <div className="dashboard-section" style={{ marginTop: '30px' }}>
                                <div className="section-header">
                                    <h2>🗺️ District Agricultural AI Range Map</h2>
                                    <p>Explore district-wise Agrarian Instructor (AI) range boundaries across Sri Lanka. Source: <a href="https://doa.gov.lk/ai-range-in-sri-lanka/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Department of Agriculture</a></p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                                    <label style={{ fontWeight: '600', color: '#374151' }}>Select District:</label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={e => setSelectedDistrict(e.target.value)}
                                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', color: '#1e293b', backgroundColor: '#fff', cursor: 'pointer', minWidth: '200px' }}
                                    >
                                        {Object.keys(districtMaps).map(d => (
                                            <option key={d} value={d}>{d} District</option>
                                        ))}
                                    </select>
                                    <a
                                        href={districtMaps[selectedDistrict]}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm"
                                        style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}
                                    >
                                        ↗ Open Full Map
                                    </a>
                                </div>

                                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                                    <iframe
                                        key={selectedDistrict}
                                        src={districtMaps[selectedDistrict]}
                                        title={`AI Range Map - ${selectedDistrict}`}
                                        width="100%"
                                        height="520"
                                        style={{ display: 'block', border: 'none' }}
                                        allowFullScreen
                                    />
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
