import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const MyCrops = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyCrops = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/crops', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setCrops(data);
                } else {
                    setError(data.message || 'Failed to fetch crops');
                }
            } catch (err) {
                setError('Server error while fetching crops');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchMyCrops();
        }
    }, [user]);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'APPROVED': return 'badge-success';
            case 'REJECTED': return 'badge-danger';
            default: return 'badge-warning';
        }
    };

    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer/register-crop')}>
                        ← Back to Registration
                    </button>
                    <h1>🌾 My Crop Registration Requests</h1>
                    <p>Track the status of your crop registration requests</p>
                </div>

                <div className="content-card">
                    {loading ? (
                        <div className="loading">Loading your crops...</div>
                    ) : error ? (
                        <div className="alert-error">{error}</div>
                    ) : crops.length === 0 ? (
                        <div className="empty-state">
                            <p>No registration requests found.</p>
                            <button className="btn btn-primary" onClick={() => navigate('/farmer/register-crop')}>
                                Create New Request
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Crop Type</th>
                                        <th>Variety</th>
                                        <th>Land Size (Acres)</th>
                                        <th>Season</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {crops.map((crop) => (
                                        <tr key={crop._id}>
                                            <td style={{ textTransform: 'capitalize' }}>{crop.cropType}</td>
                                            <td>{['rice', 'vegetables', 'fruits', 'spices', 'other'].includes(crop.cropType) ? crop.variety : '-'}</td>
                                            <td>{crop.landSize}</td>
                                            <td>{crop.season === 'N/A' ? '-' : crop.season}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(crop.status)}`}>
                                                    {crop.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyCrops;
