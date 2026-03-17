import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerPages.css';
 
const FinancialAssistance = () => {
    const { user, token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('loan'); // 'loan', 'compensation', or 'my-loans'
    const [interestRate, setInterestRate] = useState(8);
    const [monthlyInstallment, setMonthlyInstallment] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [crops, setCrops] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [myLoans, setMyLoans] = useState([]);
    const [loadingClaims, setLoadingClaims] = useState(false);
    const [loadingLoans, setLoadingLoans] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [repaymentReceipt, setRepaymentReceipt] = useState(null);
 
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
            fetchMyLoans();
        }
    }, [user]);
 
    const fetchCrops = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/crops', {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            setError(t('farmer_finance.selectAmountError'));
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
            setError(t('farmer_finance.termsError'));
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
            setSuccess(t('farmer_finance.loanSuccess'));
            fetchMyLoans(); // Refresh loan list
            setLoanData({ loanAmount: '', purpose: '', repaymentPeriod: '', collateral: '' });
            setMonthlyInstallment(null);
            setTermsAccepted(false);
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        }
    };
 
    const handleRepaymentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
 
        if (!repaymentReceipt) {
            setError(t('farmer_finance.receiptError'));
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
 
            setSuccess(t('farmer_finance.repaymentSuccess'));
            setSelectedLoan(null);
            setRepaymentAmount('');
            setRepaymentReceipt(null);
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        }
    };
 
    const handleCompensationSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
 
        if (!compensationData.crop) {
            setError(t('farmer_finance.selectCropError'));
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
 
            await axios.post('http://localhost:5000/api/compensation', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
 
            setSuccess(t('farmer_finance.claimSuccess'));
            fetchMyClaims();
            setCompensationData({
                crop: '',
                damageType: '',
                damageDescription: '',
                affectedArea: '',
                incidentDate: '',
                evidenceFiles: null
            });
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        }
    };
 
    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← {t('common.backToDashboard')}
                    </button>
                    <h1>💰 {t('farmer_finance.title')}</h1>
                    <p>{t('farmer_finance.subtitle')}</p>
                </div>
 
                {/* Tab Navigation */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'loan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('loan')}
                    >
                        💳 {t('farmer_finance.tabApply')}
                    </button>
                    <button
                        className={`tab ${activeTab === 'my-loans' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-loans')}
                    >
                        📂 {t('farmer_finance.tabHistory')}
                    </button>
                    <button
                        className={`tab ${activeTab === 'compensation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('compensation')}
                    >
                        📋 {t('farmer_finance.tabClaim')}
                    </button>
                </div>
 
                {success && <div className="alert-success">{success}</div>}
                {error && <div className="alert-error">{error}</div>}
 
                {/* Loan Application Tab */}
                {activeTab === 'loan' && (
                    <div className="form-card">
                        <h2>{t('farmer_finance.applyTitle')}</h2>
                        <p className="section-desc">{t('farmer_finance.applyDesc')}</p>
 
                        <form onSubmit={handleLoanSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('farmer_finance.amount')} (LKR) *</label>
                                    <select
                                        name="loanAmount"
                                        value={loanData.loanAmount}
                                        onChange={handleLoanChange}
                                        required
                                    >
                                        <option value="">{t('common.select')}</option>
                                        <option value="25000">25,000</option>
                                        <option value="50000">50,000</option>
                                        <option value="100000">100,000</option>
                                        <option value="200000">200,000</option>
                                        <option value="300000">300,000</option>
                                        <option value="500000">500,000</option>
                                    </select>
                                </div>
 
                                <div className="form-group">
                                    <label>{t('farmer_finance.period')} ({t('farmer_finance.months')}) *</label>
                                    <select
                                        name="repaymentPeriod"
                                        value={loanData.repaymentPeriod}
                                        onChange={handleLoanChange}
                                        required
                                    >
                                        <option value="">{t('common.select')}</option>
                                        <option value="6">6 {t('farmer_finance.months')}</option>
                                        <option value="18">18 {t('farmer_finance.months')}</option>
                                        <option value="36">36 {t('farmer_finance.months')}</option>
                                        <option value="48">48 {t('farmer_finance.months')}</option>
                                    </select>
                                </div>
                            </div>
 
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('farmer_finance.interestRate')} (%)</label>
                                    <input
                                        type="text"
                                        value={`${interestRate}%`}
                                        readOnly
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('farmer_finance.purpose')} *</label>
                                    <select name="purpose" value={loanData.purpose} onChange={handleLoanChange} required>
                                        <option value="">{t('common.select')}</option>
                                        <option value="seeds">{t('farmer_finance.seeds')}</option>
                                        <option value="fertilizer">{t('farmer_finance.fertilizer')}</option>
                                        <option value="equipment">{t('farmer_finance.equipment')}</option>
                                        <option value="land">{t('farmer_finance.land')}</option>
                                        <option value="livestock">{t('farmer_finance.livestock')}</option>
                                        <option value="other">{t('common.other')}</option>
                                    </select>
                                </div>
                            </div>
 
                            <div className="form-group">
                                <label>{t('farmer_finance.collateral')} *</label>
                                <textarea
                                    name="collateral"
                                    value={loanData.collateral}
                                    onChange={handleLoanChange}
                                    placeholder={t('farmer_finance.collateralPlaceholder')}
                                    rows="3"
                                    required
                                />
                            </div>
 
                            <div className="calculation-section" style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#0369a1' }}>{t('farmer_finance.calculatorTitle')}</h4>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#0c4a6e' }}>
                                            {monthlyInstallment ? (
                                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>LKR {monthlyInstallment} / {t('farmer_finance.months')}</span>
                                            ) : (
                                                t('farmer_finance.calculatorDesc')
                                            )}
                                        </p>
                                    </div>
                                    <button type="button" className="btn btn-outline" onClick={calculateInstallment} style={{ padding: '8px 15px', fontSize: '14px' }}>
                                        {t('farmer_finance.calculate')}
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
                                        {t('farmer_finance.termsText')}
                                    </span>
                                </label>
                            </div>
 
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')}>
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={!termsAccepted}>
                                    {t('farmer_finance.submitLoan')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
 
                {/* My Loans & Repayment Tab */}
                {activeTab === 'my-loans' && (
                    <div className="history-section">
                        <div className="section-header">
                            <h2>📂 {t('farmer_finance.historyTitle')}</h2>
                            <p>{t('farmer_finance.historySubtitle')}</p>
                        </div>
 
                        {loadingLoans ? (
                            <p>{t('common.loading')}</p>
                        ) : myLoans.length === 0 ? (
                            <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
                                <p>{t('farmer_finance.emptyLoans')}</p>
                                <button className="btn btn-primary" onClick={() => setActiveTab('loan')}>{t('farmer_finance.applyNow')}</button>
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
                                                {t('farmer_finance.overdue')} ⚠️
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
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>LKR {loan.amount?.toLocaleString()} ({t('farmer_finance.principal')})</div>
                                        <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '10px' }}>
                                            {t('farmer_finance.totalPayable')}: <strong>LKR {(loan.totalPayable || loan.amount + (loan.amount * loan.interestRate / 100)).toLocaleString()}</strong>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 15px 0' }}>{t('farmer_finance.period')}: {loan.repaymentPeriod} {t('farmer_finance.months')} @ {loan.interestRate}%</p>
 
                                        {loan.monthlyInstallment && (
                                            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                                                <strong>{t('farmer_finance.monthlyInstallment')}:</strong> LKR {loan.monthlyInstallment.toLocaleString()}
                                            </p>
                                        )}
 
                                        {loan.status === 'APPROVED' && (
                                            <>
                                                <div style={{ marginBottom: '15px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                                                        <span>{t('farmer_finance.repaymentProgress')}</span>
                                                        <span>{Math.round((loan.totalPaid / (loan.totalPayable || loan.amount)) * 100)}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', backgroundColor: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.min(100, (loan.totalPaid / (loan.totalPayable || loan.amount)) * 100)}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '5px', textAlign: 'right' }}>
                                                        LKR {loan.totalPaid?.toLocaleString()} {t('farmer_finance.of')} LKR {(loan.totalPayable || loan.amount)?.toLocaleString()} {t('farmer_finance.paid')}
                                                    </div>
                                                </div>
 
                                                <div style={{ padding: '10px', backgroundColor: loan.isOverdue ? '#fee2e2' : '#f9fafb', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>{t('farmer_finance.nextPayment')}:</strong> {new Date(loan.nextPaymentDate).toLocaleDateString()}</p>
                                                    {loan.isOverdue && <p style={{ margin: 0, color: '#b91c1c', fontWeight: '500' }}>{t('farmer_finance.overdueWarning')}</p>}
                                                </div>
 
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ width: '100%' }}
                                                    onClick={() => setSelectedLoan(loan)}
                                                >
                                                    {t('farmer_finance.submitSlip')}
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
                        <h2>{t('farmer_finance.claimTitle')}</h2>
                        <p className="section-desc">{t('farmer_finance.claimDesc')}</p>
 
                        <form onSubmit={handleCompensationSubmit}>
                            <div className="form-group">
                                <label>{t('farmer_finance.selectCrop')} *</label>
                                <select name="crop" value={compensationData.crop} onChange={handleCompensationChange} required>
                                    <option value="">{t('common.select')}</option>
                                    {crops.map(crop => (
                                        <option key={crop._id} value={crop._id}>
                                            {t(`farmer_crop.${crop.cropType.toLowerCase()}`)} - {crop.variety} ({crop.location})
                                        </option>
                                    ))}
                                </select>
                                {crops.length === 0 && <small style={{ color: '#ef4444' }}>{t('farmer_finance.noCropsFound')}</small>}
                            </div>
 
                            <div className="form-group">
                                <label>{t('farmer_finance.damageType')} *</label>
                                <select name="damageType" value={compensationData.damageType} onChange={handleCompensationChange} required>
                                    <option value="">{t('common.select')}</option>
                                    <option value="flood">{t('farmer_finance.flood')}</option>
                                    <option value="drought">{t('farmer_finance.drought')}</option>
                                    <option value="pest">{t('farmer_finance.pest')}</option>
                                    <option value="disease">{t('farmer_finance.disease')}</option>
                                    <option value="wildlife">{t('farmer_finance.wildlife')}</option>
                                    <option value="storm">{t('farmer_finance.storm')}</option>
                                    <option value="other">{t('common.other')}</option>
                                </select>
                            </div>
 
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('farmer_finance.incidentDate')} *</label>
                                    <input
                                        type="date"
                                        name="incidentDate"
                                        value={compensationData.incidentDate}
                                        onChange={handleCompensationChange}
                                        required
                                    />
                                </div>
 
                                <div className="form-group">
                                    <label>{t('farmer_finance.affectedArea')} ({t('farmer_crop.acres')}) *</label>
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
                                <label>{t('farmer_finance.damageDesc')} *</label>
                                <textarea
                                    name="damageDescription"
                                    value={compensationData.damageDescription}
                                    onChange={handleCompensationChange}
                                    placeholder={t('farmer_finance.damageDescPlaceholder')}
                                    rows="4"
                                    required
                                />
                            </div>
 
                            <div className="form-group">
                                <label>{t('farmer_finance.evidence')}</label>
                                <input
                                    type="file"
                                    name="evidenceFiles"
                                    onChange={handleCompensationChange}
                                    multiple
                                    accept="image/*,.pdf"
                                />
                                <small>{t('farmer_finance.evidenceHint')}</small>
                            </div>
 
                            <div className="form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')}>
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {t('farmer_finance.submitClaim')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
 
                {/* Repayment Submission Modal */}
                {selectedLoan && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className="form-card" style={{ maxWidth: '500px', width: '90%', margin: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3>{t('farmer_finance.uploadSlip')}</h3>
                                <button onClick={() => setSelectedLoan(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <p style={{ fontSize: '14px', marginBottom: '20px' }}>{t('farmer_finance.submitRepaymentFor')} <strong>{selectedLoan.purpose}</strong> {t('farmer_finance.loan')}.</p>
 
                            <form onSubmit={handleRepaymentSubmit}>
                                <div className="form-group">
                                    <label>{t('farmer_finance.amountPaid')} (LKR) *</label>
                                    <input
                                        type="number"
                                        value={repaymentAmount}
                                        onChange={(e) => setRepaymentAmount(e.target.value)}
                                        placeholder={t('farmer_finance.amountPlaceholder')}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('farmer_finance.uploadSlip')} (Photo/PDF) *</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setRepaymentReceipt(e.target.files[0])}
                                        accept="image/*,.pdf"
                                        required
                                    />
                                </div>
                                <div className="form-actions" style={{ marginTop: '20px' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setSelectedLoan(null)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary">{t('farmer_finance.submitVerification')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
 
                {/* Claims History (Visible for both tabs if farmer) */}
                {user?.role === 'FARMER' && (activeTab === 'loan' || activeTab === 'compensation') && (
                    <div className="history-section" style={{ marginTop: '40px' }}>
                        <div className="section-header">
                            <h2>📜 {t('farmer_finance.historyTitle')}</h2>
                            <p>{t('farmer_finance.trackHistory')}</p>
                        </div>
 
                        <div className="history-tabs" style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                            <small style={{ color: '#6b7280' }}>{t('farmer_finance.showingRegion')}: <strong>{user.assignedAsc?.name || t('common.assignedCenter')}</strong></small>
                        </div>
 
                        <div className="form-card" style={{ padding: '20px' }}>
                            {loadingClaims ? (
                                <p>{t('common.loading')}</p>
                            ) : myClaims.length === 0 ? (
                                <p>{t('farmer_finance.emptyClaims')}</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                                <th style={{ padding: '12px' }}>{t('farmer_finance.incidentDate')}</th>
                                                <th style={{ padding: '12px' }}>{t('farmer_crop.title')}</th>
                                                <th style={{ padding: '12px' }}>{t('farmer_finance.damageType')}</th>
                                                <th style={{ padding: '12px' }}>{t('farmer_finance.tableStatus')}</th>
                                                <th style={{ padding: '12px' }}>{t('farmer_finance.estimatedLoss')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myClaims.map(claim => (
                                                <tr key={claim._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '12px' }}>{new Date(claim.incidentDate).toLocaleDateString()}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        {t(`farmer_crop.${claim.crop?.cropType.toLowerCase()}`)}<br />
                                                        <small>{claim.crop?.variety}</small>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>{t(`farmer_finance.${claim.damageType.toLowerCase()}`)}</td>
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
                                                        {claim.estimatedLoss > 0 ? `LKR ${claim.estimatedLoss.toLocaleString()}` : <span style={{ color: '#6b7280', fontSize: '12px' }}>{t('farmer_finance.pendingEstimation')}</span>}
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
