import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';
import './FarmerPages.css';

const FinancialDashboard = () => {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('loans'); // 'loans' or 'repayments'
    const [interestRate, setInterestRate] = useState(8);
    const [newRate, setNewRate] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loans, setLoans] = useState([]);
    const [repayments, setRepayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRepayment, setSelectedRepayment] = useState(null);
    const [selectedLoanReview, setSelectedLoanReview] = useState(null);
    const [reviewMessage, setReviewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [repaymentVerifyNotes, setRepaymentVerifyNotes] = useState('');
    const [repaymentProcessing, setRepaymentProcessing] = useState(false);

    useEffect(() => {
        fetchInterestRate();
        if (user?.assignedAsc?._id || user?.assignedAsc) {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchLoans(), fetchRepayments()]);
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



    const fetchRepayments = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/loans/repayments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📥 Fetched repayments:', res.data.map(r => ({ 
                id: r._id, 
                status: r.status, 
                amount: r.amount, 
                hasAdminNotes: !!r.adminNotes,
                adminNotes: r.adminNotes?.substring(0, 30) 
            })));
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

    const handleOpenLoanReview = (loan) => {
        setSelectedLoanReview(loan);
        setReviewMessage('');
    };

    const handleCloseLoanReview = () => {
        setSelectedLoanReview(null);
        setReviewMessage('');
    };

    const handleLoanReviewSubmit = async (status) => {
        if (!reviewMessage.trim()) {
            alert('Please add a message for the farmer.');
            return;
        }

        if (reviewMessage.trim().length < 10) {
            alert('Message must be at least 10 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.patch(`http://localhost:5000/api/loans/${selectedLoanReview._id}/status`, {
                status,
                officerMessage: reviewMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setSuccess(`Loan ${status} successfully!`);
            handleCloseLoanReview();
            fetchLoans();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update loan status.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRepaymentVerify = async (id, status, notes = '') => {
        try {
            console.log('📋 Verify Payment Details:', { id, status, notes: notes.substring(0, 50) });
            
            if (!notes || notes.trim().length === 0) {
                const errorMsg = 'Please enter a reason/note before confirming or rejecting.';
                setError(errorMsg);
                console.error('❌ ' + errorMsg);
                return;
            }

            setRepaymentProcessing(true);
            console.log('⏳ Sending verification request to backend...');
            
            const response = await axios.patch(`http://localhost:5000/api/loans/repayments/${id}/verify`, {
                status,
                adminNotes: notes.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Backend Response:', response.data);
            console.log('📊 Updated Status:', response.data.repayment?.status);
            
            if (response.data.repayment?.status !== status) {
                console.warn('⚠️ Status mismatch! Expected:', status, 'Got:', response.data.repayment?.status);
            }
            
            const successMsg = `Repayment ${status} successfully! Status updated.`;
            setSuccess(successMsg);
            console.log('✨ ' + successMsg);
            
            // Clear notes and close modal
            setRepaymentVerifyNotes('');
            setSelectedRepayment(null);
            
            // Refresh all data immediately
            console.log('🔄 Refreshing dashboard data...');
            await fetchAllData();
            
            console.log('🎉 Verification complete!');
            setTimeout(() => setSuccess(''), 3000);
            
        } catch (err) {
            console.error('🚨 Full Error Object:', err);
            console.error('Response Status:', err.response?.status);
            console.error('Response Data:', err.response?.data);
            
            let errorMessage = 'Failed to update repayment status.';
            
            if (err.response?.status === 400) {
                errorMessage = err.response.data?.message || 'Invalid input - please check your notes.';
            } else if (err.response?.status === 403) {
                errorMessage = 'You do not have permission to verify repayments (must be FINANCIAL_OFFICER or ADMIN).';
            } else if (err.response?.status === 404) {
                errorMessage = 'Repayment not found in database.';
            } else if (err.response?.status === 500) {
                errorMessage = 'Server error: ' + (err.response.data?.message || 'Please try again');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            console.error('❌ Error:', errorMessage);
            setError(errorMessage);
            setTimeout(() => setError(''), 5000);
        } finally {
            setRepaymentProcessing(false);
        }
    };



    const downloadLoanPDF = async (loan) => {
        try {
            // Fetch repayments for this loan
            const repaymentRes = await axios.get(`http://localhost:5000/api/loans/${loan._id}/repayments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const loanRepayments = repaymentRes.data || [];

            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(6, 78, 59);
            doc.text('AgroLanka Financial Aid', 105, 25, { align: 'center' });
            
            // Subheader
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('Loan Application Report', 105, 35, { align: 'center' });
            
            // Divider line
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 40, 190, 40);
            
            let yPos = 50;
        
        // Farmer Information Section
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(6, 78, 59);
        doc.text('Farmer Information', 20, yPos);
        yPos += 8;
        
        // Farmer details in a box
        doc.setFillColor(230, 245, 245);
        doc.rect(20, yPos, 170, 30, 'F');
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        
        doc.text(`Farmer Name: ${loan.farmer?.name || 'N/A'}`, 25, yPos + 6);
        doc.text(`Farmer ID (NIC): ${loan.farmer?.nic || 'N/A'}`, 25, yPos + 14);
        doc.text(`Phone: ${loan.farmer?.phone || 'N/A'}`, 25, yPos + 22);
        
        yPos += 35;
        
        // Loan Details Section
        doc.setFont(undefined, 'bold');
        doc.setTextColor(6, 78, 59);
        doc.setFontSize(11);
        doc.text('Loan Details', 20, yPos);
        yPos += 8;
        
        const loanDetailsData = [
            ['Loan ID', loan._id || 'N/A'],
            ['Loan Purpose', loan.purpose || 'N/A'],
            ['Principal Amount', `LKR ${(loan.amount || 0).toLocaleString()}`],
            ['Interest Rate', `${loan.interestRate || 0}%`],
            ['Repayment Period', `${loan.repaymentPeriod || 0} months`],
            ['Total Payable', `LKR ${(loan.totalPayable || loan.amount || 0).toLocaleString()}`],
            ['Application Date', new Date(loan.createdAt).toLocaleDateString()],
            ['Loan Status', loan.status || 'PENDING']
        ];
        
        if (loan.status === 'APPROVED') {
            loanDetailsData.push(['Approved Date', new Date(loan.approvedDate).toLocaleDateString()]);
            loanDetailsData.push(['Loan Deadline', loan.loanDeadline ? new Date(loan.loanDeadline).toLocaleDateString() : 'N/A']);
        }
        
        autoTable(doc, {
            startY: yPos,
            head: [['Property', 'Value']],
            body: loanDetailsData,
            theme: 'grid',
            headStyles: {
                fillColor: [6, 78, 59],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 'auto' }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // Repayment Progress Section
        doc.setFont(undefined, 'bold');
        doc.setTextColor(6, 78, 59);
        doc.setFontSize(11);
        doc.text('Repayment Progress', 20, yPos);
        yPos += 8;
        
        const totalPaid = loan.totalPaid || 0;
        const totalPayable = loan.totalPayable || loan.amount || 0;
        const progressPercentage = Math.min(100, (totalPaid / totalPayable) * 100);
        const remainingBalance = totalPayable - totalPaid;
        
        // Summary Table
        const repaymentSummaryData = [
            ['Total Payable Amount', `LKR ${totalPayable.toLocaleString()}`],
            ['Total Amount Paid', `LKR ${totalPaid.toLocaleString()}`],
            ['Remaining Balance', `LKR ${remainingBalance.toLocaleString()}`],
            ['Progress Percentage', `${progressPercentage.toFixed(2)}%`]
        ];
        
        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Value']],
            body: repaymentSummaryData,
            theme: 'grid',
            headStyles: {
                fillColor: [5, 150, 105],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 'auto' }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 12;
        
        // Collateral Information Section (if available)
        if (loan.collateral && (loan.collateral.type || loan.collateral.description)) {
            doc.setFont(undefined, 'bold');
            doc.setTextColor(6, 78, 59);
            doc.setFontSize(11);
            doc.text('Collateral Information', 20, yPos);
            yPos += 8;
            
            const collateralData = [
                ['Collateral Type', loan.collateral.type || 'N/A'],
                ['Description', loan.collateral.description || 'N/A'],
                ['Estimated Value', `LKR ${(loan.collateral.value || 0).toLocaleString()}`]
            ];
            
            autoTable(doc, {
                startY: yPos,
                head: [['Property', 'Value']],
                body: collateralData,
                theme: 'grid',
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10
                },
                bodyStyles: {
                    textColor: [0, 0, 0],
                    fontSize: 9
                }
            });
            
            yPos = doc.lastAutoTable.finalY + 15;
        }
        
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
        
        // Download PDF
        const filename = `Loan_Application_${loan.farmer?.name?.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
        doc.save(filename);
        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            setError('Failed to generate PDF. Please try again.');
            setTimeout(() => setError(''), 3000);
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
            
            {/* Success Notification */}
            {success && (
                <div style={{ position: 'fixed', top: '80px', right: '20px', backgroundColor: '#10b981', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', zIndex: 999, maxWidth: '400px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span>✅ {success}</span>
                    <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>×</button>
                </div>
            )}

            {/* Error Notification */}
            {error && (
                <div style={{ position: 'fixed', top: '80px', right: '20px', backgroundColor: '#dc2626', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)', zIndex: 999, maxWidth: '400px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span>❌ {error}</span>
                    <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>×</button>
                </div>
            )}
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
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', fontWeight: '800', color: '#059669', fontSize: '1.2rem' }}>🔄 Loading regional financial data...</td></tr>
                                ) : (activeTab === 'loans' ? loans : repayments).length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#9ca3af', fontWeight: '700', fontSize: '1.2rem' }}>📭 No data found for this category.</td></tr>
                                ) : (activeTab === 'loans' ? loans : repayments).map((item, index) => {
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

                                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                <span className="status-badge-fin" style={{ backgroundColor: status.bg, color: status.text, borderColor: status.border }}>
                                                    {displayStatus}
                                                </span>
                                            </td>
                                            
                                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                {activeTab === 'loans' && item.status === 'PENDING' && (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleOpenLoanReview(item)} style={{ padding: '8px 14px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.65rem' }}>REVIEW</button>
                                                        <button onClick={() => downloadLoanPDF(item)} style={{ padding: '8px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.65rem' }}>📄 PDF</button>
                                                    </div>
                                                )}
                                                {activeTab === 'loans' && item.status !== 'PENDING' && (
                                                    <button onClick={() => downloadLoanPDF(item)} style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.7rem' }}>📄 PDF</button>
                                                )}
                                                {activeTab === 'repayments' && (
                                                    <button onClick={() => setSelectedRepayment(item)} style={{ padding: '8px 16px', background: 'white', color: '#064e3b', border: '2px solid #064e3b', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.7rem' }}>VIEW PROOF</button>
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
                                <button onClick={() => {
                                    setSelectedRepayment(null);
                                    setRepaymentVerifyNotes('');
                                }} style={{ border: 'none', background: 'none', fontSize: '32px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
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
                                        {selectedRepayment.farmerNotes && (
                                            <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e' }}>FARMER NOTES</div>
                                                <div style={{ fontWeight: '600', color: '#65431e', marginTop: '8px', lineHeight: '1.5' }}>{selectedRepayment.farmerNotes}</div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {selectedRepayment.status === 'PENDING' ? (
                                        <>
                                            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                                                <label style={{ display: 'block', fontWeight: '800', color: '#4b5563', marginBottom: '8px' }}>Reason / Notes *</label>
                                                <textarea 
                                                    value={repaymentVerifyNotes}
                                                    onChange={(e) => setRepaymentVerifyNotes(e.target.value)}
                                                    placeholder="Enter reason for approval or rejection..."
                                                    rows="3"
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit', resize: 'vertical' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRepaymentVerify(selectedRepayment._id, 'VERIFIED', repaymentVerifyNotes)} 
                                                    disabled={!repaymentVerifyNotes.trim() || repaymentProcessing}
                                                    style={{ flex: 1, padding: '14px', backgroundColor: (repaymentVerifyNotes.trim() && !repaymentProcessing) ? '#059669' : '#ccc', color: 'white', border: 'none', borderRadius: '12px', cursor: (repaymentVerifyNotes.trim() && !repaymentProcessing) ? 'pointer' : 'not-allowed', fontWeight: '800', fontSize: '0.9rem' }}>
                                                    {repaymentProcessing ? '⏳ Processing...' : '✅ CONFIRM'}
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRepaymentVerify(selectedRepayment._id, 'REJECTED', repaymentVerifyNotes)} 
                                                    disabled={!repaymentVerifyNotes.trim() || repaymentProcessing}
                                                    style={{ flex: 1, padding: '14px', backgroundColor: (repaymentVerifyNotes.trim() && !repaymentProcessing) ? '#dc2626' : '#ccc', color: 'white', border: 'none', borderRadius: '12px', cursor: (repaymentVerifyNotes.trim() && !repaymentProcessing) ? 'pointer' : 'not-allowed', fontWeight: '800', fontSize: '0.9rem' }}>
                                                    {repaymentProcessing ? '⏳ Processing...' : '❌ REJECT'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ marginTop: '30px', textAlign: 'center', padding: '15px', backgroundColor: selectedRepayment.status === 'VERIFIED' ? '#ecfdf5' : '#fef2f2', borderRadius: '12px', fontWeight: '800', color: selectedRepayment.status === 'VERIFIED' ? '#059669' : '#dc2626', borderLeft: `4px solid ${selectedRepayment.status === 'VERIFIED' ? '#10b981' : '#ef4444'}` }}>
                                                VERIFICATION STATUS: {selectedRepayment.status}
                                            </div>
                                            {selectedRepayment.adminNotes && (
                                                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#dbeafe', borderLeft: '4px solid #0284c7', borderRadius: '12px' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#075985' }}>YOUR REASON/NOTES</div>
                                                    <div style={{ fontWeight: '600', color: '#000000', marginTop: '8px', lineHeight: '1.5' }}>{selectedRepayment.adminNotes}</div>
                                                </div>
                                            )}
                                        </>
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

                {/* Loan Review Modal */}
                {selectedLoanReview && (
                    <div className="modal-overlay">
                        <div className="modal-container" style={{ maxWidth: '900px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                                <h2 style={{ margin: 0, color: '#064e3b', fontWeight: '900' }}>👁️ Review Loan Application</h2>
                                <button onClick={handleCloseLoanReview} style={{ border: 'none', background: 'none', fontSize: '32px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                                {/* Left Column - Loan Details */}
                                <div>
                                    <h4 style={{ textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '15px' }}>📋 Loan Details</h4>
                                    
                                    <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>FARMER NAME</div>
                                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem' }}>{selectedLoanReview.farmer?.name || 'Unknown'}</div>
                                    </div>

                                    <div style={{ padding: '15px', background: '#ecfdf5', borderRadius: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>REQUESTED AMOUNT (LKR)</div>
                                        <div style={{ fontWeight: '900', color: '#064e3b', fontSize: '1.5rem' }}>LKR {selectedLoanReview.amount?.toLocaleString()}</div>
                                    </div>

                                    <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>LOAN PURPOSE</div>
                                        <div style={{ fontWeight: '800', color: '#78350f', fontSize: '1rem', textTransform: 'capitalize' }}>{selectedLoanReview.purpose}</div>
                                    </div>

                                    <div style={{ padding: '15px', background: '#f3f4f6', borderRadius: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>REPAYMENT PERIOD</div>
                                        <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '1rem' }}>{selectedLoanReview.repaymentPeriod} Months</div>
                                    </div>

                                    <div style={{ padding: '15px', background: '#dbeafe', borderRadius: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0369a1', marginBottom: '4px' }}>APPROVED DATE</div>
                                        <div style={{ fontWeight: '800', color: '#0c4a6e', fontSize: '1rem' }}>{new Date().toLocaleDateString()}</div>
                                    </div>

                                    <div style={{ padding: '15px', background: '#fecaca', borderRadius: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>LOAN DEADLINE</div>
                                        <div style={{ fontWeight: '800', color: '#7f1d1d', fontSize: '1rem' }}>
                                            {(() => {
                                                const approvalDate = new Date();
                                                const deadline = new Date(approvalDate);
                                                deadline.setMonth(deadline.getMonth() + (selectedLoanReview.repaymentPeriod || 0));
                                                return deadline.toLocaleDateString();
                                            })()}
                                        </div>
                                    </div>

                                    <div style={{ padding: '15px', background: '#f3f4f6', borderRadius: '12px', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>INTEREST RATE</div>
                                        <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '1rem' }}>{selectedLoanReview.interestRate || interestRate}%</div>
                                    </div>

                                    <div style={{ padding: '15px', background: '#f3f4f6', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>MONTHLY INSTALLMENT</div>
                                        <div style={{ fontWeight: '900', color: '#1f2937', fontSize: '1.2rem' }}>LKR {selectedLoanReview.monthlyInstallment?.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Right Column - Collateral Details & Message */}
                                <div>
                                    <h4 style={{ textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '15px' }}>🏠 Collateral Details</h4>
                                    
                                    {selectedLoanReview.loanImage && (
                                        <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                            <img 
                                                src={`http://localhost:5000/${selectedLoanReview.loanImage}`} 
                                                alt="Loan Document" 
                                                style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                    
                                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '20px', minHeight: '150px' }}>
                                        <p style={{ margin: 0, color: '#374151', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {selectedLoanReview.collateral}
                                        </p>
                                    </div>

                                    <h4 style={{ textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '10px' }}>💬 Officer Message *</h4>
                                    <textarea
                                        value={reviewMessage}
                                        onChange={(e) => setReviewMessage(e.target.value)}
                                        placeholder="Type your message to the farmer (min 10 characters)..."
                                        style={{
                                            width: '100%',
                                            minHeight: '120px',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: '1.5px solid #e2e8f0',
                                            fontFamily: 'inherit',
                                            fontSize: '0.95rem',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', fontWeight: '600' }}>
                                        {reviewMessage.length} characters
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', borderTop: '2px solid #f1f5f9', paddingTop: '20px' }}>
                                <button
                                    onClick={handleCloseLoanReview}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '12px 28px',
                                        background: '#f3f4f6',
                                        color: '#4b5563',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '800',
                                        fontSize: '0.9rem',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.6 : 1
                                    }}
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={() => handleLoanReviewSubmit('REJECTED')}
                                    disabled={isSubmitting || !reviewMessage.trim()}
                                    style={{
                                        padding: '12px 28px',
                                        background: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '800',
                                        fontSize: '0.9rem',
                                        cursor: isSubmitting || !reviewMessage.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting || !reviewMessage.trim() ? 0.6 : 1
                                    }}
                                >
                                    {isSubmitting ? '⏳ REJECTING...' : '❌ REJECT'}
                                </button>
                                <button
                                    onClick={() => handleLoanReviewSubmit('APPROVED')}
                                    disabled={isSubmitting || !reviewMessage.trim()}
                                    style={{
                                        padding: '12px 28px',
                                        background: '#059669',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '800',
                                        fontSize: '0.9rem',
                                        cursor: isSubmitting || !reviewMessage.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting || !reviewMessage.trim() ? 0.6 : 1
                                    }}
                                >
                                    {isSubmitting ? '⏳ APPROVING...' : '✅ APPROVE'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialDashboard;
