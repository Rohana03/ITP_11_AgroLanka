import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import '../AdminDashboard.css'; // Reusing dashboard styles for consistency

const ManageASC = () => {
<<<<<<< HEAD
    const { token } = useAuth();
=======
    useAuth();
>>>>>>> 9b47020 (solved)
    const [ascs, setAscs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');

<<<<<<< HEAD
    useEffect(() => {
        fetchASCs();
    }, []);

    const fetchASCs = async () => {
=======
    const fetchASCs = React.useCallback(async () => {
>>>>>>> 9b47020 (solved)
        try {
            const response = await fetch('http://localhost:5000/api/ascs');
            const data = await response.json();
            setAscs(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching ASCs:', error);
            setLoading(false);
        }
<<<<<<< HEAD
    };
=======
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchASCs();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchASCs]);
>>>>>>> 9b47020 (solved)

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
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <h1>Manage Agrarian Service Centers</h1>
                    <p>View and manage ASC capabilities</p>
                </header>

                <div className="dashboard-actions" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Search by Name or Code..."
                        className="form-control"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 2, padding: '10px' }}
                    />
                    <select
                        className="form-control"
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        style={{ flex: 1, padding: '10px' }}
                    >
                        <option value="">All Districts</option>
                        {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <p>Loading ASCs...</p>
                ) : (
                    <div className="data-table-container" style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#2c3e50', color: 'white', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Code</th>
                                    <th style={{ padding: '12px' }}>Name</th>
                                    <th style={{ padding: '12px' }}>District</th>
<<<<<<< HEAD
                                    <th style={{ padding: '12px' }}>Assigned Staff</th>
=======
>>>>>>> 9b47020 (solved)
                                    <th style={{ padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredASCs.length > 0 ? (
                                    filteredASCs.map(asc => (
                                        <tr key={asc._id} style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={{ padding: '12px' }}>{asc.code}</td>
                                            <td style={{ padding: '12px' }}>{asc.name}</td>
                                            <td style={{ padding: '12px' }}>{asc.district}</td>
                                            <td style={{ padding: '12px' }}>
<<<<<<< HEAD
                                                {asc.assignedOfficers && asc.assignedOfficers.length > 0 ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                        {asc.assignedOfficers.map(off => (
                                                            <span key={off._id} className="badge badge-info" style={{
                                                                fontSize: '0.75rem',
                                                                backgroundColor: '#e3f2fd',
                                                                color: '#0d47a1',
                                                                padding: '2px 8px',
                                                                borderRadius: '10px',
                                                                border: '1px solid #bbdefb'
                                                            }}>
                                                                {off.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '0.85rem' }}>No staff assigned</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <button className="btn-small" style={{ marginRight: '5px' }}>View</button>
=======
                                                <button className="btn-small" style={{ marginRight: '5px' }}>Edit</button>
>>>>>>> 9b47020 (solved)
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
<<<<<<< HEAD
                                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No ASCs found matching criteria</td>
=======
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No ASCs found matching criteria</td>
>>>>>>> 9b47020 (solved)
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '1rem', color: '#666' }}>
                            Showing {filteredASCs.length} of {ascs.length} centers
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageASC;
