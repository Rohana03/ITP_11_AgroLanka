import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerDashboard.css'; // Reusing styles for consistency

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
            setSuccess(`Repayment ${status.toLowerCase()} successfully!`);
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
            setSuccess('Compensation claim updated successfully!');
            setSelectedClaim(null);
            fetchCompensations();
        } catch (err) {
            setError('Failed to update compensation claim.');
        }
    };

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>Financial Officer Dashboard 💰</h1>
                        <p>Welcome, {user?.name}! Manage financial assistance and compensation.</p>
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

                {/* Tab Navigation */}
                <div className="tabs" style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
                    <button
                        className={`tab ${activeTab === 'loans' ? 'active' : ''}`}
                        onClick={() => setActiveTab('loans')}
                        style={{ padding: '10px 20px', border: 'none', background: activeTab === 'loans' ? '#10b981' : '#f3f4f6', color: activeTab === 'loans' ? 'white' : '#374151', borderRadius: '5px 5px 0 0', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        💳 Loan Applications
                    </button>
                    <button
                        className={`tab ${activeTab === 'repayments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('repayments')}
                        style={{ padding: '10px 20px', border: 'none', background: activeTab === 'repayments' ? '#10b981' : '#f3f4f6', color: activeTab === 'repayments' ? 'white' : '#374151', borderRadius: '5px 5px 0 0', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        🧾 Verified Repayments
                    </button>
                    <button
                        className={`tab ${activeTab === 'compensation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('compensation')}
                        style={{ padding: '10px 20px', border: 'none', background: activeTab === 'compensation' ? '#10b981' : '#f3f4f6', color: activeTab === 'compensation' ? 'white' : '#374151', borderRadius: '5px 5px 0 0', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        📋 Compensation Claims
                    </button>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card" style={{ gridColumn: 'span 1' }}>
                        <div className="card-icon">📈</div>
                        <h3>Interest Rate Management</h3>
                        <p>Current Rate: <strong>{interestRate}%</strong></p>

                        <form onSubmit={handleRateUpdate} style={{ marginTop: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    placeholder="Rate (%)"
                                    style={{ width: '80px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                                />
                                <button type="submit" className="btn btn-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>
                                    Update
                                </button>
                            </div>
                            {success && <p style={{ color: '#10b981', marginTop: '10px', fontSize: '12px' }}>{success}</p>}
                            {error && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '12px' }}>{error}</p>}
                        </form>
                    </div>

                    {activeTab === 'loans' ? (
                        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-icon">📁</div>
                            <h3>Loan Applications (Regional)</h3>
                            <p>Requests from your assigned ASC center</p>

                            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                                {loading ? (
                                    <p>Loading applications...</p>
                                ) : loans.length === 0 ? (
                                    <p>No loan applications found.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Farmer</th>
                                                <th style={{ padding: '10px' }}>Amount</th>
                                                <th style={{ padding: '10px' }}>Progress</th>
                                                <th style={{ padding: '10px' }}>Next Due</th>
                                                <th style={{ padding: '10px' }}>Status</th>
                                                <th style={{ padding: '10px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loans.map(loan => (
                                                <tr key={loan._id} style={{
                                                    borderBottom: '1px solid #f9f9f9',
                                                    backgroundColor: loan.isOverdue ? '#fff1f2' : 'transparent'
                                                }}>
                                                    <td style={{ padding: '10px' }}>
                                                        <strong style={{ color: loan.isOverdue ? '#be123c' : 'inherit' }}>
                                                            {loan.farmer?.name} {loan.isOverdue && '(OVERDUE)'}
                                                        </strong><br />
                                                        <small>{loan.farmer?.nic}</small>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>LKR {loan.amount?.toLocaleString()}</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <div style={{ width: '100px', backgroundColor: '#eee', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${Math.min(100, (loan.totalPaid / (loan.totalPayable || loan.amount)) * 100)}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                                                        </div>
                                                        <small>LKR {loan.totalPaid?.toLocaleString()} / {(loan.totalPayable || loan.amount)?.toLocaleString()}</small>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            backgroundColor: loan.status === 'PENDING' ? '#fff7ed' : loan.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                                                            color: loan.status === 'PENDING' ? '#c2410c' : loan.status === 'APPROVED' ? '#15803d' : '#b91c1c'
                                                        }}>
                                                            {loan.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        {loan.status === 'PENDING' && (
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button
                                                                    onClick={() => handleLoanStatusUpdate(loan._id, 'APPROVED')}
                                                                    style={{ padding: '5px 8px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleLoanStatusUpdate(loan._id, 'REJECTED')}
                                                                    style={{ padding: '5px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'repayments' ? (
                        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-icon">🧾</div>
                            <h3>Loan Repayments</h3>
                            <p>Verify bank slips for regional loan payments</p>

                            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                                {loading ? (
                                    <p>Loading repayments...</p>
                                ) : repayments.length === 0 ? (
                                    <p>No repayment records found.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Farmer</th>
                                                <th style={{ padding: '10px' }}>Loan Purpose</th>
                                                <th style={{ padding: '10px' }}>Amount</th>
                                                <th style={{ padding: '10px' }}>Date</th>
                                                <th style={{ padding: '10px' }}>Status</th>
                                                <th style={{ padding: '10px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {repayments.map(rp => (
                                                <tr key={rp._id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                    <td style={{ padding: '10px' }}>
                                                        <strong>{rp.farmer?.name}</strong><br />
                                                        <small>{rp.farmer?.nic}</small>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>{rp.loan?.purpose}</td>
                                                    <td style={{ padding: '10px' }}>LKR {rp.amount?.toLocaleString()}</td>
                                                    <td style={{ padding: '10px' }}>{new Date(rp.paymentDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            backgroundColor: rp.status === 'PENDING' ? '#fff7ed' : rp.status === 'VERIFIED' ? '#f0fdf4' : '#fef2f2',
                                                            color: rp.status === 'PENDING' ? '#c2410c' : rp.status === 'VERIFIED' ? '#15803d' : '#b91c1c'
                                                        }}>
                                                            {rp.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <button
                                                            onClick={() => setSelectedRepayment(rp)}
                                                            style={{ padding: '5px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Verify Proof
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-icon">📋</div>
                            <h3>Compensation Claims (Regional)</h3>
                            <p>Manage crop damage claims from your region</p>

                            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                                {loading ? (
                                    <p>Loading claims...</p>
                                ) : compensations.length === 0 ? (
                                    <p>No compensation claims found.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '10px' }}>Farmer</th>
                                                <th style={{ padding: '10px' }}>Crop</th>
                                                <th style={{ padding: '10px' }}>Area</th>
                                                <th style={{ padding: '10px' }}>Damage</th>
                                                <th style={{ padding: '10px' }}>Status</th>
                                                <th style={{ padding: '10px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {compensations.map(claim => (
                                                <tr key={claim._id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                    <td style={{ padding: '10px' }}>
                                                        <strong>{claim.farmer?.name}</strong><br />
                                                        <small>{claim.farmer?.nic}</small>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        {claim.crop?.cropType}<br />
                                                        <small>{claim.crop?.variety}</small>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>{claim.affectedArea} Acres</td>
                                                    <td style={{ padding: '10px' }}>{claim.damageType}</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            backgroundColor: claim.status === 'PENDING' ? '#fff7ed' : claim.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                                                            color: claim.status === 'PENDING' ? '#c2410c' : claim.status === 'APPROVED' ? '#15803d' : '#b91c1c'
                                                        }}>
                                                            {claim.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        <button
                                                            onClick={() => handleClaimClick(claim)}
                                                            style={{ padding: '5px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            View & Process
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Repayment Verification Modal */}
                {selectedRepayment && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h2>Verify Repayment Proof</h2>
                                <button onClick={() => setSelectedRepayment(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <p><strong>Farmer:</strong> {selectedRepayment.farmer?.name}</p>
                                <p><strong>Amount Paid:</strong> LKR {selectedRepayment.amount?.toLocaleString()}</p>
                                <p><strong>Payment Date:</strong> {new Date(selectedRepayment.paymentDate).toLocaleDateString()}</p>
                            </div>

                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                <h4>Bank Slip / Receipt</h4>
                                {selectedRepayment.receiptImage.toLowerCase().endsWith('.pdf') ? (
                                    <div style={{ width: '100%', height: '400px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                        <iframe
                                            src={`http://localhost:5000/${selectedRepayment.receiptImage.replace(/\\/g, '/')}`}
                                            title="PDF Receipt"
                                            width="100%"
                                            height="100%"
                                            style={{ border: 'none' }}
                                        />
                                    </div>
                                ) : (
                                    <a href={`http://localhost:5000/${selectedRepayment.receiptImage.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={`http://localhost:5000/${selectedRepayment.receiptImage.replace(/\\/g, '/')}`}
                                            alt="Bank Slip"
                                            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid #ddd' }}
                                        />
                                    </a>
                                )}
                                <div style={{ marginTop: '10px' }}>
                                    <a
                                        href={`http://localhost:5000/${selectedRepayment.receiptImage.replace(/\\/g, '/')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline"
                                        style={{ padding: '5px 15px', fontSize: '12px', display: 'inline-block' }}
                                    >
                                        Open in New Tab ↗
                                    </a>
                                </div>
                            </div>

                            {selectedRepayment.status === 'PENDING' ? (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => handleRepaymentVerify(selectedRepayment._id, 'VERIFIED')}
                                        style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        ✅ Confirm Payment
                                    </button>
                                    <button
                                        onClick={() => handleRepaymentVerify(selectedRepayment._id, 'REJECTED')}
                                        style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        ❌ Reject Proof
                                    </button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '5px' }}>
                                    <strong>Status: {selectedRepayment.status}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Claim Modal/Details Overlay */}
                {selectedClaim && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h2>Process Compensation Claim</h2>
                                <button onClick={() => setSelectedClaim(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <h4>Claim Details</h4>
                                    <p><strong>Farmer:</strong> {selectedClaim.farmer?.name} ({selectedClaim.farmer?.nic})</p>
                                    <p><strong>Crop:</strong> {selectedClaim.crop?.cropType} - {selectedClaim.crop?.variety}</p>
                                    <p><strong>Damage Type:</strong> {selectedClaim.damageType}</p>
                                    <p><strong>Affected Area:</strong> {selectedClaim.affectedArea} Acres</p>
                                    <p><strong>Description:</strong> {selectedClaim.damageDescription}</p>
                                    <p><strong>Incident Date:</strong> {new Date(selectedClaim.incidentDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <h4>Evidence Photos</h4>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {selectedClaim.evidenceFiles?.length > 0 ? selectedClaim.evidenceFiles.map((file, idx) => {
                                            const isPdf = file.toLowerCase().endsWith('.pdf');
                                            return (
                                                <a key={idx} href={`http://localhost:5000/${file.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', textDecoration: 'none', color: '#374151' }}>
                                                    {isPdf ? (
                                                        <div style={{ width: '80px', height: '80px', backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: '1px solid #fca5a5', fontWeight: 'bold', fontSize: '10px' }}>
                                                            PDF DOCUMENT
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={`http://localhost:5000/${file.replace(/\\/g, '/')}`}
                                                            alt="Evidence"
                                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                                        />
                                                    )}
                                                    <div style={{ fontSize: '10px', marginTop: '4px' }}>View ↗</div>
                                                </a>
                                            );
                                        }) : <p>No evidence files provided.</p>}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleClaimUpdateSubmit} style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                <h4 style={{ marginBottom: '15px' }}>Officer Assessment</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label>Estimated Loss (LKR) *</label>
                                        <input
                                            type="number"
                                            value={claimUpdateData.estimatedLoss}
                                            onChange={(e) => setClaimUpdateData({ ...claimUpdateData, estimatedLoss: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Action/Status *</label>
                                        <select
                                            value={claimUpdateData.status}
                                            onChange={(e) => setClaimUpdateData({ ...claimUpdateData, status: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="PENDING">Keep Pending</option>
                                            <option value="APPROVED">Approve Claim</option>
                                            <option value="REJECTED">Reject Claim</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setSelectedClaim(null)} className="btn btn-outline">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Update Claim</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialDashboard;
