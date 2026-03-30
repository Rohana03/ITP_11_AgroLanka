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
                        <div className="dashboard-section" style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '60px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <p style={{ color: '#059669', fontWeight: '700', fontSize: '1.1rem' }}>🔄 Loading Agrarian Service Centers...</p>
                        </div>
                    ) : (
                        <div className="dashboard-section" style={{ 
                            backgroundColor: 'white', 
                            padding: '0', 
                            borderRadius: '16px', 
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            overflow: 'hidden',
                            border: '1px solid #f1f5f9'
                        }}>
                            <div className="data-table-container" style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                            <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '12%' }}>Code</th>
                                            <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '25%' }}>Name</th>
                                            <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '15%' }}>District</th>
                                            <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '35%' }}>Assigned Officers</th>
                                            <th style={{ padding: '20px 16px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '13%' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredASCs.length > 0 ? (
                                            filteredASCs.map((asc, index) => (
                                                <tr key={asc._id} style={{ 
                                                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <td style={{ padding: '18px 16px', fontWeight: '800', color: '#059669', textAlign: 'center' }}>{asc.code}</td>
                                                    <td style={{ padding: '18px 16px', fontWeight: '700', color: '#111827', textAlign: 'center' }}>{asc.name}</td>
                                                    <td style={{ padding: '18px 16px', color: '#4b5563', fontWeight: '600', textAlign: 'center' }}>{asc.district}</td>
                                                    <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                                                        {asc.assignedOfficers && asc.assignedOfficers.length > 0 ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                                                {asc.assignedOfficers.map(off => (
                                                                    <span key={off._id} style={{
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: '700',
                                                                        backgroundColor: '#ecfdf5',
                                                                        color: '#065f46',
                                                                        padding: '4px 12px',
                                                                        borderRadius: '9999px',
                                                                        border: '1px solid #d1fae5'
                                                                    }}>
                                                                        👨‍💼 {off.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>No staff assigned</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                                                        <button 
                                                            className="btn-outline" 
                                                            style={{ 
                                                                fontSize: '0.75rem', 
                                                                padding: '8px 16px',
                                                                borderRadius: '8px',
                                                                fontWeight: '700',
                                                                backgroundColor: 'white',
                                                                color: '#064e3b',
                                                                border: '1.5px solid #064e3b'
                                                            }}
                                                        >
                                                            View Meta
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontWeight: '600', fontSize: '1.1rem' }}>
                                                    📭 No ASCs found matching criteria
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ padding: '20px 32px', backgroundColor: '#f9fafb', color: '#6b7280', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
                                <span>Showing <strong>{filteredASCs.length}</strong> center(s)</span>
                                <span>Database Total: <strong>{ascs.length}</strong> records</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageASC;
