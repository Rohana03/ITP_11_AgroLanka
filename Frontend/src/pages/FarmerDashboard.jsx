import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerDashboard.css'; // We will create this css file next

const FarmerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Fallback if user is null (shouldn't happen if protected, but good for safety)
    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <h1>Welcome, {user.name || 'Farmer'}! 🌾</h1>
                    <p>Manage your agricultural activities efficiently.</p>
                </header>

                <div className="dashboard-grid">
                    {/* Block 1: Register Crop */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/register-crop')}>
                        <div className="card-icon">🌱</div>
                        <h3>Register Crop</h3>
                        <p>Register your new crops for the season.</p>
                    </div>

                    {/* Block 2: Financial Assistance and Compensation */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/financial-aid')}>
                        <div className="card-icon">💰</div>
                        <h3>Financial Assistance</h3>
                        <p>Apply for compensation and financial aid.</p>
                    </div>

                    {/* Block 3: Machinery and Service */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/machinery')}>
                        <div className="card-icon">🚜</div>
                        <h3>Machinery & Services</h3>
                        <p>Request machinery and agricultural services.</p>
                    </div>

                    {/* Block 4: Agricultural products */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/products')}>
                        <div className="card-icon">🛒</div>
                        <h3>Agricultural Products</h3>
                        <p>Explore and buy agricultural products.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
