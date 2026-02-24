import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerPages.css';

const FinancialAssistance = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('loan'); // 'loan', 'compensation', or 'my-loans'
    const [interestRate, setInterestRate] = useState(8);
    const [monthlyInstallment, setMonthlyInstallment] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [crops, setCrops] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
<<<<<<< HEAD
    const [myLoans, setMyLoans] = useState([]);
    const [loadingClaims, setLoadingClaims] = useState(false);
    const [loadingLoans, setLoadingLoans] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [repaymentReceipt, setRepaymentReceipt] = useState(null);
=======
    const [loadingClaims, setLoadingClaims] = useState(false);
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300

    const [loanData, setLoanData] = useState({
        loanAmount: '',
        purpose: '',
        repaymentPeriod: '',
        collateral: '',
    });

    const [compensationData, setCompensationData] = useState({
        crop: '',
        damageType: '',
        damageDescription: '',
        affectedArea: '',
        incidentDate: '',
        evidenceFiles: null
    });

    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInterestRate();
        if (user && user.role === 'FARMER') {
            fetchCrops();
            fetchMyClaims();
<<<<<<< HEAD
            fetchMyLoans();
=======
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300
        }
    }, [user]);

    const fetchCrops = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/crops', {
                headers: { Authorization: `Bearer ${token}` }
            });
