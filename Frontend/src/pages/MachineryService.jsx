import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerPages.css';

const MachineryService = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('request-machinery'); // 'request-machinery', 'request-service', 'rent-out'
    const [availableMachinery, setAvailableMachinery] = useState([]);
    const [history, setHistory] = useState({ machineryRequests: [], serviceRequests: [], myRentals: [] });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form states
    const [machineryForm, setMachineryForm] = useState({
        machineryId: '',
        requestDate: '',
        duration: '',
        landSize: '',
        location: '',
        additionalNotes: ''
    });

    const [serviceForm, setServiceForm] = useState({
        serviceType: '',
        requestDate: '',
        location: '',
        description: ''
    });

    const [rentalForm, setRentalForm] = useState({
        machineryType: '',
        description: '',
        rentPerDay: '',
        contactNumber: ''
    });

    useEffect(() => {
        if (user && token) {
            fetchAvailableMachinery();
            fetchHistory();
        }
    }, [user, token]);

    const fetchAvailableMachinery = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/machinery/available', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableMachinery(res.data);
        } catch (err) {
            console.error("Error fetching machinery:", err);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/machinery/my-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMachinerySubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        try {
            await axios.post('http://localhost:5000/api/machinery/requests', machineryForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Machinery request submitted successfully!');
            setMachineryForm({ machineryId: '', requestDate: '', duration: '', landSize: '', location: '', additionalNotes: '' });
            fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        try {
            await axios.post('http://localhost:5000/api/machinery/services', serviceForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Service request submitted successfully!');
            setServiceForm({ serviceType: '', requestDate: '', location: '', description: '' });
            fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        }
    };

    const handleRentalSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        try {
            await axios.post('http://localhost:5000/api/machinery/rent-out', rentalForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Machinery listed for rent successfully!');
            setRentalForm({ machineryType: '', description: '', rentPerDay: '', contactNumber: '' });
            fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to list machinery');
        }
    };

    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>🚜 Machinery & Services</h1>
                    <p>Request agricultural machinery, services, or rent out your own equipment</p>
                </div>

                {/* Tab Navigation */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'request-machinery' ? 'active' : ''}`}
                        onClick={() => setActiveTab('request-machinery')}
                    >
                        🏗️ Request Machinery
                    </button>
                    <button
                        className={`tab ${activeTab === 'request-service' ? 'active' : ''}`}
                        onClick={() => setActiveTab('request-service')}
                    >
                        📅 Request Services
                    </button>
                    <button
                        className={`tab ${activeTab === 'rent-out' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rent-out')}
                    >
                        💰 Rent My Machinery
                    </button>
                </div>

                {success && <div className="alert-success">{success}</div>}
                {error && <div className="alert-error">{error}</div>}

                {/* Forms Section */}
                <div className="form-card">
                    {activeTab === 'request-machinery' && (
                        <form onSubmit={handleMachinerySubmit}>
                            <h2>Request Machinery from ASC</h2>
                            <p className="section-desc">Rent government-owned machinery for your farming needs</p>

                            <div className="form-group">
                                <label>Selection Available Machinery *</label>
                                <select
                                    value={machineryForm.machineryId}
                                    onChange={(e) => setMachineryForm({ ...machineryForm, machineryId: e.target.value })}
                                    required
                                >
                                    <option value="">Select machinery</option>
                                    {availableMachinery.map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.type})</option>
                                    ))}
                                </select>
                                {availableMachinery.length === 0 && <small style={{ color: '#ef4444' }}>No machinery currently available in your ASC.</small>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Request Date *</label>
                                    <input type="date" value={machineryForm.requestDate} onChange={(e) => setMachineryForm({ ...machineryForm, requestDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Duration *</label>
                                    <select value={machineryForm.duration} onChange={(e) => setMachineryForm({ ...machineryForm, duration: e.target.value })} required>
                                        <option value="">Select duration</option>
                                        <option value="Half Day">Half Day</option>
                                        <option value="Full Day">Full Day</option>
                                        <option value="2 Days">2 Days</option>
                                        <option value="3 Days">3 Days</option>
                                        <option value="1 Week">1 Week</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Land Size (Acres) *</label>
                                    <input type="number" step="0.1" value={machineryForm.landSize} onChange={(e) => setMachineryForm({ ...machineryForm, landSize: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Location *</label>
                                    <input type="text" value={machineryForm.location} onChange={(e) => setMachineryForm({ ...machineryForm, location: e.target.value })} placeholder="e.g. North Field" required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea value={machineryForm.additionalNotes} onChange={(e) => setMachineryForm({ ...machineryForm, additionalNotes: e.target.value })} rows="3"></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary">Submit Machinery Request</button>
                        </form>
                    )}

                    {activeTab === 'request-service' && (
                        <form onSubmit={handleServiceSubmit}>
                            <h2>Request Agricultural Services</h2>
                            <p className="section-desc">Request tractor services, labor, or technical assistance</p>

                            <div className="form-group">
                                <label>Service Type *</label>
                                <select value={serviceForm.serviceType} onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })} required>
                                    <option value="">Select service</option>
                                    <option value="Machinery Rental">Machinery Rental</option>
                                    <option value="Machinery with Operator">Machinery with Operator</option>
                                    <option value="Custom Farming Service">Custom Farming Service</option>
                                    <option value="Equipment Maintenance">Equipment Maintenance</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Preferred Date *</label>
                                    <input type="date" value={serviceForm.requestDate} onChange={(e) => setServiceForm({ ...serviceForm, requestDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Location *</label>
                                    <input type="text" value={serviceForm.location} onChange={(e) => setServiceForm({ ...serviceForm, location: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description of Service Needed *</label>
                                <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows="4" required></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary">Submit Service Request</button>
                        </form>
                    )}

                    {activeTab === 'rent-out' && (
                        <form onSubmit={handleRentalSubmit}>
                            <h2>Rent My Machinery</h2>
                            <p className="section-desc">Earn extra income by renting out your equipment to fellow farmers</p>

                            <div className="form-group">
                                <label>Machinery Type *</label>
                                <select value={rentalForm.machineryType} onChange={(e) => setRentalForm({ ...rentalForm, machineryType: e.target.value })} required>
                                    <option value="">Select machinery</option>
                                    <option value="Tractor">Tractor</option>
                                    <option value="Harvester">Harvester</option>
                                    <option value="Plough">Plough</option>
                                    <option value="Seeder">Seeder</option>
                                    <option value="Sprayer">Sprayer</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Rent Per Day (LKR) *</label>
                                    <input type="number" value={rentalForm.rentPerDay} onChange={(e) => setRentalForm({ ...rentalForm, rentPerDay: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Contact Number *</label>
                                    <input type="text" value={rentalForm.contactNumber} onChange={(e) => setRentalForm({ ...rentalForm, contactNumber: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea value={rentalForm.description} onChange={(e) => setRentalForm({ ...rentalForm, description: e.target.value })} rows="3" placeholder="Condition of machine, inclusion of fuel/operator etc." required></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary">List Machinery for Rent</button>
                        </form>
                    )}
                </div>

                {/* History Section */}
                <div className="history-section" style={{ marginTop: '40px' }}>
                    <h2>📜 My History</h2>
                    <div className="form-card" style={{ padding: '20px' }}>
                        {loading ? <p>Loading history...</p> : (
                            <div>
                                {activeTab === 'request-machinery' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <h4>Machinery Requests</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Machinery</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.machineryRequests.map(r => (
                                                    <tr key={r._id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                        <td style={{ padding: '10px' }}>{r.machinery?.name}</td>
                                                        <td style={{ padding: '10px' }}>{new Date(r.requestDate).toLocaleDateString()}</td>
                                                        <td style={{ padding: '10px' }}>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                                                                backgroundColor: r.status === 'PENDING' ? '#fff7ed' : r.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                                                                color: r.status === 'PENDING' ? '#c2410c' : r.status === 'APPROVED' ? '#15803d' : '#b91c1c'
                                                            }}>{r.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {history.machineryRequests.length === 0 && <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>No requests found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'request-service' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <h4>Service Requests</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Service</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.serviceRequests.map(r => (
                                                    <tr key={r._id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                        <td style={{ padding: '10px' }}>{r.serviceType}</td>
                                                        <td style={{ padding: '10px' }}>{new Date(r.requestDate).toLocaleDateString()}</td>
                                                        <td style={{ padding: '10px' }}>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                                                                backgroundColor: r.status === 'PENDING' ? '#fff7ed' : r.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                                                                color: r.status === 'PENDING' ? '#c2410c' : r.status === 'APPROVED' ? '#15803d' : '#b91c1c'
                                                            }}>{r.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {history.serviceRequests.length === 0 && <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>No requests found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'rent-out' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <h4>My Rentals</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Machinery</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Daily Rent</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.myRentals.map(r => (
                                                    <tr key={r._id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                        <td style={{ padding: '10px' }}>{r.machineryType}</td>
                                                        <td style={{ padding: '10px' }}>LKR {r.rentPerDay}</td>
                                                        <td style={{ padding: '10px' }}>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                                                                backgroundColor: r.status === 'Available' ? '#f0fdf4' : '#fef2f2',
                                                                color: r.status === 'Available' ? '#15803d' : '#b91c1c'
                                                            }}>{r.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {history.myRentals.length === 0 && <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>No listings found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MachineryService;
