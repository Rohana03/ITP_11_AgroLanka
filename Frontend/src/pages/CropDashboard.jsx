import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';
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
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1e3a8a' }}>Crop Management 🌾</h1>
                            <span className="role-badge" style={{ backgroundColor: '#15803d', color: 'white', padding: '4px 12px' }}>
                                CROP OFFICER
                            </span>
                        </div>
                        <p className="welcome-text" style={{ fontSize: '1.2rem', margin: 0 }}>
                            Welcome back, <strong style={{ color: '#15803d' }}>{user?.name}</strong>! {user?.specialization ? `Specialist in: ${user.specialization}` : 'Monitor and manage crop registrations.'}
                        </p>
                    </div>

                    <div className="header-right">
                        {user?.assignedAsc ? (
                            <div style={{ padding: '16px 24px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <div style={{ color: '#166534', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 ASSIGNED CENTER</div>
                                <div style={{ color: '#14532d', fontSize: '1.1rem', fontWeight: 'bold' }}>{user.assignedAsc.name}</div>
                                <div style={{ color: '#166534', fontSize: '0.9rem' }}>{user.assignedAsc.district} District</div>
                            </div>
                        ) : (
                            <div style={{ padding: '12px 20px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                <span style={{ color: '#9a3412', fontWeight: '600' }}>⚠️ NO CENTER ALLOCATED</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="card-icon">📋</div>
                        <div className="stat-label">Total Requests</div>
                        <div className="stat-value">{crops.length} <span style={{ fontSize: '1rem', fontWeight: '600', color: '#9ca3af' }}>Regs</span></div>
                    </div>
                    <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
                        <div className="card-icon">🏗️</div>
                        <div className="stat-label">Specialization</div>
                        <div className="stat-value" style={{ fontSize: '1.4rem' }}>{user?.specialization || 'Generalist'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned Focus</div>
                    </div>
                    <div className="stat-card">
                        <div className="card-icon">🌾</div>
                        <div className="stat-label">Pending Approval</div>
                        <div className="stat-value" style={{ color: '#d97706' }}>{crops.filter(c => c.status === 'PENDING').length}</div>
                    </div>
                </div>

                <div className="data-section dashboard-panel" style={{ marginTop: '40px', padding: '0', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid #f3f4f6' }}>
                        <h2 style={{ margin: 0, color: '#064e3b', fontSize: '1.5rem', fontWeight: '800' }}>Recent Crop Registrations</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        {loading ? (
                            <p>Loading crop requests...</p>
                        ) : crops.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                        {['Farmer', 'Crop', 'Variety', 'Land Size', 'Season', 'Soil', 'Status', 'Actions'].map((h, i) => (
                                            <th key={h} style={{
                                                padding: '20px 24px',
                                                textAlign: i === 0 ? 'left' : 'center',
                                                fontWeight: '700',
                                                fontSize: '0.8rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.12em',
                                                width: i === 0 ? '25%' : i === 7 ? '18%' : '11%'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {crops.map((crop, index) => (
                                        <tr key={crop._id} style={{
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.2s'
                                        }}>
                                            <td style={{ padding: '18px 24px', textAlign: 'left' }}>
                                                <div style={{ fontWeight: '700', color: '#111827' }}>{crop.farmer?.name}</div>
                                                {crop.farmer?.nic && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>🆔 {crop.farmer.nic}</div>}
                                            </td>
                                            <td style={{ padding: '18px 24px', textAlign: 'center', textTransform: 'capitalize', fontWeight: '600' }}>{crop.cropType}</td>
                                            <td style={{ padding: '18px 24px', textAlign: 'center' }}>{crop.variety || '-'}</td>
                                            <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600' }}>{crop.landSize} <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Ac</span></td>
                                            <td style={{ padding: '18px 24px', textAlign: 'center' }}>{crop.season || '-'}</td>
                                            <td style={{ padding: '18px 24px', textAlign: 'center', textTransform: 'capitalize' }}>{crop.soilType}</td>
                                            <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    backgroundColor: crop.status === 'PENDING' ? '#fef3c7' : crop.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                                                    color: crop.status === 'PENDING' ? '#92400e' : crop.status === 'APPROVED' ? '#065f46' : '#991b1b'
                                                }}>
                                                    {crop.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                                                {crop.status === 'PENDING' ? (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleStatusUpdate(crop._id, 'APPROVED')}
                                                            style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>✓</button>
                                                        <button onClick={() => handleStatusUpdate(crop._id, 'REJECTED')}
                                                            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>✕</button>
                                                    </div>
                                                ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Reviewed</span>}
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
