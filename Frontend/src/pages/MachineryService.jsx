import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerPages.css';

const MachineryService = () => {
    const { user, token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('request-machinery'); // 'request-machinery', 'request-service', 'rent-out'
    const [availableMachinery, setAvailableMachinery] = useState([]);
    const [communityRentals, setCommunityRentals] = useState([]);
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

    // Pre-fill location from user's ASC center once user loads
    useEffect(() => {
        if (user) {
            const ascLocation = user.assignedAsc
                ? `${user.assignedAsc.name}${user.assignedAsc.district ? ', ' + user.assignedAsc.district + ' District' : ''}`
                : '';
            setMachineryForm(prev => ({ ...prev, location: ascLocation }));
            setServiceForm(prev => ({ ...prev, location: ascLocation }));
            if (user.phone) {
                setRentalForm(prev => ({ ...prev, contactNumber: user.phone }));
            }
        }
    }, [user]);

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
            fetchCommunityRentals();
        }
    }, [user, token]);

    const fetchCommunityRentals = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/machinery/community-rentals', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommunityRentals(res.data);
        } catch (err) {
            console.error("Error fetching community rentals:", err);
        }
    };

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
            setSuccess(t('farmer_machinery.successMachinery'));
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
            setSuccess(t('farmer_machinery.successService'));
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
            setSuccess(t('farmer_machinery.successRental'));
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
                        ← {t('farmer_machinery.backToDashboard')}
                    </button>
                    <h1>🚜 {t('farmer_machinery.title')}</h1>
                    <p>{t('farmer_machinery.subtitle')}</p>
                </div>

                {/* Tab Navigation */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'request-machinery' ? 'active' : ''}`}
                        onClick={() => setActiveTab('request-machinery')}
                    >
                        🏗️ {t('farmer_machinery.tabReqMachinery')}
                    </button>
                    <button
                        className={`tab ${activeTab === 'request-service' ? 'active' : ''}`}
                        onClick={() => setActiveTab('request-service')}
                    >
                        📅 {t('farmer_machinery.tabReqServices')}
                    </button>
                    <button
                        className={`tab ${activeTab === 'rent-out' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rent-out')}
                    >
                        💰 {t('farmer_machinery.tabRentMine')}
                    </button>
                    <button
                        className={`tab ${activeTab === 'community-marketplace' ? 'active' : ''}`}
                        onClick={() => setActiveTab('community-marketplace')}
                    >
                        🤝 {t('farmer_machinery.tabCommunity')}
                    </button>
                </div>

                {success && <div className="alert-success">{success}</div>}
                {error && <div className="alert-error">{error}</div>}

                {/* Forms Section */}
                <div className="form-card">
                    {activeTab === 'request-machinery' && (
                        <form onSubmit={handleMachinerySubmit}>
                            <h2>{t('farmer_machinery.ascHeader')}</h2>
                            <p className="section-desc">{t('farmer_machinery.ascDesc')}</p>

                            <div className="form-group">
                                <label>Selection Available Machinery *</label>
                                <select
                                    value={machineryForm.machineryId}
                                    onChange={(e) => setMachineryForm({ ...machineryForm, machineryId: e.target.value })}
                                    required
                                >
                                    <option value="">{t('farmer_machinery.selectMachinery')}</option>
                                    {availableMachinery.map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.type})</option>
                                    ))}
                                </select>
                                {availableMachinery.length === 0 && <small style={{ color: '#ef4444' }}>No machinery currently available in your ASC.</small>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('farmer_machinery.reqDate')} *</label>
                                    <input type="date" value={machineryForm.requestDate} onChange={(e) => setMachineryForm({ ...machineryForm, requestDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>{t('farmer_machinery.duration')} *</label>
                                    <select value={machineryForm.duration} onChange={(e) => setMachineryForm({ ...machineryForm, duration: e.target.value })} required>
                                        <option value="">{t('farmer_machinery.selectDuration')}</option>
                                        <option value="Half Day">{t('farmer_machinery.halfDay')}</option>
                                        <option value="Full Day">{t('farmer_machinery.fullDay')}</option>
                                        <option value="2 Days">2 {t('farmer_finance.tableDate')}</option>
                                        <option value="3 Days">3 {t('farmer_finance.tableDate')}</option>
                                        <option value="1 Week">{t('farmer_machinery.oneWeek')}</option>
                                        <option value="Custom">{t('common.other')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Land Size (Acres) *</label>
                                    <input type="number" step="0.1" value={machineryForm.landSize} onChange={(e) => setMachineryForm({ ...machineryForm, landSize: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>📍 {t('farmer_machinery.location')} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '400' }}>(Auto-filled from your ASC center)</span></label>
                                    <input
                                        type="text"
                                        value={machineryForm.location}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
                                    />
                                    {user?.assignedAsc && (
                                        <small style={{ color: '#10b981', marginTop: '4px', display: 'block' }}>
                                            🏛️ {user.assignedAsc.name}{user.assignedAsc.district ? ' — ' + user.assignedAsc.district + ' District' : ''}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t('farmer_machinery.addNotes')}</label>
                                <textarea value={machineryForm.additionalNotes} onChange={(e) => setMachineryForm({ ...machineryForm, additionalNotes: e.target.value })} rows="3"></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary">{t('farmer_machinery.submitRequest')}</button>
                        </form>
                    )}

                    {activeTab === 'request-service' && (
                        <form onSubmit={handleServiceSubmit}>
                            <h2>Request Agricultural Services</h2>
                            <p className="section-desc">Request tractor services, labor, or technical assistance</p>

                            <div className="form-group">
                                <label>Service Type *</label>
                                <select value={serviceForm.serviceType} onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })} required>
                                    <option value="">{t('farmer_machinery.selectService')}</option>
                                    <option value="Machinery Rental">{t('farmer_machinery.machineryRental')}</option>
                                    <option value="Machinery with Operator">{t('farmer_machinery.machineryOperator')}</option>
                                    <option value="Custom Farming Service">{t('farmer_machinery.customFarming')}</option>
                                    <option value="Equipment Maintenance">{t('farmer_machinery.maintenance')}</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Preferred Date *</label>
                                    <input type="date" value={serviceForm.requestDate} onChange={(e) => setServiceForm({ ...serviceForm, requestDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>📍 {t('farmer_machinery.location')} <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '400' }}>(Auto-filled from your ASC center)</span></label>
                                    <input
                                        type="text"
                                        value={serviceForm.location}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
                                    />
                                    {user?.assignedAsc && (
                                        <small style={{ color: '#10b981', marginTop: '4px', display: 'block' }}>
                                            🏛️ {user.assignedAsc.name}{user.assignedAsc.district ? ' — ' + user.assignedAsc.district + ' District' : ''}
                                        </small>
                                    )}
                                </div>
                            </div>

                             <div className="form-group">
                                 <label>{t('farmer_machinery.serviceDescNeeded')} *</label>
                                 <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows="4" required></textarea>
                             </div>
 
                             <button type="submit" className="btn btn-primary">{t('farmer_machinery.submitService')}</button>
                        </form>
                    )}

                    {activeTab === 'rent-out' && (
                        <form onSubmit={handleRentalSubmit}>
                            <h2>{t('farmer_machinery.rentOutHeader')}</h2>
                            <p className="section-desc">{t('farmer_machinery.rentOutDesc')}</p>

                            <div className="form-group">
                                <label>{t('farmer_machinery.machineryType')} *</label>
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
                                    <label>{t('farmer_machinery.rentPerDay')} (LKR) *</label>
                                    <input type="number" value={rentalForm.rentPerDay} onChange={(e) => setRentalForm({ ...rentalForm, rentPerDay: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>{t('farmer_machinery.contactNum')} * <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '400' }}>(Auto-filled, you can edit)</span></label>
                                    <input
                                        type="text"
                                        value={rentalForm.contactNumber}
                                        onChange={(e) => setRentalForm({ ...rentalForm, contactNumber: e.target.value })}
                                        required
                                    />
                                    {user?.phone && (
                                        <small style={{ color: '#3b82f6', marginTop: '4px', display: 'block' }}>📱 Pre-filled from your profile</small>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t('farmer_market.description')} *</label>
                                <textarea value={rentalForm.description} onChange={(e) => setRentalForm({ ...rentalForm, description: e.target.value })} rows="3" placeholder={t('farmer_machinery.descPlaceholder')} required></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary">{t('farmer_machinery.listMachinery')}</button>
                        </form>
                    )}

                    {activeTab === 'community-marketplace' && (
                        <div>
                            <h2>🤝 Community Marketplace</h2>
                            <p className="section-desc">Rent machinery from other farmers in your local ASC area</p>

                            {communityRentals.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🌾</div>
                                    <p>No community machinery listed in your area yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                    {communityRentals.map(rental => (
                                        <div key={rental._id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <h4 style={{ margin: 0, color: '#1e293b' }}>{rental.machineryType}</h4>
                                                <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{t('farmer_machinery.available')}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                                                <div>👤 <strong>{rental.farmer?.name}</strong></div>
                                                <div>📞 <strong>{rental.contactNumber}</strong></div>
                                                <div style={{ marginTop: '8px', color: '#166534', fontWeight: '700', fontSize: '1.05rem' }}>LKR {rental.rentPerDay?.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: '400' }}>/ {t('farmer_finance.tableDate')}</span></div>
                                                <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>"{rental.description}"</div>
                                            </div>
                                            <button
                                                onClick={() => window.location.href = `tel:${rental.contactNumber}`}
                                                style={{ width: '100%', marginTop: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                📞 {t('farmer_machinery.callFarmer')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="history-section" style={{ marginTop: '40px' }}>
                    <h2>📜 {t('farmer_machinery.myHistory')}</h2>
                    <div className="form-card" style={{ padding: '20px' }}>
                        {loading ? <p>{t('farmer_machinery.loadingHistory')}</p> : (
                            <div>
                                {activeTab === 'request-machinery' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <h4>{t('farmer_machinery.reqMachinery')}</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.machinery')}</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.requestDate')}</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.status')}</th>
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
                                                {history.machineryRequests.length === 0 && <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>{t('farmer_machinery.noRequests')}</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'request-service' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <h4>{t('farmer_machinery.reqServices')}</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.service')}</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.requestDate')}</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.status')}</th>
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
                                                {history.serviceRequests.length === 0 && <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>{t('farmer_machinery.noRequests')}</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'rent-out' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <h4>{t('farmer_machinery.rentMine')}</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.machinery')}</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.rentPerDay')}</th>
                                                    <th style={{ padding: '10px', textAlign: 'left' }}>{t('farmer_machinery.status')}</th>
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
                                                {history.myRentals.length === 0 && <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>{t('farmer_machinery.noListings')}</td></tr>}
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
