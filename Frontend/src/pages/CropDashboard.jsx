import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './FarmerDashboard.css';

const CropDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>Crop Officer Dashboard 🌾</h1>
                        <p>Welcome, {user?.name}! Monitor and manage crop registrations.</p>
                        {user?.assignedAsc ? (
                            <div className="allocation-info" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981', display: 'inline-block' }}>
                                <span style={{ color: '#065f46', fontWeight: '600' }}>📍 Assigned Center: </span>
                                <span style={{ color: '#047857' }}>{user.assignedAsc.name} - {user.assignedAsc.district} District</span>
                            </div>
                        ) : (
                            <div className="allocation-info" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #f97316', display: 'inline-block' }}>
                                <span style={{ color: '#9a3412', fontWeight: '500' }}>⚠️ No ASC Center allocated yet. Please contact Admin.</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">📋</div>
                        <h3>Crop Records</h3>
                        <p>View all registered crops in your district.</p>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-icon">📈</div>
                        <h3>Harvest Stats</h3>
                        <p>Track yield expectations and harvest progress.</p>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-icon">🛠️</div>
                        <h3>Advisory Tools</h3>
                        <p>Provide guidance and tools for farmers.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropDashboard;
