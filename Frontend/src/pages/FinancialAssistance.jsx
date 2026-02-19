import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerPages.css';

const FinancialAssistance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('loan'); // 'loan' or 'compensation'
    const [interestRate, setInterestRate] = useState(8);
    const [monthlyInstallment, setMonthlyInstallment] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [loanData, setLoanData] = useState({
        loanAmount: '',
        purpose: '',
        repaymentPeriod: '',
        collateral: '',
    });

    const [compensationData, setCompensationData] = useState({
        damageType: '',
        damageDescription: '',
        affectedArea: '',
        estimatedLoss: '',
        incidentDate: '',
        evidenceFiles: null
    });

    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInterestRate();
    }, []);

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
            // Auto-select repayment period based on amount
            const amount = parseInt(value);
            if (amount <= 25000) updatedData.repaymentPeriod = '6';
            else if (amount <= 50000) updatedData.repaymentPeriod = '18';
            else if (amount <= 100000) updatedData.repaymentPeriod = '36';
            else updatedData.repaymentPeriod = '48';

            setMonthlyInstallment(null); // Reset calculation when amount changes
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

        // EMI formula: [P x r x (1+r)^n]/[(1+r)^n-1]
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
                ...loanData,
                farmer: user._id,
                interestRate,
                termsAccepted,
                asc: user.assignedAsc?._id || user.assignedAsc // Include the user's assigned ASC ID
            });
            setSuccess('Loan application submitted successfully!');
            setLoanData({ loanAmount: '', purpose: '', repaymentPeriod: '', collateral: '' });
            setMonthlyInstallment(null);
            setTermsAccepted(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit loan application.');
        }
    };

    const handleCompensationSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        console.log('Compensation claim data:', compensationData);
        setSuccess('Compensation claim submitted successfully!');
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
                    <p>Apply for loans or file compensation claims</p>
                </div>

                {/* Tab Navigation */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'loan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('loan')}
                    >
                        💳 Loan Application
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

                {/* Compensation Claim Tab */}
                {activeTab === 'compensation' && (
                    <div className="form-card">
                        <h2>Crop Damage Compensation Claim</h2>
                        <p className="section-desc">File a claim for crop damage due to natural disasters or other causes</p>

                        <form onSubmit={handleCompensationSubmit}>
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
                                <label>Estimated Loss (LKR) *</label>
                                <input
                                    type="number"
                                    name="estimatedLoss"
                                    value={compensationData.estimatedLoss}
                                    onChange={handleCompensationChange}
                                    placeholder="e.g., 250000"
                                    required
                                />
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
            </div>
        </div>
    );
};

export default FinancialAssistance;
