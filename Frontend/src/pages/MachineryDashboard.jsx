import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerDashboard.css';

const MachineryDashboard = () => {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('machinery-requests');
    const [data, setData] = useState({ machineryRequests: [], serviceRequests: [], farmerRentals: [], inventory: [] });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Inventory Form
    const [newItem, setNewItem] = useState({ name: '', type: 'Tractor', totalCount: 1 });

    useEffect(() => {
        if (user && token) {
            fetchRegionalData();
        }
    }, [user, token]);

    const fetchRegionalData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/machinery/regional-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error("Error fetching regional data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (type, id, status) => {
        try {
            const endpoint = type === 'machinery' ? `/api/machinery/requests/${id}` : `/api/machinery/services/${id}`;
            await axios.patch(`http://localhost:5000${endpoint}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Status updated successfully!');
            fetchRegionalData();
        } catch (err) {
            setError('Failed to update status');
        }
    };

    const handleAddInventory = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/machinery/inventory', newItem, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Inventory item added!');
            setNewItem({ name: '', type: 'Tractor', totalCount: 1 });
            fetchRegionalData();
        } catch (err) {
            setError('Failed to add inventory');
        }
    };

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>Machinery & Service Dashboard 🚜</h1>
                        <p>Welcome, {user?.name}! Manage equipment and field services.</p>
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

                <div className="tabs" style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #ddd' }}>
                    <button className={`tab ${activeTab === 'machinery-requests' ? 'active' : ''}`} onClick={() => setActiveTab('machinery-requests')} style={{ padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'machinery-requests' ? '2px solid #2e7d32' : 'none', cursor: 'pointer' }}>Machinery Requests</button>
                    <button className={`tab ${activeTab === 'service-requests' ? 'active' : ''}`} onClick={() => setActiveTab('service-requests')} style={{ padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'service-requests' ? '2px solid #2e7d32' : 'none', cursor: 'pointer' }}>Service Requests</button>
                    <button className={`tab ${activeTab === 'farmer-rentals' ? 'active' : ''}`} onClick={() => setActiveTab('farmer-rentals')} style={{ padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'farmer-rentals' ? '2px solid #2e7d32' : 'none', cursor: 'pointer' }}>Farmer Listings</button>
                    <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')} style={{ padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'inventory' ? '2px solid #2e7d32' : 'none', cursor: 'pointer' }}>ASC Inventory</button>
                </div>

                {success && <p style={{ color: 'green' }}>{success}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div className="dashboard-content">
                    {loading ? <p>Loading data...</p> : (
                        <div>
                            {activeTab === 'machinery-requests' && (
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    <thead style={{ backgroundColor: '#f9f9f9' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Farmer</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Machinery</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.machineryRequests.map(req => (
                                            <tr key={req._id}>
                                                <td style={{ padding: '12px' }}>{req.farmer.name}</td>
                                                <td style={{ padding: '12px' }}>{req.machinery?.name}</td>
                                                <td style={{ padding: '12px' }}>{new Date(req.requestDate).toLocaleDateString()}</td>
                                                <td style={{ padding: '12px' }}>{req.status}</td>
                                                <td style={{ padding: '12px' }}>
                                                    {req.status === 'PENDING' && (
                                                        <>
                                                            <button onClick={() => handleStatusUpdate('machinery', req._id, 'APPROVED')} style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Approve</button>
                                                            <button onClick={() => handleStatusUpdate('machinery', req._id, 'REJECTED')} style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {activeTab === 'service-requests' && (
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    <thead style={{ backgroundColor: '#f9f9f9' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Farmer</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Service</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.serviceRequests.map(req => (
                                            <tr key={req._id}>
                                                <td style={{ padding: '12px' }}>{req.farmer.name}</td>
                                                <td style={{ padding: '12px' }}>{req.serviceType}</td>
                                                <td style={{ padding: '12px' }}>{new Date(req.requestDate).toLocaleDateString()}</td>
                                                <td style={{ padding: '12px' }}>{req.status}</td>
                                                <td style={{ padding: '12px' }}>
                                                    {req.status === 'PENDING' && (
                                                        <>
                                                            <button onClick={() => handleStatusUpdate('service', req._id, 'APPROVED')} style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>Approve</button>
                                                            <button onClick={() => handleStatusUpdate('service', req._id, 'REJECTED')} style={{ backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {activeTab === 'farmer-rentals' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                    {data.farmerRentals.map(rental => (
                                        <div key={rental._id} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                            <h4 style={{ margin: '0 0 10px 0' }}>{rental.machineryType}</h4>
                                            <p style={{ margin: '5px 0' }}><strong>Farmer:</strong> {rental.farmer.name}</p>
                                            <p style={{ margin: '5px 0' }}><strong>Rent:</strong> LKR {rental.rentPerDay}/day</p>
                                            <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {rental.contactNumber}</p>
                                            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{rental.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'inventory' && (
                                <div>
                                    <form onSubmit={handleAddInventory} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f1f8f4', borderRadius: '8px', display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Name</label>
                                            <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Type</label>
                                            <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                                <option value="Tractor">Tractor</option>
                                                <option value="Harvester">Harvester</option>
                                                <option value="Plough">Plough</option>
                                                <option value="Seeder">Seeder</option>
                                                <option value="Sprayer">Sprayer</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Count</label>
                                            <input type="number" value={newItem.totalCount} onChange={(e) => setNewItem({ ...newItem, totalCount: e.target.value })} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '80px' }} />
                                        </div>
                                        <button type="submit" style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Add Item</button>
                                    </form>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                        {data.inventory.map(item => (
                                            <div key={item._id} style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', borderLeft: '5px solid #2e7d32', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                <h4 style={{ margin: '0 0 5px 0' }}>{item.name}</h4>
                                                <p style={{ margin: '2px 0', fontSize: '14px' }}>Type: {item.type}</p>
                                                <p style={{ margin: '2px 0', fontSize: '14px' }}>Available: {item.availableCount}/{item.totalCount}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MachineryDashboard;
