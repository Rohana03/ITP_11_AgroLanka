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
                                    <option value="FINANCIAL_OFFICER">Financial Officer</option>
                                    <option value="CROP_OFFICER">Crop Officer</option>
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

                    <div className="dashboard-section" style={{ 
                        backgroundColor: 'white', 
                        padding: '0', 
                        borderRadius: '16px', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden',
                        border: '1px solid #f1f5f9'
                    }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, color: '#064e3b', fontSize: '1.25rem', fontWeight: '800' }}>Assigned Staff Members</h2>
                            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                Total Matching: <strong>{officers.filter(off => {
                                    const matchesSearch = off.name.toLowerCase().includes(searchTerm.toLowerCase()) || off.email.toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchesRole = roleFilter === 'ALL' || off.role === roleFilter;
                                    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ALLOCATED' ? off.assignedAsc : !off.assignedAsc);
                                    return matchesSearch && matchesRole && matchesStatus;
                                }).length}</strong>
                            </div>
                        </div>
                        <div className="data-table-container" style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                        <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '28%' }}>Name</th>
                                        <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '22%' }}>Role</th>
                                        <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '25%' }}>Current Region</th>
                                        <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '25%' }}>Reallocate To</th>
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
                                        .map((officer, index) => (
                                            <tr key={officer._id} style={{ 
                                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                                borderBottom: '1px solid #f1f5f9',
                                                transition: 'all 0.2s'
                                            }}>
                                                <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: '800', color: '#111827' }}>{officer.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{officer.email}</div>
                                                </td>
                                                <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: '800', 
                                                        padding: '4px 12px', 
                                                        borderRadius: '9999px', 
                                                        backgroundColor: '#ecfdf5', 
                                                        color: '#065f46',
                                                        border: '1px solid #d1fae5',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {officer.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                                                    {officer.assignedAsc ? (
                                                        <div style={{ color: '#059669', fontWeight: '700' }}>
                                                            📍 {officer.assignedAsc.name}
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>{officer.assignedAsc.district} District</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#9ca3af', fontWeight: '600', fontStyle: 'italic' }}>⚠️ Unallocated</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                                                    <select
                                                        className="form-control"
                                                        value={officer.assignedAsc?._id || ''}
                                                        onChange={(e) => handleAssign(officer._id, e.target.value)}
                                                        style={{ 
                                                            padding: '10px', 
                                                            borderRadius: '8px', 
                                                            border: '1.5px solid #e2e8f0', 
                                                            width: '100%', 
                                                            maxWidth: '240px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            backgroundColor: 'white',
                                                            color: '#374151',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="">-- Unallocate Staff --</option>
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
                                                <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontWeight: '700', fontSize: '1.1rem' }}>
                                                    📭 No officers match the current filters.
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
