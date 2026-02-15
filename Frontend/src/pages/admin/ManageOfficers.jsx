import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import '../AdminDashboard.css';

const ManageOfficers = () => {
    const { token } = useAuth();
    const [officers, setOfficers] = useState([]);
    const [ascs, setAscs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Form state for new officer
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        nic: '',
        role: 'ASC_OFFICER'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [officersRes, ascsRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/officers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/ascs')
            ]);

            const officersData = await officersRes.json();
            const ascsData = await ascsRes.json();

            setOfficers(officersData);
            setAscs(ascsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Officer ${formData.name} registered successfully!`);
                setFormData({ name: '', email: '', password: '', nic: '', role: 'ASC_OFFICER' });
                fetchData(); // Refresh list
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Server error during registration');
        }
    };

    const handleAssign = async (userId, ascId) => {
        try {
            const response = await fetch('http://localhost:5000/api/admin/assign-officer', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, ascId })
            });

            const data = await response.json();

            if (response.ok) {
                // Update local state
                setOfficers(officers.map(off =>
                    off._id === userId ? { ...off, assignedAsc: data.assignedAsc } : off
                ));
                setMessage(`Staff reallocation successful!`);
                setTimeout(() => setMessage(''), 3000);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error assigning officer:', error);
            alert('Failed to assign officer');
        }
    };

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Staff & Allocation Management</h1>
                        <p>Register new officers and reallocate them across regions</p>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Registration Section */}
                    <div className="dashboard-section" style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3>Register New Agricultural Officer</h3>
                        <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
                            <input type="text" name="name" placeholder="Full Name" className="form-control" value={formData.name} onChange={handleFormChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                            <input type="email" name="email" placeholder="Email Address" className="form-control" value={formData.email} onChange={handleFormChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                            <input type="password" name="password" placeholder="Temp Password" className="form-control" value={formData.password} onChange={handleFormChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                            <input type="text" name="nic" placeholder="NIC Number" className="form-control" value={formData.nic} onChange={handleFormChange} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                            <select name="role" className="form-control" value={formData.role} onChange={handleFormChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                                <option value="ASC_OFFICER">ASC Officer</option>
                                <option value="STORE_OFFICER">Agri-Store Officer</option>
                            </select>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Register Staff</button>
                        </form>
                        {message && <p style={{ color: '#059669', marginTop: '10px', fontWeight: '600' }}>✅ {message}</p>}
                        {error && <p style={{ color: '#dc2626', marginTop: '10px', fontWeight: '600' }}>❌ {error}</p>}
                    </div>

                    <div className="dashboard-section">
                        <h2>Assigned Staff Members</h2>
                        <div className="data-table-container">
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                        <th style={{ padding: '16px' }}>Name</th>
                                        <th style={{ padding: '16px' }}>Role</th>
                                        <th style={{ padding: '16px' }}>Current Region</th>
                                        <th style={{ padding: '16px' }}>Reallocate To</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {officers.length > 0 ? (
                                        officers.map(officer => (
                                            <tr key={officer._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{officer.name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{officer.email}</div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                                                        {officer.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    {officer.assignedAsc ? (
                                                        <div style={{ color: '#059669', fontWeight: '500' }}>
                                                            📍 {officer.assignedAsc.name}
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '20px' }}>{officer.assignedAsc.district} District</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8 italic' }}>Unallocated</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <select
                                                        className="form-control"
                                                        value={officer.assignedAsc?._id || ''}
                                                        onChange={(e) => handleAssign(officer._id, e.target.value)}
                                                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '220px' }}
                                                    >
                                                        <option value="">Select Center...</option>
                                                        {ascs.map(asc => (
                                                            <option key={asc._id} value={asc._id}>
                                                                {asc.name} ({asc.district})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                                No agricultural officers found in system.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageOfficers;
