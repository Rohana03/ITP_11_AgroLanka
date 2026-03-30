import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './AdminDashboard.css';
import './FarmerPages.css';

const FinancialDashboard = () => {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('loans'); // 'loans', 'compensation', or 'repayments'
    const [interestRate, setInterestRate] = useState(8);
    const [newRate, setNewRate] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loans, setLoans] = useState([]);
    const [compensations, setCompensations] = useState([]);
    const [repayments, setRepayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [selectedRepayment, setSelectedRepayment] = useState(null);
    const [claimUpdateData, setClaimUpdateData] = useState({ status: '', estimatedLoss: '' });

    useEffect(() => {
        fetchInterestRate();
        if (user?.assignedAsc?._id || user?.assignedAsc) {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchLoans(), fetchCompensations(), fetchRepayments()]);
        setLoading(false);
    };

    const fetchInterestRate = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/loans/interest-rate');
            setInterestRate(res.data.rate);
            setNewRate(res.data.rate);
        } catch (err) {
            console.error("Error fetching interest rate:", err);
        }
    };

    const fetchLoans = async () => {
        try {
            const ascId = user.assignedAsc?._id || user.assignedAsc;
            const res = await axios.get(`http://localhost:5000/api/loans?ascId=${ascId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoans(res.data);
        } catch (err) {
            console.error("Error fetching loans:", err);
        }
    };

    const fetchCompensations = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/compensation`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompensations(res.data);
        } catch (err) {
            console.error("Error fetching compensations:", err);
        }
    };

    const fetchRepayments = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/loans/repayments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRepayments(res.data);
        } catch (err) {
            console.error("Error fetching repayments:", err);
        }
    };

    const handleRateUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newRate || isNaN(newRate) || parseFloat(newRate) <= 0) {
            setError('Please enter a valid interest rate.');
            return;
        }

        try {
            const res = await axios.patch('http://localhost:5000/api/loans/interest-rate', {
                rate: parseFloat(newRate)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInterestRate(res.data.rate);
            setSuccess('Interest rate updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update interest rate.');
        }
    };

    const handleLoanStatusUpdate = async (loanId, status) => {
        try {
            await axios.patch(`http://localhost:5000/api/loans/${loanId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLoans(); // Refresh list
        } catch (err) {
            alert('Failed to update loan status.');
        }
    };

    const handleRepaymentVerify = async (id, status, notes = '') => {
        try {
            await axios.patch(`http://localhost:5000/api/loans/repayments/${id}/verify`, {
                status,
                adminNotes: notes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedRepayment(null);
            fetchAllData(); // Refresh all to update loan balances and overdue status
        } catch (err) {
            setError('Failed to update repayment status.');
        }
    };

    const handleClaimClick = (claim) => {
        setSelectedClaim(claim);
        setClaimUpdateData({
            status: claim.status,
            estimatedLoss: claim.estimatedLoss || ''
        });
    };

    const handleClaimUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`http://localhost:5000/api/compensation/${selectedClaim._id}`, claimUpdateData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedClaim(null);
            fetchCompensations();
        } catch (err) {
            setError('Failed to update compensation claim.');
        }
    };

    const getStatusStyle = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'APPROVED': case 'VERIFIED': return { bg: '#ecfdf5', text: '#059669', border: '#d1fae5' };
            case 'PENDING': return { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' };
            case 'REJECTED': case 'OVERDUE': return { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' };
            default: return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
        }
    };

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <style>
                    {`
                        .fin-tab {
                            padding: 12px 28px;
                            border: 1px solid rgba(255,255,255,0.2);
                            background: rgba(255,255,255,0.1);
                            color: white;
                            font-weight: 700;
                            border-radius: 12px;
                            cursor: pointer;
                            transition: all 0.2s;
                            backdrop-filter: blur(8px);
                        }
                        .fin-tab.active { background: #064e3b; color: white; border-color: #064e3b; box-shadow: 0 4px 15px rgba(6, 78, 59, 0.4); }
                        .fin-tab:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); }
                        .fin-row { transition: all 0.2s ease; cursor: default; }
                        .fin-row:hover { background-color: #f0fdf4 !important; }
                        
                        .progress-bar-container {
                            width: 100%;
                            background: #e2e8f0;
                            height: 10px;
                            border-radius: 20px;
                            overflow: hidden;
                            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
                            position: relative;
                        }

                        .progress-bar-fill {
                            height: 100%;
                            border-radius: 20px;
                            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
                            background: linear-gradient(90deg, #10b981, #059669);
                        }

                        .progress-bar-fill.overdue {
                            background: linear-gradient(90deg, #ef4444, #dc2626);
                        }

                        .id-badge {
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                            padding: 2px 8px;
                            background: #f1f5f9;
                            color: #475569;
                            border-radius: 6px;
                            font-size: 0.7rem;
                            font-weight: 700;
                            border: 1px solid #e2e8f0;
                        }
                    `}
                </style>

                <header className="dashboard-header">
                    <div className="header-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1e3a8a' }}>Financial Oversight 💰</h1>
                            <span className="role-badge" style={{ backgroundColor: '#15803d', color: 'white', padding: '4px 12px' }}>
                                ASC FINANCIALS
                            </span>
                        </div>
                        <p className="welcome-text" style={{ fontSize: '1.2rem', margin: 0 }}>
                            Welcome back, <strong style={{ color: '#15803d' }}>{user?.name}</strong>! Regional financial systems are operational.
                        </p>
                    </div>

                    <div className="header-right">
                        {user?.assignedAsc ? (
                            <div style={{ padding: '16px 24px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <div style={{ color: '#166534', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 ASSIGNED CENTER</div>
                                <div style={{ color: '#14532d', fontSize: '1.1rem', fontWeight: 'bold' }}>{user.assignedAsc.name}</div>
                                <div style={{ color: '#166534', fontSize: '0.9rem' }}>{user.assignedAsc.district} District</div>
                            </div>
                        ) : (
                            <div style={{ padding: '12px 20px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                <span style={{ color: '#9a3412', fontWeight: '600' }}>⚠️ NO CENTER ALLOCATED</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Quick Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="card-icon">💳</div>
                        <div className="stat-label">Active Loans</div>
                        <div className="stat-value">{loans.length} <span style={{ fontSize: '1rem', fontWeight: '600', color: '#9ca3af' }}>Cases</span></div>
                    </div>
                    <div className="stat-card" style={{ borderTop: '4px solid #dc2626' }}>
                        <div className="card-icon">⚠️</div>
                        <div className="stat-label">Overdue</div>
                        <div className="stat-value" style={{ color: '#dc2626' }}>{loans.filter(l => l.isOverdue).length} <span style={{ fontSize: '1rem', fontWeight: '600', color: '#9ca3af' }}>Users</span></div>
                    </div>
                    <div className="stat-card">
                        <div className="card-icon">📊</div>
                        <div className="stat-label">Interest Rate</div>
                        <div className="stat-value">{interestRate}%</div>
                        <form onSubmit={handleRateUpdate} style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                             <input type="number" step="0.1" value={newRate} onChange={(e) => setNewRate(e.target.value)} style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }} />
                             <button type="submit" className="btn-sm" style={{ width: 'auto', background: '#064e3b', color: 'white' }}>UPDATE</button>
                        </form>
                    </div>
                    <div className="stat-card">
                        <div className="card-icon">🧾</div>
                        <div className="stat-label">Repayments</div>
                        <div className="stat-value" style={{ color: '#166534' }}>{repayments.filter(r => r.status === 'PENDING').length} <span style={{ fontSize: '1rem', fontWeight: '600', color: '#9ca3af' }}>Pending</span></div>
                    </div>
                </div>

                <div className="tabs" style={{ marginBottom: '0', display: 'flex', gap: '10px' }}>
                    <button className={`fin-tab ${activeTab === 'loans' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>💳 Loan Applications</button>
                    <button className={`fin-tab ${activeTab === 'repayments' ? 'active' : ''}`} onClick={() => setActiveTab('repayments')}>🧾 Repayment Proofs</button>
                    <button className={`fin-tab ${activeTab === 'compensation' ? 'active' : ''}`} onClick={() => setActiveTab('compensation')}>📋 Compensation Claims</button>
                </div>

                <div className="data-section dashboard-panel" style={{
                    marginTop: '30px', padding: '0', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#064e3b' }}>
                                    <th style={{ padding: '22px 24px', textAlign: 'left', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '28%', color: 'white' }}>Farmer</th>
                                    {activeTab === 'loans' && (
                                        <>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '18%', color: 'white' }}>Principal</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '22%', color: 'white' }}>Repayment Progress</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '17%', color: 'white' }}>Status</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '15%', color: 'white' }}>Actions</th>
                                        </>
                                    )}
                                    {activeTab === 'repayments' && (
                                        <>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '20%', color: 'white' }}>Installment</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '20%', color: 'white' }}>Date Paid</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '17%', color: 'white' }}>Status</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '15%', color: 'white' }}>Verification</th>
                                        </>
                                    )}
                                    {activeTab === 'compensation' && (
                                        <>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '20%', color: 'white' }}>Affected Crop</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '20%', color: 'white' }}>Damage Type</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '17%', color: 'white' }}>Status</th>
                                            <th style={{ padding: '22px 24px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', width: '15%', color: 'white' }}>Process</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', fontWeight: '800', color: '#059669', fontSize: '1.2rem' }}>🔄 Loading regional financial data...</td></tr>
                                ) : (activeTab === 'loans' ? loans : activeTab === 'repayments' ? repayments : compensations).length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#9ca3af', fontWeight: '700', fontSize: '1.2rem' }}>📭 No data found for this category.</td></tr>
                                ) : (activeTab === 'loans' ? loans : activeTab === 'repayments' ? repayments : compensations).map((item, index) => {
                                    const displayStatus = (item.isOverdue && activeTab === 'loans') ? 'OVERDUE' : item.status;
                                    const status = getStatusStyle(displayStatus);
                                    
                                    return (
                                        <tr key={item._id} className="fin-row" style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '20px 24px', textAlign: 'left' }}>
                                                <div style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>{item.farmer?.name || 'Unknown Farmer'}</div>
                                                <div style={{ marginTop: '4px' }}>
                                                    <span className="id-badge">🆔 {item.farmer?.nic || 'N/A'}</span>
                                                </div>
                                            </td>
                                            
                                            {activeTab === 'loans' && (
                                                <>
                                                    <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '800', color: '#111827' }}>LKR {(item.amount || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                        <div className="progress-bar-container">
                                                            <div 
                                                                className={`progress-bar-fill ${item.isOverdue ? 'overdue' : ''}`}
                                                                style={{ width: `${Math.min(100, (item.totalPaid / (item.totalPayable || item.amount)) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', marginTop: '8px', fontWeight: '800', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>LKR {item.totalPaid?.toLocaleString()}</span>
                                                            <span>{(item.totalPayable || item.amount)?.toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            
                                            {activeTab === 'repayments' && (
                                                <>
                                                    <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '800', color: '#059669' }}>LKR {(item.amount || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '600', color: '#4b5563' }}>{new Date(item.paymentDate).toLocaleDateString()}</td>
                                                </>
                                            )}
                                            
                                            {activeTab === 'compensation' && (
                                                <>
                                                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                        <div style={{ fontWeight: '700', color: '#111827' }}>{item.crop?.cropType}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.crop?.variety}</div>
                                                    </td>
                                                    <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '700', color: '#dc2626' }}>{item.damageType}</td>
                                                </>
                                            )}

                                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                <span className="status-badge-fin" style={{ backgroundColor: status.bg, color: status.text, borderColor: status.border }}>
                                                    {displayStatus}
                                                </span>
                                            </td>
                                            
                                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                {activeTab === 'loans' && item.status === 'PENDING' && (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleLoanStatusUpdate(item._id, 'APPROVED')} style={{ padding: '8px 14px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.7rem' }}>APPROVE</button>
                                                        <button onClick={() => handleLoanStatusUpdate(item._id, 'REJECTED')} style={{ padding: '8px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.7rem' }}>REJECT</button>
                                                    </div>
                                                )}
                                                {activeTab === 'repayments' && (
                                                    <button onClick={() => setSelectedRepayment(item)} style={{ padding: '8px 16px', background: 'white', color: '#064e3b', border: '2px solid #064e3b', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.7rem' }}>VIEW PROOF</button>
                                                )}
                                                {activeTab === 'compensation' && (
                                                    <button onClick={() => handleClaimClick(item)} style={{ padding: '8px 16px', background: 'white', color: '#064e3b', border: '2px solid #064e3b', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.7rem' }}>PROCESS</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals Refined */}
                {selectedRepayment && (
                    <div className="modal-overlay">
                        <div className="modal-container">
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                                <h2 style={{ margin: 0, color: '#064e3b', fontWeight: '900' }}>Verify Repayment Proof</h2>
                                <button onClick={() => setSelectedRepayment(null)} style={{ border: 'none', background: 'none', fontSize: '32px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                <div>
                                    <h4 style={{ textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>Payment Details</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>FARMER</div>
                                            <div style={{ fontWeight: '800', color: '#1e293b' }}>{selectedRepayment.farmer?.name}</div>
                                        </div>
                                        <div style={{ padding: '15px', background: '#ecfdf5', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#059669' }}>AMOUNT PAID</div>
                                            <div style={{ fontWeight: '900', color: '#064e3b', fontSize: '1.2rem' }}>LKR {selectedRepayment.amount?.toLocaleString()}</div>
                                        </div>
                                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>DATE</div>
                                            <div style={{ fontWeight: '800', color: '#1e293b' }}>{new Date(selectedRepayment.paymentDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    
                                    {selectedRepayment.status === 'PENDING' ? (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                            <button onClick={() => handleRepaymentVerify(selectedRepayment._id, 'VERIFIED')} style={{ flex: 1, padding: '14px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem' }}>✅ CONFIRM</button>
                                            <button onClick={() => handleRepaymentVerify(selectedRepayment._id, 'REJECTED')} style={{ flex: 1, padding: '14px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem' }}>❌ REJECT</button>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '30px', textAlign: 'center', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '12px', fontWeight: '800', color: '#475569' }}>
                                            VERIFICATION STATUS: {selectedRepayment.status}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>Document Preview</h4>
                                    <div style={{ marginTop: '15px', border: '2px dashed #e2e8f0', borderRadius: '15px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {selectedRepayment.receiptImage.toLowerCase().endsWith('.pdf') ? (
                                            <iframe src={`http://localhost:5000/${selectedRepayment.receiptImage.replace(/\\/g, '/')}`} width="100%" height="100%" />
                                        ) : (
                                            <img src={`http://localhost:5000/${selectedRepayment.receiptImage.replace(/\\/g, '/')}`} alt="Payment Slip" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        )}
                                    </div>
                                    <a href={`http://localhost:5000/${selectedRepayment.receiptImage.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '15px', color: '#059669', fontWeight: '700', textDecoration: 'none' }}>Open Full Document ↗</a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Compensation Modal Refined */}
                {selectedClaim && (
                    <div className="modal-overlay">
                        <div className="modal-container" style={{ maxWidth: '900px' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                                <h2 style={{ margin: 0, color: '#064e3b', fontWeight: '900' }}>Process Compensation Claim</h2>
                                <button onClick={() => setSelectedClaim(null)} style={{ border: 'none', background: 'none', fontSize: '32px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                <div>
                                    <h4 style={{ textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>Assessment Form</h4>
                                    <form onSubmit={handleClaimUpdateSubmit} style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#4b5563', marginBottom: '8px' }}>ESTIMATED LOSS (LKR) *</label>
                                            <input type="number" value={claimUpdateData.estimatedLoss} onChange={(e) => setClaimUpdateData({ ...claimUpdateData, estimatedLoss: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontWeight: '700' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#4b5563', marginBottom: '8px' }}>DECISION *</label>
                                            <select value={claimUpdateData.status} onChange={(e) => setClaimUpdateData({ ...claimUpdateData, status: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontWeight: '700', cursor: 'pointer' }}>
                                                <option value="PENDING">Keep Pending</option>
                                                <option value="APPROVED">Approve Claim</option>
                                                <option value="REJECTED">Reject Claim</option>
                                            </select>
                                        </div>
                                        <button type="submit" style={{ padding: '15px', background: '#064e3b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' }}>UPDATE DECISION</button>
                                    </form>
                                    <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Farmer Statement</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic', color: '#4b5563', lineHeight: '1.6' }}>"{selectedClaim.damageDescription}"</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>Damage Evidence</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '15px' }}>
                                        {selectedClaim.evidenceFiles?.map((file, idx) => (
                                            <a key={idx} href={`http://localhost:5000/${file.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" style={{ border: '2px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {file.toLowerCase().endsWith('.pdf') ? <div style={{ fontWeight: '800', color: '#ef4444' }}>PDF</div> : <img src={`http://localhost:5000/${file.replace(/\\/g, '/')}`} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                            </a>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '20px', padding: '20px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#991b1b' }}>REPORTED DAMAGE</div>
                                        <div style={{ fontWeight: '900', color: '#7f1d1d', fontSize: '1.1rem' }}>{selectedClaim.damageType}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '4px' }}><strong>Area:</strong> {selectedClaim.affectedArea} Acres</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialDashboard;
