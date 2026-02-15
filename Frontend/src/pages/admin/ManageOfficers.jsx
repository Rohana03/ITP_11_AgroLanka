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

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

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
                        <p>Manage existing agricultural officers and their regional allocations</p>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Filtering Section */}
                    <div className="dashboard-section" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '5px', display: 'block' }}>Search by Name or Email</label>
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    className="form-control"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ width: '180px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '5px', display: 'block' }}>Filter by Role</label>
                                <select
                                    className="form-control"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="ASC_OFFICER">ASC Officer</option>
                                    <option value="STORE_OFFICER">Store Officer</option>
                                    <option value="FINANCIAL_OFFICER">Financial Officer</option>
                                    <option value="CROP_OFFICER">Crop Officer</option>
                                    <option value="PRODUCT_MANAGER">Product Manager</option>
                                    <option value="MACHINERY_OFFICER">Machinery Officer</option>
                                </select>
                            </div>
                            <div style={{ width: '180px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '5px', display: 'block' }}>Allocation Status</label>
                                <select
                                    className="form-control"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ALLOCATED">Allocated</option>
                                    <option value="UNALLOCATED">Unallocated</option>
                                </select>
                            </div>
                        </div>
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
                                    {officers
                                        .filter(officer => {
                                            const matchesSearch = officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                officer.email.toLowerCase().includes(searchTerm.toLowerCase());
                                            const matchesRole = roleFilter === 'ALL' || officer.role === roleFilter;
                                            const matchesStatus = statusFilter === 'ALL' ||
                                                (statusFilter === 'ALLOCATED' ? officer.assignedAsc : !officer.assignedAsc);
                                            return matchesSearch && matchesRole && matchesStatus;
                                        })
                                        .map(officer => (
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
                                        ))}

                                    {officers.filter(officer => {
                                        const matchesSearch = officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            officer.email.toLowerCase().includes(searchTerm.toLowerCase());
                                        const matchesRole = roleFilter === 'ALL' || officer.role === roleFilter;
                                        const matchesStatus = statusFilter === 'ALL' ||
                                            (statusFilter === 'ALLOCATED' ? officer.assignedAsc : !officer.assignedAsc);
                                        return matchesSearch && matchesRole && matchesStatus;
                                    }).length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                                    No officers match the current filters.
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
