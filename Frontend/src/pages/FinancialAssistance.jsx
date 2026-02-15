import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const FinancialAssistance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('loan'); // 'loan' or 'compensation'

    const [loanData, setLoanData] = useState({
        loanAmount: '',
        purpose: '',
        repaymentPeriod: '',
        collateral: '',
        monthlyIncome: ''
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

    const handleLoanChange = (e) => {
        setLoanData({
            ...loanData,
            [e.target.name]: e.target.value
        });
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
        console.log('Loan application data:', loanData);
        setSuccess('Loan application submitted successfully!');
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
                                    <input
                                        type="number"
                                        name="loanAmount"
                                        value={loanData.loanAmount}
                                        onChange={handleLoanChange}
                                        placeholder="e.g., 500000"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Repayment Period *</label>
                                    <select name="repaymentPeriod" value={loanData.repaymentPeriod} onChange={handleLoanChange} required>
                                        <option value="">Select period</option>
                                        <option value="6months">6 Months</option>
                                        <option value="1year">1 Year</option>
                                        <option value="2years">2 Years</option>
                                        <option value="3years">3 Years</option>
                                        <option value="5years">5 Years</option>
                                    </select>
                                </div>
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

                            <div className="form-group">
                                <label>Monthly Income (LKR) *</label>
                                <input
                                    type="number"
                                    name="monthlyIncome"
                                    value={loanData.monthlyIncome}
                                    onChange={handleLoanChange}
                                    placeholder="e.g., 50000"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Collateral Details *</label>
                                <textarea
                                    name="collateral"
                                    value={loanData.collateral}
                                    onChange={handleLoanChange}
                                    placeholder="Describe any assets you can provide as collateral"
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
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
