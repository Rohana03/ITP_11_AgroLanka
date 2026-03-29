import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import '../AdminDashboard.css'; // Reusing dashboard styles for consistency

const ManageASC = () => {
    const { token } = useAuth();
    const [ascs, setAscs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');

    useEffect(() => {
        fetchASCs();
    }, []);

    const fetchASCs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/ascs');
            const data = await response.json();
            setAscs(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching ASCs:', error);
            setLoading(false);
        }
    };

    // Get unique districts for filter
    const districts = [...new Set(ascs.map(asc => asc.district))].sort();

    const filteredASCs = ascs.filter(asc => {
        const matchesSearch = asc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asc.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDistrict = filterDistrict ? asc.district === filterDistrict : true;
        return matchesSearch && matchesDistrict;
    });

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Manage Agrarian Service Centers</h1>
                        <p className="welcome-text">View and manage ASC capabilities and assigned staff</p>
                    </div>
                </header>

                <div className="dashboard-content">
                    {/* Search and Filters with explicit background */}
                    <div className="dashboard-section" style={{ 
                        backgroundColor: '#fff', 
                        padding: '24px', 
                        borderRadius: '16px', 
                        marginBottom: '24px', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: '2', minWidth: '300px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px', display: 'block' }}>Search Centers</label>
                            <input
                                type="text"
                                placeholder="Search by Name or Code..."
                                className="form-control"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px', display: 'block' }}>Filter by District</label>
                            <select
                                className="form-control"
                                value={filterDistrict}
                                onChange={(e) => setFilterDistrict(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                            >
                                <option value="">All Districts</option>
                                {districts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="dashboard-section" style={{ backgroundColor: '#fff', padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
                            <p>Loading Agrarian Service Centers...</p>
                        </div>
                    ) : (
                        <div className="dashboard-section" style={{ 
                            backgroundColor: '#fff', 
                            padding: '24px', 
                            borderRadius: '16px', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div className="data-table-container" style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                            <th style={{ padding: '16px', color: '#1e293b', fontWeight: '700' }}>Code</th>
                                            <th style={{ padding: '16px', color: '#1e293b', fontWeight: '700' }}>Name</th>
                                            <th style={{ padding: '16px', color: '#1e293b', fontWeight: '700' }}>District</th>
                                            <th style={{ padding: '16px', color: '#1e293b', fontWeight: '700' }}>Assigned Officers</th>
                                            <th style={{ padding: '16px', color: '#1e293b', fontWeight: '700' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredASCs.length > 0 ? (
                                            filteredASCs.map(asc => (
                                                <tr key={asc._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px', fontWeight: '600', color: '#2563eb' }}>{asc.code}</td>
                                                    <td style={{ padding: '16px', fontWeight: '500', color: '#1e293b' }}>{asc.name}</td>
                                                    <td style={{ padding: '16px', color: '#64748b' }}>{asc.district}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        {asc.assignedOfficers && asc.assignedOfficers.length > 0 ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {asc.assignedOfficers.map(off => (
                                                                    <span key={off._id} className="badge badge-info" style={{
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: '600',
                                                                        backgroundColor: '#eff6ff',
                                                                        color: '#1d4ed8',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '9999px',
                                                                        border: '1px solid #dbeafe'
                                                                    }}>
                                                                        {off.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No staff assigned</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <button 
                                                            className="btn-outline" 
                                                            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                                    No ASCs found matching criteria
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Showing {filteredASCs.length} center(s)</span>
                                <span style={{ fontWeight: '500' }}>Total: {ascs.length} records</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageASC;
