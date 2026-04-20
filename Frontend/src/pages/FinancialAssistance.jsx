import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './FarmerPages.css';

const FieldError = ({ message }) => (
    message ? <div className="field-error" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{message}</div> : null
);

const FinancialAssistance = () => {
    const { user, token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('loan'); // 'loan', 'compensation', 'my-loans', or 'my-repayments'
    const [interestRate, setInterestRate] = useState(8);
    const [monthlyInstallment, setMonthlyInstallment] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [crops, setCrops] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [myLoans, setMyLoans] = useState([]);
    const [myRepayments, setMyRepayments] = useState([]);
    const [loadingClaims, setLoadingClaims] = useState(false);
    const [loadingLoans, setLoadingLoans] = useState(false);
    const [loadingRepayments, setLoadingRepayments] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [repaymentReceipt, setRepaymentReceipt] = useState(null);

    const [editingLoan, setEditingLoan] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [loanImage, setLoanImage] = useState(null);
 
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
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation helpers
    const validateLoanForm = () => {
        const errors = {};
        if (!loanData.loanAmount) errors.loanAmount = t('farmer_finance.selectAmountError');
        if (!loanData.purpose) errors.purpose = t('farmer_finance.selectPurposeError');
        if (!loanData.collateral || loanData.collateral.trim().length < 10) {
            errors.collateral = t('farmer_finance.collateralMinLengthError') || "Collateral must be at least 10 characters.";
        }
        // Validate loan image file size if provided (max 2 MB)
        if (loanImage && loanImage.size > 2 * 1024 * 1024) {
            errors.loanImage = "Image must be under 2 MB. Please choose a smaller file.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateRepaymentForm = () => {
        const errors = {};
        if (!repaymentAmount || parseFloat(repaymentAmount) <= 0) {
            errors.repaymentAmount = t('farmer_finance.invalidAmountError') || "Please enter a valid positive amount.";
        }
        
        // Check if repayment amount exceeds remaining balance
        if (selectedLoan && repaymentAmount) {
            const remainingBalance = Math.max(0, (selectedLoan.totalPayable || selectedLoan.amount) - (selectedLoan.totalPaid || 0));
            if (parseFloat(repaymentAmount) > remainingBalance) {
                errors.repaymentAmount = `Amount cannot exceed remaining balance of LKR ${remainingBalance.toLocaleString()}. Please pay only the remaining amount.`;
            }
        }
        
        if (!repaymentReceipt) {
            errors.repaymentReceipt = t('farmer_finance.receiptError');
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateCompensationForm = () => {
        const errors = {};
        if (!compensationData.crop) errors.crop = t('farmer_finance.selectCropError');
        if (!compensationData.damageType) errors.damageType = t('farmer_finance.selectDamageTypeError') || "Please select damage type.";
        if (!compensationData.incidentDate) errors.incidentDate = t('farmer_finance.dateRequiredError') || "Incident date is required.";
        else if (new Date(compensationData.incidentDate) > new Date()) {
            errors.incidentDate = t('farmer_finance.futureDateError') || "Date cannot be in the future.";
        }
        if (!compensationData.affectedArea || parseFloat(compensationData.affectedArea) <= 0) {
            errors.affectedArea = t('farmer_finance.invalidAreaError') || "Affected area must be greater than 0.";
        }
        if (!compensationData.damageDescription || compensationData.damageDescription.trim().length < 10) {
            errors.damageDescription = t('farmer_finance.descriptionMinLengthError') || "Please provide at least 10 characters.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
 
    useEffect(() => {
        fetchInterestRate();
        if (user && user.role === 'FARMER') {
            fetchCrops();
            fetchMyClaims();
            fetchMyLoans();
            fetchMyRepayments();
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
 
    const fetchMyRepayments = async () => {
        try {
            setLoadingRepayments(true);
            const res = await axios.get('http://localhost:5000/api/loans/repayments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📋 Fetched farmer repayments:', res.data.map(r => ({ 
                id: r._id, 
                status: r.status,
                amount: r.amount,
                hasAdminNotes: !!r.adminNotes,
                adminNotesPreview: r.adminNotes?.substring(0, 40)
            })));
            setMyRepayments(res.data);
        } catch (err) {
            console.error("Error fetching repayments:", err);
        } finally {
            setLoadingRepayments(false);
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
 
    const hasOutstandingLoan = () => {
        if (!myLoans || myLoans.length === 0) return false;
        
        return myLoans.some(loan => {
            // Check if loan is PENDING
            if (loan.status === 'PENDING') return true;
            
            // Check if loan is APPROVED but not fully paid
            if (loan.status === 'APPROVED') {
                const totalPayable = loan.totalPayable || loan.amount;
                const totalPaid = loan.totalPaid || 0;
                return totalPaid < totalPayable;
            }
            
            return false;
        });
    };

    const handleLoanSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!validateLoanForm()) return;
        if (!termsAccepted) {
            setError(t('farmer_finance.termsError'));
            return;
        }

        // Check for outstanding loans
        if (hasOutstandingLoan()) {
            setError('Please pay the existing loan payment after that you can request a new loan');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('loanAmount', loanData.loanAmount);
            formData.append('purpose', loanData.purpose);
            formData.append('repaymentPeriod', loanData.repaymentPeriod);
            formData.append('collateral', loanData.collateral);
            formData.append('interestRate', interestRate);
            formData.append('termsAccepted', termsAccepted);
            formData.append('asc', user.assignedAsc?._id || user.assignedAsc);
            if (loanImage) {
                formData.append('loanImage', loanImage);
            }

            await axios.post('http://localhost:5000/api/loans/apply', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess(t('farmer_finance.loanSuccess'));
            fetchMyLoans(); // Refresh loan list
            setLoanData({ loanAmount: '', purpose: '', repaymentPeriod: '', collateral: '' });
            setLoanImage(null);
            setMonthlyInstallment(null);
            setTermsAccepted(false);
            setFieldErrors({});
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };
 
    const handleRepaymentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
 
        if (!validateRepaymentForm()) return;

        setIsSubmitting(true);
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
            setFieldErrors({});
            fetchMyRepayments(); // Refresh repayments list
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadAllRepaymentsPDF = () => {
        try {
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(18);
            doc.setTextColor(15, 113, 115);
            doc.text('AgroLanka Financial Aid', 20, 20);
            
            // Subtitle
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('Complete Repayment Summary', 20, 30);
            
            // Divider line
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 35, 190, 35);
            
            let yPos = 45;
            
            // Group repayments by loan
            const loanGroups = {};
            myRepayments.forEach(repayment => {
                const loanId = repayment.loan?._id || 'unknown';
                if (!loanGroups[loanId]) {
                    loanGroups[loanId] = {
                        purpose: repayment.loan?.purpose || 'N/A',
                        repayments: [],
                        totalPaid: 0
                    };
                }
                loanGroups[loanId].repayments.push(repayment);
                loanGroups[loanId].totalPaid += repayment.amount || 0;
            });
            
            // Summary Statistics
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPos);
            yPos += 10;
            doc.text(`Total Repayments: ${myRepayments.length}`, 20, yPos);
            
            const totalPaid = myRepayments.reduce((sum, r) => sum + (r.amount || 0), 0);
            doc.text(`Total Amount Paid: LKR ${totalPaid?.toLocaleString()}`, 20, yPos + 10);
            yPos += 15;
            
            // Breakdown by loan
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(50, 100, 100);
            doc.text('Breakdown by Loan:', 20, yPos);
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            Object.values(loanGroups).forEach(group => {
                doc.setFontSize(9);
                doc.text(`• ${group.purpose}: LKR ${group.totalPaid?.toLocaleString()}`, 20, yPos);
                yPos += 5;
            });
            
            yPos += 8;
            
            // Table header
            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.text('Payment Details', 20, yPos);
            yPos += 8;
            
            // Create table with grouped data
            const tableData = [];
            Object.values(loanGroups).forEach(group => {
                // Add loan header row
                const loanHeaderRow = [`${group.purpose} Loan`, '', '', `Total: LKR ${group.totalPaid?.toLocaleString()}`, ''];
                tableData.push(loanHeaderRow);
                
                // Add individual repayments for this loan
                group.repayments.forEach(repayment => {
                    tableData.push([
                        repayment._id.slice(-6),
                        '',
                        new Date(repayment.paymentDate).toLocaleDateString(),
                        repayment.amount?.toLocaleString(),
                        repayment.status
                    ]);
                });
            });
            
            autoTable(doc, {
                startY: yPos,
                head: [['Receipt ID', 'Loan Type', 'Payment Date', 'Amount (LKR)', 'Status']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [15, 113, 115], textColor: 255, fontStyle: 'bold', fontSize: 10 },
                bodyStyles: { textColor: 50, fontSize: 9 },
                columnStyles: { 3: { halign: 'right' } },
                didParseCell: function(hookData) {
                    // Style loan header rows
                    if (hookData.row.index > 0) {
                        const rowData = tableData[hookData.row.index];
                        if (rowData[1] === '' && rowData[2] === '' && rowData[0].includes('Loan')) {
                            hookData.cell.styles.fontStyle = 'bold';
                            hookData.cell.styles.fillColor = [230, 245, 245];
                            hookData.cell.styles.textColor = [0, 100, 100];
                        }
                    }
                },
                margin: { top: 10 }
            });
            
            yPos = doc.lastAutoTable.finalY + 15;
            
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
            doc.text('This is an official record from AgroLanka Financial Aid System', 105, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            
            // Download
            doc.save(`All_Repayments_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Failed to generate PDF');
        }
    };
 
    const handleCompensationSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
 
        if (!validateCompensationForm()) return;

        setIsSubmitting(true);
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
            setFieldErrors({});
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditLoan = (loan) => {
        setEditingLoan({
            ...loan,
            tempAmount: loan.amount,
            tempPeriod: loan.repaymentPeriod,
            tempPurpose: loan.purpose,
            tempCollateral: loan.collateral
        });
        setError('');
        setSuccess('');
        setFieldErrors({});
    };

    const handleCancelEdit = () => {
        setEditingLoan(null);
        setFieldErrors({});
    };

    const calculateRepaymentPeriod = (amount) => {
        if (amount <= 25000) return 6;
        else if (amount <= 50000) return 18;
        else if (amount <= 100000) return 36;
        else return 48;
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        const updatedLoan = {
            ...editingLoan,
            [name]: value
        };

        // If amount changes, auto-calculate period (though amount shouldn't be editable now)
        if (name === 'tempAmount' && value) {
            updatedLoan.tempPeriod = calculateRepaymentPeriod(parseInt(value));
        }

        setEditingLoan(updatedLoan);
    };

    const handleUpdateLoan = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const errors = {};

        if (!editingLoan.tempAmount || editingLoan.tempAmount === '') {
            errors.tempAmount = t('farmer_finance.selectAmountError') || 'Please select a loan amount.';
        }

        if (!editingLoan.tempPurpose || editingLoan.tempPurpose.trim() === '') {
            errors.tempPurpose = t('farmer_finance.selectPurposeError') || 'Please select a loan purpose.';
        }

        if (!editingLoan.tempCollateral || editingLoan.tempCollateral.trim().length < 10) {
            errors.tempCollateral = t('farmer_finance.collateralMinLengthError') || 'Collateral must be at least 10 characters.';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.put(`http://localhost:5000/api/loans/${editingLoan._id}`, {
                loanAmount: editingLoan.tempAmount,
                purpose: editingLoan.tempPurpose,
                collateral: editingLoan.tempCollateral
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(t('farmer_finance.loanUpdateSuccess') || 'Loan updated successfully!');
            fetchMyLoans();
            setEditingLoan(null);
            setFieldErrors({});
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLoan = async (loanId) => {
        if (!window.confirm(t('farmer_finance.deleteConfirm') || 'Are you sure you want to delete this loan?')) {
            return;
        }

        setIsDeleting(loanId);
        try {
            await axios.delete(`http://localhost:5000/api/loans/${loanId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(t('farmer_finance.loanDeleteSuccess') || 'Loan deleted successfully!');
            fetchMyLoans();
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsDeleting(null);
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
                        className={`tab ${activeTab === 'my-repayments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-repayments')}
                    >
                        💰 My Repayments
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
                                        <option value="500000">50,0000</option>
                                    </select>
                                    <FieldError message={fieldErrors.loanAmount} />
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
                                    <FieldError message={fieldErrors.repaymentPeriod} />
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
                                    <FieldError message={fieldErrors.purpose} />
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
                                <FieldError message={fieldErrors.collateral} />
                            </div>

                            <div className="form-group">
                                <label>Image</label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => setLoanImage(e.target.files[0])}
                                    style={{
                                        padding: '10px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                />
                                {loanImage && <p style={{ fontSize: '12px', color: '#059669', marginTop: '6px' }}>✓ {loanImage.name}</p>}
                            </div>
 
                            <div className="calculation-section" style={{ 
                                margin: '2rem 0', 
                                padding: '1.5rem', 
                                background: 'rgba(27, 94, 32, 0.05)', 
                                borderRadius: '16px', 
                                border: '1px solid rgba(27, 94, 32, 0.15)',
                                backdropFilter: 'blur(8px)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#1b5e20', fontSize: '1.1rem', fontWeight: '800' }}>
                                            {t('farmer_finance.calculatorTitle')}
                                        </h4>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '1rem', color: '#374151' }}>
                                            {monthlyInstallment ? (
                                                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#166534' }}>
                                                    LKR {Number(monthlyInstallment).toLocaleString()} / {t('farmer_finance.months')}
                                                </span>
                                            ) : (
                                                t('farmer_finance.calculatorDesc')
                                            )}
                                        </p>
                                    </div>
                                    <button type="button" className="btn btn-primary" onClick={calculateInstallment} style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
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
                                <button type="submit" className="btn btn-primary" disabled={!termsAccepted || isSubmitting}>
                                    {isSubmitting ? t('common.processing') || "Processing..." : t('farmer_finance.submitLoan')}
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
                                        
                                        {loan.loanImage && (
                                            <div style={{ marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                                <img 
                                                    src={`http://localhost:5000/${loan.loanImage}`} 
                                                    alt="Loan" 
                                                    style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                        
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>LKR {loan.amount?.toLocaleString()} ({t('farmer_finance.principal')})</div>
                                        <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '10px' }}>
                                            {t('farmer_finance.totalPayable')}: <strong>LKR {(loan.totalPayable || loan.amount + (loan.amount * loan.interestRate / 100)).toLocaleString()}</strong>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 15px 0' }}>{t('farmer_finance.period')}: {loan.repaymentPeriod} {t('farmer_finance.months')} @ {loan.interestRate}%</p>
 
                                        {loan.monthlyInstallment && (
                                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4b5563' }}>
                                                <strong style={{ color: '#1f2937' }}>{t('farmer_finance.monthlyInstallment') !== 'farmer_finance.monthlyInstallment' ? t('farmer_finance.monthlyInstallment') : 'Monthly Installment'}:</strong> LKR {loan.monthlyInstallment.toLocaleString()}
                                            </p>
                                        )}

                                        {(loan.status === 'APPROVED' || loan.status === 'REJECTED') && loan.officerMessage && (
                                            <div style={{
                                                padding: '12px',
                                                backgroundColor: loan.status === 'APPROVED' ? '#ecfdf5' : '#fef2f2',
                                                borderLeft: loan.status === 'APPROVED' ? '4px solid #10b981' : '4px solid #ef4444',
                                                borderRadius: '8px',
                                                marginBottom: '15px',
                                                fontSize: '13px',
                                                color: '#1e293b'
                                            }}>
                                                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: loan.status === 'APPROVED' ? '#059669' : '#dc2626' }}>
                                                    {loan.status === 'APPROVED' ? '✅ Officer Message' : '❌ Officer Message'}
                                                </p>
                                                <p style={{ margin: 0, lineHeight: '1.5', color: '#374151' }}>{loan.officerMessage}</p>
                                            </div>
                                        )}
 
                                        {loan.status === 'APPROVED' && (
                                            <>
                                                <div style={{ marginBottom: '15px' }}>
                                                    {loan.approvedDate && (
                                                        <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', marginBottom: '12px', border: '1px solid #0284c7', textAlign: 'center' }}>
                                                            <p style={{ margin: '0 0 4px 0', color: '#0369a1', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>Loan Deadline</p>
                                                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#7c2d12' }}>
                                                                {loan.loanDeadline ? new Date(loan.loanDeadline).toLocaleDateString() : 'N/A'}
                                                            </p>
                                                        </div>
                                                    )}
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
                                                    {Math.round((loan.totalPaid / (loan.totalPayable || loan.amount)) * 100) === 100 && (
                                                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '2px solid #10b981', textAlign: 'center', fontWeight: 'bold', color: '#059669', fontSize: '14px' }}>
                                                            ✅ You have fully settled the loan
                                                        </div>
                                                    )}
                                                </div>
 
                                                {Math.round((loan.totalPaid / (loan.totalPayable || loan.amount)) * 100) < 100 && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ width: '100%' }}
                                                        onClick={() => setSelectedLoan(loan)}
                                                    >
                                                        {t('farmer_finance.submitSlip')}
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {loan.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ flex: 1, padding: '10px' }}
                                                    onClick={() => handleEditLoan(loan)}
                                                >
                                                    ✏️ {t('common.edit') || 'Edit'}
                                                </button>
                                                <button
                                                    className="btn"
                                                    style={{ 
                                                        flex: 1, 
                                                        padding: '10px', 
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                    onClick={() => handleDeleteLoan(loan._id)}
                                                    disabled={isDeleting === loan._id}
                                                >
                                                    {isDeleting === loan._id ? '⏳ Deleting...' : '🗑️ Delete'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
 
                {/* My Repayments Tab */}
                {activeTab === 'my-repayments' && (
                    <div className="history-section">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2>💰 My Repayments</h2>
                                <p>View all your submitted loan repayments</p>
                            </div>
                            {myRepayments.length > 0 && (
                                <button
                                    onClick={downloadAllRepaymentsPDF}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#1f2937',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    📄 Download All PDF
                                </button>
                            )}
                        </div>
 
                        {loadingRepayments ? (
                            <p>{t('common.loading')}</p>
                        ) : myRepayments.length === 0 ? (
                            <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
                                <p>No repayments submitted yet</p>
                                <button className="btn btn-primary" onClick={() => setActiveTab('my-loans')}>Submit a Payment</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                {myRepayments.map(repayment => (
                                    <div key={repayment._id} className="form-card" style={{ margin: 0 }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>
                                            Loan: {repayment.loan?.purpose}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>ID: {repayment._id.slice(-6)}</span>
                                            <span style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                backgroundColor: repayment.status === 'VERIFIED' ? '#f0fdf4' : repayment.status === 'PENDING' ? '#fff7ed' : '#fef2f2',
                                                color: repayment.status === 'VERIFIED' ? '#15803d' : repayment.status === 'PENDING' ? '#c2410c' : '#b91c1c'
                                            }}>{repayment.status}</span>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#059669' }}>
                                            LKR {repayment.amount?.toLocaleString()} Paid
                                        </div>
                                        <div style={{ padding: '10px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #eab308' }}>
                                            <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Remaining to Pay</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626', marginBottom: '6px' }}>
                                                LKR {Math.max(0, ((repayment.loan?.totalPayable || repayment.loan?.amount) - (repayment.loan?.totalPaid || 0)))?.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#78350f', fontStyle: 'italic' }}>
                                                = LKR {(repayment.loan?.totalPayable || repayment.loan?.amount)?.toLocaleString()} - LKR {(repayment.loan?.totalPaid || 0)?.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '10px' }}>
                                            {new Date(repayment.paymentDate).toLocaleDateString()}
                                        </div>
                                        {repayment.adminNotes ? (
                                            <div style={{
                                                padding: '14px',
                                                backgroundColor: repayment.status === 'VERIFIED' ? '#ecfdf5' : '#fef2f2',
                                                borderLeft: `4px solid ${repayment.status === 'VERIFIED' ? '#10b981' : '#ef4444'}`,
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                color: repayment.status === 'VERIFIED' ? '#065f46' : '#7f1d1d',
                                                marginTop: '12px'
                                            }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {repayment.status === 'VERIFIED' ? '✅ APPROVED BY OFFICER' : '❌ REJECTED BY OFFICER'}
                                                </div>
                                                <p style={{ margin: 0, lineHeight: '1.5', color: 'inherit' }}>{repayment.adminNotes}</p>
                                            </div>
                                        ) : repayment.status !== 'PENDING' && (
                                            <div style={{
                                                padding: '14px',
                                                backgroundColor: '#f3f4f6',
                                                borderLeft: '4px solid #9ca3af',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                color: '#475569',
                                                marginTop: '12px'
                                            }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                    Status: {repayment.status}
                                                </div>
                                                <p style={{ margin: 0, fontSize: '12px' }}>No officer notes provided.</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
 
                {/* Compensation Claim Tab */}

 
                {/* Repayment Submission Modal */}
                {selectedLoan && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className="form-card" style={{ maxWidth: '500px', width: '90%', margin: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3>{t('farmer_finance.uploadSlip')}</h3>
                                <button onClick={() => setSelectedLoan(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <p style={{ fontSize: '14px', marginBottom: '20px' }}>{t('farmer_finance.submitRepaymentFor')} <strong>{selectedLoan.purpose}</strong> {t('farmer_finance.loan')}.</p>
                            
                            <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fcd34d' }}>
                                <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: 'bold' }}>
                                    💰 Remaining to Pay: <span style={{ fontSize: '15px', color: '#b45309' }}>LKR {Math.max(0, (selectedLoan.totalPayable || selectedLoan.amount) - (selectedLoan.totalPaid || 0)).toLocaleString()}</span>
                                </p>
                            </div>
 
                            <form onSubmit={handleRepaymentSubmit}>
                                <div className="form-group">
                                    <label>{t('farmer_finance.amountPaid')} (LKR) *</label>
                                    <input
                                        type="number"
                                        value={repaymentAmount}
                                        onChange={(e) => setRepaymentAmount(e.target.value)}
                                        max={Math.max(0, (selectedLoan.totalPayable || selectedLoan.amount) - (selectedLoan.totalPaid || 0))}
                                        placeholder={t('farmer_finance.amountPlaceholder')}
                                        required
                                    />
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                        Max: LKR {Math.max(0, (selectedLoan.totalPayable || selectedLoan.amount) - (selectedLoan.totalPaid || 0)).toLocaleString()}
                                    </div>
                                    <FieldError message={fieldErrors.repaymentAmount} />
                                </div>
                                <div className="form-group">
                                    <label>{t('farmer_finance.uploadSlip')} (Photo/PDF) *</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setRepaymentReceipt(e.target.files[0])}
                                        accept="image/*,.pdf"
                                        required
                                    />
                                    <FieldError message={fieldErrors.repaymentReceipt} />
                                </div>

                                <div className="form-actions" style={{ marginTop: '20px' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => {
                                        setSelectedLoan(null);
                                    }} disabled={isSubmitting}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? t('common.processing') || "Processing..." : t('farmer_finance.submitVerification')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Loan Modal */}
                {editingLoan && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className="form-card" style={{ maxWidth: '600px', width: '90%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3>✏️ {t('common.edit') || 'Edit Loan Application'}</h3>
                                <button onClick={handleCancelEdit} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <p style={{ fontSize: '14px', marginBottom: '20px', color: '#6b7280' }}>
                                {t('farmer_finance.editPendingInfo') || 'Edit your pending loan application details'}
                            </p>

                            <form onSubmit={handleUpdateLoan}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('farmer_finance.amount')} (LKR) *</label>
                                        <select
                                            name="tempAmount"
                                            value={editingLoan.tempAmount}
                                            onChange={handleEditChange}
                                            required
                                            style={{ borderColor: fieldErrors.tempAmount ? '#ef4444' : undefined }}
                                        >
                                            <option value="">{t('common.select')}</option>
                                            <option value="25000">25,000</option>
                                            <option value="50000">50,000</option>
                                            <option value="100000">100,000</option>
                                            <option value="200000">200,000</option>
                                            <option value="300000">300,000</option>
                                            <option value="500000">500,000</option>
                                        </select>
                                        {fieldErrors.tempAmount && <div className="field-error" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.tempAmount}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label>{t('farmer_finance.period')} ({t('farmer_finance.months')})</label>
                                        <input
                                            type="text"
                                            value={`${editingLoan.tempPeriod} ${t('farmer_finance.months')}`}
                                            readOnly
                                            disabled
                                            style={{ backgroundColor: '#f3f4f6', fontWeight: '600', fontSize: '1.1rem', color: '#1f2937' }}
                                        />
                                        <small style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '4px', display: 'block' }}>{t('farmer_finance.autoPeriodCalc') || 'Auto-calculated based on loan amount'}</small>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>{t('farmer_finance.purpose')} *</label>
                                    <select 
                                        name="tempPurpose" 
                                        value={editingLoan.tempPurpose} 
                                        onChange={handleEditChange} 
                                        required
                                        style={{ borderColor: fieldErrors.tempPurpose ? '#ef4444' : undefined }}
                                    >
                                        <option value="">{t('common.select')}</option>
                                        <option value="seeds">{t('farmer_finance.seeds')}</option>
                                        <option value="fertilizer">{t('farmer_finance.fertilizer')}</option>
                                        <option value="equipment">{t('farmer_finance.equipment')}</option>
                                        <option value="land">{t('farmer_finance.land')}</option>
                                        <option value="livestock">{t('farmer_finance.livestock')}</option>
                                        <option value="other">{t('common.other')}</option>
                                    </select>
                                    {fieldErrors.tempPurpose && <div className="field-error" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.tempPurpose}</div>}
                                </div>

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
                                    <label>{t('farmer_finance.collateral')} * <span style={{ fontSize: '0.85rem', color: '#666' }}>({10} {t('farmer_finance.charMinRequired') || 'characters minimum'})</span></label>
                                    <textarea
                                        name="tempCollateral"
                                        value={editingLoan.tempCollateral}
                                        onChange={handleEditChange}
                                        placeholder={t('farmer_finance.collateralPlaceholder')}
                                        rows="3"
                                        required
                                        style={{ borderColor: fieldErrors.tempCollateral ? '#ef4444' : undefined }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px' }}>
                                        <span style={{ color: '#6b7280' }}>
                                            {editingLoan.tempCollateral.length} / 10 {t('farmer_finance.characters') || 'characters'}
                                        </span>
                                        {fieldErrors.tempCollateral && <span style={{ color: '#ef4444', fontWeight: '600' }}>{fieldErrors.tempCollateral}</span>}
                                    </div>
                                </div>

                                {editingLoan.tempAmount && editingLoan.tempPeriod && (
                                    <div className="calculation-section" style={{
                                        margin: '1.5rem 0',
                                        padding: '1rem',
                                        background: 'rgba(27, 94, 32, 0.05)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(27, 94, 32, 0.15)'
                                    }}>
                                        <p style={{ margin: 0, color: '#1b5e20', fontSize: '0.9rem' }}>
                                            <strong>{t('farmer_finance.estimatedMonthly') || 'Estimated Monthly Installment'}: </strong>
                                            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                                LKR {(
                                                    (editingLoan.tempAmount * 
                                                    ((interestRate / 100) / 12) * 
                                                    Math.pow(1 + ((interestRate / 100) / 12), editingLoan.tempPeriod)) / 
                                                    (Math.pow(1 + ((interestRate / 100) / 12), editingLoan.tempPeriod) - 1)
                                                ).toFixed(2)
                                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                            }
                                        </span>
                                        </p>
                                    </div>
                                )}

                                <div className="form-actions" style={{ marginTop: '20px' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline" 
                                        onClick={handleCancelEdit} 
                                        disabled={isSubmitting}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (t('common.processing') || "Processing...") : (t('common.save') || 'Save Changes')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
 
                {/* Claims History (Visible for both tabs if farmer) */}
                {user?.role === 'FARMER' && activeTab === 'loan' && (
                    <div className="history-section" style={{ marginTop: '40px' }}>
                        <div className="section-header">
                            <h2>📜 {t('farmer_finance.historyTitle')}</h2>
                            <p>{t('farmer_finance.trackHistory')}</p>
                        </div>
 
                        <div className="history-tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                            <small style={{ color: '#ffffff', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                {t('farmer_finance.showingRegion')}: <strong>{user.assignedAsc?.name || t('common.assignedCenter')}</strong>
                            </small>
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
