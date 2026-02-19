import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './FarmerDashboard.css';

const CropDashboard = () => {
    const { user } = useAuth();
    const [crops, setCrops] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchCrops = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/crops', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setCrops(data);
            }
        } catch (err) {
            console.error('Error fetching crops:', err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCrops();
    }, []);

    const handleStatusUpdate = async (cropId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/crops/${cropId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Refresh the list
                fetchCrops();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Server error while updating status');
        }
    };

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>Crop Officer Dashboard 🌾</h1>
                        <p>Welcome, {user?.name}! {user?.specialization ? `Specialist in: ${user.specialization}` : 'Monitor and manage crop registration requests.'}</p>
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
                        <h3>Total Requests</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{crops.length}</p>
                        <p>Crop registrations in {user?.assignedAsc?.name || 'your center'}.</p>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-icon">🏗️</div>
                        <h3>Your Side</h3>
                        <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#059669', margin: '10px 0' }}>{user?.specialization || 'Not Specified'}</p>
                        <p>Your specialized agricultural focus.</p>
                    </div>
                </div>

                <div className="data-section" style={{ marginTop: '40px' }}>
                    <h2>Recent Crop Registrations</h2>
                    <div className="table-container" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginTop: '20px' }}>
                        {loading ? (
                            <p>Loading crop requests...</p>
                        ) : crops.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                        <th style={{ padding: '12px' }}>Farmer</th>
                                        <th style={{ padding: '12px' }}>Crop Type</th>
                                        <th style={{ padding: '12px' }}>Variety</th>
                                        <th style={{ padding: '12px' }}>Land Size</th>
                                        <th style={{ padding: '12px' }}>Season</th>
                                        <th style={{ padding: '12px' }}>Soil Type</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {crops.map(crop => (
                                        <tr key={crop._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div>{crop.farmer?.name}</div>
                                                <small style={{ color: '#64748b' }}>{crop.farmer?.nic}</small>
                                            </td>
                                            <td style={{ padding: '12px', textTransform: 'capitalize' }}>{crop.cropType}</td>
                                            <td style={{ padding: '12px' }}>{['rice', 'vegetables', 'fruits', 'spices', 'other'].includes(crop.cropType) ? crop.variety : '-'}</td>
                                            <td style={{ padding: '12px' }}>{crop.landSize} Acres</td>
                                            <td style={{ padding: '12px' }}>{crop.season === 'N/A' ? '-' : crop.season}</td>
                                            <td style={{ padding: '12px', textTransform: 'capitalize' }}>{crop.soilType}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    backgroundColor: crop.status === 'PENDING' ? '#fef3c7' : crop.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                                                    color: crop.status === 'PENDING' ? '#92400e' : crop.status === 'APPROVED' ? '#065f46' : '#991b1b'
                                                }}>
                                                    {crop.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {crop.status === 'PENDING' ? (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleStatusUpdate(crop._id, 'APPROVED')}
                                                            style={{ padding: '4px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(crop._id, 'REJECTED')}
                                                            style={{ padding: '4px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem italic' }}>Decision Made</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>No crop registrations found for this center.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropDashboard;
