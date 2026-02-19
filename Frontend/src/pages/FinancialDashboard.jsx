import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerDashboard.css'; // Reusing styles for consistency

const FinancialDashboard = () => {
    const { user } = useAuth();
    const [interestRate, setInterestRate] = useState(8);
    const [newRate, setNewRate] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInterestRate();
        if (user?.assignedAsc?._id) {
            fetchLoans();
        }
    }, [user]);

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
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/loans?ascId=${user.assignedAsc._id}`);
            setLoans(res.data);
        } catch (err) {
            console.error("Error fetching loans:", err);
        } finally {
            setLoading(false);
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
            });
            setInterestRate(res.data.rate);
            setSuccess('Interest rate updated successfully!');
        } catch (err) {
            setError('Failed to update interest rate.');
        }
    };

    const handleLoanStatusUpdate = async (loanId, status) => {
        try {
            await axios.patch(`http://localhost:5000/api/loans/${loanId}/status`, { status });
            fetchLoans(); // Refresh list
        } catch (err) {
            alert('Failed to update loan status.');
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
                                            <th style={{ padding: '10px' }}>Period</th>
                                            <th style={{ padding: '10px' }}>Status</th>
                                            <th style={{ padding: '10px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loans.map(loan => (
                                            <tr key={loan._id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                <td style={{ padding: '10px' }}>
                                                    <strong>{loan.farmer?.name}</strong><br />
                                                    <small>{loan.farmer?.nic}</small>
                                                </td>
                                                <td style={{ padding: '10px' }}>LKR {loan.amount?.toLocaleString()}</td>
                                                <td style={{ padding: '10px' }}>{loan.repaymentPeriod} m</td>
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
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