<<<<<<< HEAD
=======
            // Only show approved crops for compensation
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300
            const approvedCrops = res.data.filter(crop => crop.status === 'APPROVED');
            setCrops(approvedCrops);
        } catch (err) {
            console.error("Error fetching crops:", err);
        }
    };

    const fetchMyClaims = async () => {
        try {
            setLoadingClaims(true);
            const res = await axios.get('http://localhost:5000/api/compensation', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyClaims(res.data);
        } catch (err) {
            console.error("Error fetching claims:", err);
        } finally {
            setLoadingClaims(false);
        }
    };
<<<<<<< HEAD

    const fetchMyLoans = async () => {
        try {
            setLoadingLoans(true);
            const res = await axios.get('http://localhost:5000/api/loans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyLoans(res.data);
        } catch (err) {
            console.error("Error fetching loans:", err);
        } finally {
            setLoadingLoans(false);
        }
    };
=======
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300

    const fetchInterestRate = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/loans/interest-rate');
            setInterestRate(res.data.rate);
        } catch (err) {
            console.error("Error fetching interest rate:", err);
        }
    };

    const handleLoanChange = (e) => {
        const { name, value } = e.target;
        let updatedData = { ...loanData, [name]: value };

        if (name === 'loanAmount' && value) {
            const amount = parseInt(value);
            if (amount <= 25000) updatedData.repaymentPeriod = '6';
            else if (amount <= 50000) updatedData.repaymentPeriod = '18';
            else if (amount <= 100000) updatedData.repaymentPeriod = '36';
            else updatedData.repaymentPeriod = '48';

            setMonthlyInstallment(null);
        }

        setLoanData(updatedData);
    };

    const calculateInstallment = () => {
        if (!loanData.loanAmount || !loanData.repaymentPeriod) {
            setError('Please select loan amount and repayment period first.');
            return;
        }
        setError('');
        const P = parseFloat(loanData.loanAmount);
        const r = (interestRate / 100) / 12;
        const n = parseInt(loanData.repaymentPeriod);

        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        setMonthlyInstallment(emi.toFixed(2));
    };

    const handleCompensationChange = (e) => {
        if (e.target.name === 'evidenceFiles') {
            setCompensationData({
                ...compensationData,
                evidenceFiles: e.target.files
            });
        } else {
            setCompensationData({
                ...compensationData,
                [e.target.name]: e.target.value
            });
        }
    };

    const handleLoanSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!termsAccepted) {
            setError('Please accept the terms and conditions to proceed.');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/loans/apply', {
                loanAmount: loanData.loanAmount,
                purpose: loanData.purpose,
                repaymentPeriod: loanData.repaymentPeriod,
                collateral: loanData.collateral,
                interestRate,
                termsAccepted,
                asc: user.assignedAsc?._id || user.assignedAsc
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Loan application submitted successfully!');
            fetchMyLoans(); // Refresh loan list
            setLoanData({ loanAmount: '', purpose: '', repaymentPeriod: '', collateral: '' });
            setMonthlyInstallment(null);
            setTermsAccepted(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit loan application.');
        }
    };

    const handleRepaymentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!repaymentReceipt) {
            setError('Please upload the bank slip as proof of payment.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('loanId', selectedLoan._id);
            formData.append('amount', repaymentAmount);
            formData.append('receipt', repaymentReceipt);

            await axios.post('http://localhost:5000/api/loans/repayments', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess('Repayment proof submitted successfully! Waiting for officer verification.');
            setSelectedLoan(null);
            setRepaymentAmount('');
            setRepaymentReceipt(null);
            // We don't need to refresh loans immediately as it only changes after verification
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit repayment.');
        }
    };

    const handleCompensationSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!compensationData.crop) {
            setError('Please select a registered crop.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('crop', compensationData.crop);
            formData.append('damageType', compensationData.damageType);
            formData.append('incidentDate', compensationData.incidentDate);
            formData.append('affectedArea', compensationData.affectedArea);
            formData.append('damageDescription', compensationData.damageDescription);
            formData.append('asc', user.assignedAsc?._id || user.assignedAsc);

            if (compensationData.evidenceFiles) {
                for (let i = 0; i < compensationData.evidenceFiles.length; i++) {
                    formData.append('evidenceFiles', compensationData.evidenceFiles[i]);
                }
            }

<<<<<<< HEAD
            await axios.post('http://localhost:5000/api/compensation', formData, {
=======
            const res = await axios.post('http://localhost:5000/api/compensation', formData, {
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess('Compensation claim submitted successfully!');
<<<<<<< HEAD
            fetchMyClaims();
=======
            fetchMyClaims(); // Refresh history
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300
            setCompensationData({
                crop: '',
                damageType: '',
                damageDescription: '',
                affectedArea: '',
                incidentDate: '',
                evidenceFiles: null
            });
<<<<<<< HEAD
=======
            // Reset file input manually if needed, or by re-rendering
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit compensation claim.');
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
                    <h1>💰 Financial Assistance</h1>
                    <p>Apply for loans, track repayments, or file compensation claims</p>
                </div>

                {/* Tab Navigation */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'loan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('loan')}
                    >
                        💳 Apply for Loan
                    </button>
                    <button
                        className={`tab ${activeTab === 'my-loans' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-loans')}
                    >
                        📂 My Loans & Repayment
                    </button>
                    <button
                        className={`tab ${activeTab === 'compensation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('compensation')}
                    >
                        📋 Compensation Claim
                    </button>
                </div>

                {success && <div className="alert-success">{success}</div>}
                {error && <div className="alert-error">{error}</div>}

                {/* Loan Application Tab */}
                {activeTab === 'loan' && (
                    <div className="form-card">
                        <h2>Agricultural Loan Application</h2>
                        <p className="section-desc">Apply for financial assistance to support your farming activities</p>

                        <form onSubmit={handleLoanSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Loan Amount (LKR) *</label>
                                    <select
                                        name="loanAmount"
                                        value={loanData.loanAmount}
                                        onChange={handleLoanChange}
                                        required
                                    >
                                        <option value="">Select amount</option>
                                        <option value="25000">25,000</option>
                                        <option value="50000">50,000</option>
                                        <option value="100000">100,000</option>
                                        <option value="200000">200,000</option>
                                        <option value="300000">300,000</option>
                                        <option value="500000">500,000</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Repayment Period (Months) *</label>
                                    <select
                                        name="repaymentPeriod"
                                        value={loanData.repaymentPeriod}
                                        onChange={handleLoanChange}
                                        required
                                    >
                                        <option value="">Select period</option>
                                        <option value="6">6 Months</option>
                                        <option value="18">18 Months</option>
                                        <option value="36">36 Months</option>
                                        <option value="48">48 Months</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Current Interest Rate (%)</label>
                                    <input
                                        type="text"
                                        value={`${interestRate}%`}
                                        readOnly
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Purpose of Loan *</label>
                                    <select name="purpose" value={loanData.purpose} onChange={handleLoanChange} required>
                                        <option value="">Select purpose</option>
                                        <option value="seeds">Purchase Seeds</option>
                                        <option value="fertilizer">Purchase Fertilizer</option>
                                        <option value="equipment">Purchase Equipment</option>
                                        <option value="land">Land Development</option>
                                        <option value="livestock">Livestock Purchase</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Collateral Details *</label>
                                <textarea
                                    name="collateral"
                                    value={loanData.collateral}
                                    onChange={handleLoanChange}
                                    placeholder="Describe any assets you can provide as collateral"
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="calculation-section" style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#0369a1' }}>Monthly Installment Calculator</h4>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#0c4a6e' }}>
                                            {monthlyInstallment ? (
                                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>LKR {monthlyInstallment} / month</span>
                                            ) : (
                                                "Click calculate to see your monthly payment"
                                            )}
                                        </p>
                                    </div>
                                    <button type="button" className="btn btn-outline" onClick={calculateInstallment} style={{ padding: '8px 15px', fontSize: '14px' }}>
                                        Calculate
                                    </button>
                                </div>
                            </div>

                            <div className="form-group checkbox-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        style={{ marginTop: '4px' }}
                                    />
                                    <span style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        I agree to the <strong>Terms and Conditions</strong>: If you are unable to pay within the duration, you need to give crop of land for ASC center.
                                    </span>
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={!termsAccepted}>
                                    Submit Loan Application
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* My Loans & Repayment Tab */}
                {activeTab === 'my-loans' && (
                    <div className="history-section">
                        <div className="section-header">
                            <h2>📂 My Loan History & Progress</h2>
                            <p>Track your approved loans and submit repayment bank slips</p>
                        </div>

                        {loadingLoans ? (
                            <p>Loading your loans...</p>
                        ) : myLoans.length === 0 ? (
                            <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
                                <p>You have not applied for any loans yet.</p>
                                <button className="btn btn-primary" onClick={() => setActiveTab('loan')}>Apply Now</button>
                            </div>
                        ) : (
                            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                {myLoans.map(loan => (
                                    <div key={loan._id} className="form-card" style={{
                                        margin: 0,
                                        position: 'relative',
                                        border: loan.isOverdue ? '2px solid #ef4444' : '1px solid #e5e7eb',
                                        backgroundColor: loan.isOverdue ? '#fef2f2' : 'white'
                                    }}>
                                        {loan.isOverdue && (
                                            <div style={{ position: 'absolute', top: '-12px', right: '10px', backgroundColor: '#ef4444', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                                OVERDUE ⚠️
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>ID: {loan._id.slice(-6)}</span>
                                            <span style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                backgroundColor: loan.status === 'APPROVED' ? '#f0fdf4' : loan.status === 'PENDING' ? '#fff7ed' : '#fef2f2',
                                                color: loan.status === 'APPROVED' ? '#15803d' : loan.status === 'PENDING' ? '#c2410c' : '#b91c1c'
                                            }}>{loan.status}</span>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>LKR {loan.amount?.toLocaleString()} (Principal)</div>
                                        <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '10px' }}>
                                            Total Payable: <strong>LKR {(loan.totalPayable || loan.amount + (loan.amount * loan.interestRate / 100)).toLocaleString()}</strong>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 15px 0' }}>Period: {loan.repaymentPeriod} months @ {loan.interestRate}%</p>

                                        {loan.monthlyInstallment && (
                                            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                                                <strong>Monthly Installment:</strong> LKR {loan.monthlyInstallment.toLocaleString()}
                                            </p>
                                        )}

                                        {loan.status === 'APPROVED' && (
                                            <>
                                                <div style={{ marginBottom: '15px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                                                        <span>Repayment Progress</span>
                                                        <span>{Math.round((loan.totalPaid / (loan.totalPayable || loan.amount)) * 100)}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', backgroundColor: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.min(100, (loan.totalPaid / (loan.totalPayable || loan.amount)) * 100)}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '5px', textAlign: 'right' }}>
                                                        LKR {loan.totalPaid?.toLocaleString()} of LKR {(loan.totalPayable || loan.amount)?.toLocaleString()} paid
                                                    </div>
                                                </div>

                                                <div style={{ padding: '10px', backgroundColor: loan.isOverdue ? '#fee2e2' : '#f9fafb', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Next Payment Due:</strong> {new Date(loan.nextPaymentDate).toLocaleDateString()}</p>
                                                    {loan.isOverdue && <p style={{ margin: 0, color: '#b91c1c', fontWeight: '500' }}>Please upload your bank slip immediately to avoid penalties.</p>}
                                                </div>

                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: '100%' }}
                                                    onClick={() => setSelectedLoan(loan)}
                                                >
                                                    Submit Bank Slip
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Compensation Claim Tab */}
                {activeTab === 'compensation' && (
                    <div className="form-card">
                        <h2>Crop Damage Compensation Claim</h2>
                        <p className="section-desc">File a claim for crop damage due to natural disasters or other causes</p>

                        <form onSubmit={handleCompensationSubmit}>
                            <div className="form-group">
                                <label>Select Registered Crop *</label>
                                <select name="crop" value={compensationData.crop} onChange={handleCompensationChange} required>
                                    <option value="">Select crop</option>
                                    {crops.map(crop => (
                                        <option key={crop._id} value={crop._id}>
                                            {crop.cropType} - {crop.variety} ({crop.location})
                                        </option>
                                    ))}
                                </select>
                                {crops.length === 0 && <small style={{ color: '#ef4444' }}>No approved crops found. You can only claim compensation for approved crops.</small>}
                            </div>

                            <div className="form-group">
                                <label>Type of Damage *</label>
                                <select name="damageType" value={compensationData.damageType} onChange={handleCompensationChange} required>
                                    <option value="">Select damage type</option>
                                    <option value="flood">Flood Damage</option>
                                    <option value="drought">Drought</option>
                                    <option value="pest">Pest Attack</option>
                                    <option value="disease">Crop Disease</option>
                                    <option value="wildlife">Wildlife Damage</option>
                                    <option value="storm">Storm/Cyclone</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Incident Date *</label>
                                    <input
                                        type="date"
                                        name="incidentDate"
                                        value={compensationData.incidentDate}
                                        onChange={handleCompensationChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Affected Area (Acres) *</label>
                                    <input
                                        type="number"
                                        name="affectedArea"
                                        value={compensationData.affectedArea}
                                        onChange={handleCompensationChange}
                                        step="0.1"
                                        placeholder="e.g., 1.5"
                                        required
                                    />
                                </div>
                            </div>


                            <div className="form-group">
                                <label>Damage Description *</label>
                                <textarea
                                    name="damageDescription"
                                    value={compensationData.damageDescription}
                                    onChange={handleCompensationChange}
                                    placeholder="Describe the damage in detail"
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Upload Evidence (Photos/Documents)</label>
                                <input
                                    type="file"
                                    name="evidenceFiles"
                                    onChange={handleCompensationChange}
                                    multiple
                                    accept="image/*,.pdf"
                                />
                                <small>Upload photos of damage or relevant documents (optional but recommended)</small>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Submit Compensation Claim
                                </button>
                            </div>
                        </form>
                    </div>
                )}

<<<<<<< HEAD
                {/* Repayment Submission Modal */}
                {selectedLoan && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className="form-card" style={{ maxWidth: '500px', width: '90%', margin: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3>Upload Bank Slip</h3>
                                <button onClick={() => setSelectedLoan(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <p style={{ fontSize: '14px', marginBottom: '20px' }}>Submit proof of repayment for your <strong>{selectedLoan.purpose}</strong> loan.</p>

                            <form onSubmit={handleRepaymentSubmit}>
                                <div className="form-group">
                                    <label>Repayment Amount (LKR) *</label>
                                    <input
                                        type="number"
                                        value={repaymentAmount}
                                        onChange={(e) => setRepaymentAmount(e.target.value)}
                                        placeholder="Enter amount paid"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Upload Bank Slip (Photo/PDF) *</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setRepaymentReceipt(e.target.files[0])}
                                        accept="image/*,.pdf"
                                        required
                                    />
                                </div>
                                <div className="form-actions" style={{ marginTop: '20px' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setSelectedLoan(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Submit for Verification</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Claims History (Visible for both tabs if farmer) */}
                {user?.role === 'FARMER' && (activeTab === 'loan' || activeTab === 'compensation') && (
=======
                {/* Claims History (Visible for both tabs if farmer) */}
                {user?.role === 'FARMER' && (
>>>>>>> 81b5ac5a89c5d06098e5da377668e0fef5a84300
                    <div className="history-section" style={{ marginTop: '40px' }}>
                        <div className="section-header">
                            <h2>📜 Application History</h2>
                            <p>Track the status of your financial assistance requests</p>
                        </div>

                        <div className="history-tabs" style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                            <small style={{ color: '#6b7280' }}>Showing history for your region: <strong>{user.assignedAsc?.name || 'Assigned Center'}</strong></small>
                        </div>

                        <div className="form-card" style={{ padding: '20px' }}>
                            {loadingClaims ? (
                                <p>Loading history...</p>
                            ) : myClaims.length === 0 ? (
                                <p>No compensation claims found.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '12px' }}>Incident Date</th>
                                                <th style={{ padding: '12px' }}>Crop</th>
                                                <th style={{ padding: '12px' }}>Damage Type</th>
                                                <th style={{ padding: '12px' }}>Status</th>
                                                <th style={{ padding: '12px' }}>Estimated Loss</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myClaims.map(claim => (
                                                <tr key={claim._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '12px' }}>{new Date(claim.incidentDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        {claim.crop?.cropType}<br />
                                                        <small>{claim.crop?.variety}</small>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>{claim.damageType}</td>
                                                    <td style={{ padding: '12px' }}>
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
                                                    <td style={{ padding: '12px' }}>
                                                        {claim.estimatedLoss > 0 ? `LKR ${claim.estimatedLoss.toLocaleString()}` : <span style={{ color: '#6b7280', fontSize: '12px' }}>Pending estimation</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialAssistance;
