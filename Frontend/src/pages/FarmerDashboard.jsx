import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerDashboard.css'; // We will create this css file next

const FarmerDashboard = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [ascs, setAscs] = React.useState([]);
    const [districts, setDistricts] = React.useState([]);
    const [selectedDistrict, setSelectedDistrict] = React.useState('');
    const [selectedAsc, setSelectedAsc] = React.useState('');
    const [isEditingAsc, setIsEditingAsc] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                setAscs(data);
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };
        fetchAscs();
    }, []);

    const handleUpdateAsc = async () => {
        if (!selectedAsc) return;
        setSaving(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/update-asc', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ assignedAsc: selectedAsc })
            });

            const data = await response.json();
            if (response.ok) {
                updateUser(data);
                setIsEditingAsc(false);
            }
        } catch (err) {
            console.error('Error updating ASC:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>Welcome, {user.name || 'Farmer'}! 🌾</h1>
                            <p>Manage your agricultural activities efficiently.</p>
                        </div>

                        <div className="asc-status-card" style={{
                            backgroundColor: '#fff',
                            padding: '15px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            border: '1px solid #e2e8f0',
                            maxWidth: '350px'
                        }}>
                            {!isEditingAsc ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>YOUR CENTER</span>
                                        <button
                                            onClick={() => setIsEditingAsc(true)}
                                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            Change
                                        </button>
                                    </div>
                                    {user.assignedAsc ? (
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>📍 {user.assignedAsc.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.assignedAsc.district} District</div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.9rem' }}>⚠️ No center assigned. Please select one.</div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '10px' }}>SELECT NEW CENTER</div>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                        style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="">Select District</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select
                                        value={selectedAsc}
                                        onChange={(e) => setSelectedAsc(e.target.value)}
                                        disabled={!selectedDistrict}
                                        style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="">Select Center</option>
                                        {ascs.filter(a => a.district === selectedDistrict).map(a => (
                                            <option key={a._id} value={a._id}>{a.name}</option>
                                        ))}
                                    </select>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleUpdateAsc}
                                            disabled={saving || !selectedAsc}
                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditingAsc(false)}
                                            disabled={saving}
                                            style={{ backgroundColor: '#cbd5e1', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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
