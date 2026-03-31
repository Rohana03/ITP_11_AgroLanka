import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const RegisterCrop = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [formData, setFormData] = useState({
        cropType: '',
        variety: '',
        landSize: '',
        season: '',
        location: user?.assignedAsc?.district || '',
        soilType: '',
        assignedAsc: user?.assignedAsc?._id || user?.assignedAsc || ''
    });
    const [ascs, setAscs] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(user?.assignedAsc?.district || '');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const errors = {};
        if (!formData.cropType) errors.cropType = t('farmer_crop.typeRequiredError') || "Crop type is required.";
        
        if (['rice', 'vegetables', 'fruits', 'spices', 'other'].includes(formData.cropType)) {
            if (!formData.variety || formData.variety.trim().length === 0) {
                errors.variety = t('farmer_crop.varietyRequiredError') || "Variety is required.";
            }
        }

        if (!formData.landSize || parseFloat(formData.landSize) <= 0) {
            errors.landSize = t('farmer_crop.invalidLandSizeError') || "Land size must be greater than 0.";
        }

        if (!formData.soilType) errors.soilType = t('farmer_crop.soilRequiredError') || "Soil type is required.";

        if (formData.cropType === 'rice' && (!formData.season || formData.season === '')) {
            errors.season = t('farmer_crop.seasonRequiredError') || "Season is required for rice.";
        }

        if (!selectedDistrict) errors.district = t('auth.districtRequiredError') || "District is required.";
        if (!formData.assignedAsc) errors.assignedAsc = t('farmer_crop.ascRequiredError') || "Assigned ASC is required.";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const FieldError = ({ message }) => (
        message ? <div className="field-error" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{message}</div> : null
    );

    React.useEffect(() => {
        const varietyNeeded = ['rice', 'vegetables', 'fruits', 'spices', 'other'].includes(formData.cropType);
        if (!varietyNeeded && formData.cropType !== '') {
            setFormData(prev => ({ ...prev, variety: 'General' }));
        }

        // Handle Season
        if (formData.cropType === 'rice') {
            if (formData.season === 'N/A') setFormData(prev => ({ ...prev, season: '' }));
        } else if (formData.cropType !== '') {
            setFormData(prev => ({ ...prev, season: 'N/A' }));
        }
    }, [formData.cropType]);

    React.useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                setAscs(data);

                // Get unique districts
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);

                // If user has an assigned ASC and NOT in edit mode, pre-fill it
                if (user?.assignedAsc && !isEditMode) {
                    setFormData(prev => ({
                        ...prev,
                        assignedAsc: user.assignedAsc._id || user.assignedAsc,
                        location: user.assignedAsc.district
                    }));
                }
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };
        fetchAscs();
    }, [user, isEditMode]);

    React.useEffect(() => {
        if (id) {
            const fetchCrop = async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/crops/${id}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setFormData({
                            cropType: data.cropType || '',
                            variety: data.variety || '',
                            landSize: data.landSize || '',
                            season: data.season || '',
                            location: data.location || '',
                            soilType: data.soilType || '',
                            assignedAsc: data.assignedAsc?._id || data.assignedAsc || ''
                        });
                        if (data.location) setSelectedDistrict(data.location);
                    } else {
                        setError('Failed to load crop details');
                    }
                } catch (err) {
                    setError('Error loading crop details');
                }
            };
            fetchCrop();
        }
    }, [id]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear field error when user types
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const url = isEditMode ? `http://localhost:5000/api/crops/${id}` : 'http://localhost:5000/api/crops';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(isEditMode ? 'Crop updated successfully. It is now pending review.' : (t('farmer_crop.successReg') || 'Crop registered successfully!'));
                setFieldErrors({});
                setTimeout(() => {
                    navigate('/farmer-dashboard');
                }, 3000);
            } else {
                setError(data.message || 'Failed to register crop');
            }
        } catch (err) {
            setError('Server error during crop registration');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← {t('common.back')}
                    </button>
                    <h1>🌱 {isEditMode ? 'Update Crop' : t('farmer_crop.title')}</h1>
                    <p>{isEditMode ? 'Update your crop registration details below' : t('farmer_crop.subtitle')}</p>
                    <button className="view-btn" onClick={() => navigate('/farmer/my-crops')}>
                        {t('farmer_crop.viewRequests')} →
                    </button>
                </div>

                <div className="form-card">
                    {success && <div className="alert-success">{success}</div>}
                    {error && <div className="alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('farmer_crop.cropType')} *</label>
                                <select name="cropType" value={formData.cropType} onChange={handleChange} required>
                                    <option value="">{t('farmer_crop.selectType')}</option>
                                    <option value="rice">{t('farmer_crop.rice')}</option>
                                    <option value="vegetables">{t('farmer_crop.vegetables')}</option>
                                    <option value="fruits">{t('farmer_crop.fruits')}</option>
                                    <option value="spices">{t('farmer_crop.spices')}</option>
                                    <option value="tea">{t('farmer_crop.tea')}</option>
                                    <option value="coconut">{t('farmer_crop.coconut')}</option>
                                    <option value="rubber">{t('farmer_crop.rubber')}</option>
                                    <option value="coffee">{t('farmer_crop.coffee')}</option>
                                    <option value="other">{t('auth.other')}</option>
                                </select>
                                <FieldError message={fieldErrors.cropType} />
                            </div>

                            {formData.cropType === 'rice' ? (
                                <div className="form-group">
                                    <label>{t('farmer_crop.variety')} *</label>
                                    <select
                                        name="variety"
                                        value={formData.variety}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Rice Variety</option>
                                        <optgroup label="Samba Types">
                                            <option value="Samba">Samba</option>
                                            <option value="Keeri Samba">Keeri Samba</option>
                                            <option value="Sudu Samba">Sudu Samba</option>
                                        </optgroup>
                                        <optgroup label="Nadu Types">
                                            <option value="Nadu">Nadu</option>
                                            <option value="Sudu Nadu">Sudu Nadu</option>
                                            <option value="Rathu Nadu">Rathu Nadu</option>
                                        </optgroup>
                                        <optgroup label="Traditional Types">
                                            <option value="Suwandel">Suwandel</option>
                                            <option value="Kalu Heenati">Kalu Heenati</option>
                                            <option value="Pachchaperumal">Pachchaperumal</option>
                                            <option value="Kuruluthuda">Kuruluthuda</option>
                                            <option value="Maa Wee">Maa Wee</option>
                                            <option value="Madathawalu">Madathawalu</option>
                                        </optgroup>
                                        <optgroup label="Improved Varieties">
                                            <option value="Bg Varieties">Bg Varieties (Batalagoda)</option>
                                            <option value="At Varieties">At Varieties (Ambalantota)</option>
                                            <option value="Ld Varieties">Ld Varieties (Bombuwela)</option>
                                        </optgroup>
                                        <option value="Other">Other</option>
                                    </select>
                                    <FieldError message={fieldErrors.variety} />
                                </div>
                            ) : ['vegetables', 'fruits', 'spices', 'other'].includes(formData.cropType) && (
                                <div className="form-group">
                                    <label>{t('farmer_crop.variety')} *</label>
                                    <input
                                        type="text"
                                        name="variety"
                                        value={formData.variety}
                                        onChange={handleChange}
                                        placeholder={t('farmer_crop.varietyPlaceholder')}
                                        required
                                    />
                                    <FieldError message={fieldErrors.variety} />
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('farmer_crop.landSize')} *</label>
                                <input
                                    type="number"
                                    name="landSize"
                                    value={formData.landSize}
                                    onChange={handleChange}
                                    step="0.1"
                                    min="0.1"
                                    placeholder="e.g., 2.5"
                                    required
                                />
                                <FieldError message={fieldErrors.landSize} />
                            </div>
  
                            <div className="form-group">
                                <label>{t('farmer_crop.soilType')} *</label>
                                <select name="soilType" value={formData.soilType} onChange={handleChange} required>
                                    <option value="">{t('farmer_crop.selectSoil')}</option>
                                    <option value="clay">{t('farmer_crop.clay')}</option>
                                    <option value="sandy">{t('farmer_crop.sandy')}</option>
                                    <option value="loamy">{t('farmer_crop.loamy')}</option>
                                    <option value="silt">{t('farmer_crop.silt')}</option>
                                    <option value="peat">{t('farmer_crop.peat')}</option>
                                </select>
                                <FieldError message={fieldErrors.soilType} />
                            </div>
                        </div>

                        {formData.cropType === 'rice' && (
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>{t('farmer_crop.season')} *</label>
                                <select name="season" value={formData.season} onChange={handleChange} required>
                                    <option value="">{t('farmer_crop.selectSeason')}</option>
                                    <option value="Yala">{t('farmer_crop.yala')}</option>
                                    <option value="Maha">{t('farmer_crop.maha')}</option>
                                </select>
                                <FieldError message={fieldErrors.season} />
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>{t('auth.district')} *</label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => {
                                    const district = e.target.value;
                                    setSelectedDistrict(district);
                                    setFormData(prev => ({
                                        ...prev,
                                        assignedAsc: '',
                                        location: district
                                    }));
                                }}
                                required
                            >
                                <option value="">{t('auth.district')}</option>
                                {districts.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                            <FieldError message={fieldErrors.district} />
                        </div>

                        <div className="form-group">
                            <label>{t('farmer_crop.selectAsc')} *</label>
                            <select
                                name="assignedAsc"
                                value={formData.assignedAsc}
                                onChange={handleChange}
                                required
                                disabled={!selectedDistrict}
                            >
                                <option value="">{selectedDistrict ? t('farmer_crop.selectAsc') : t('farmer_crop.selectDistrictFirst')}</option>
                                {ascs
                                    .filter(asc => asc.district === selectedDistrict)
                                    .map(asc => (
                                        <option key={asc._id} value={asc._id}>{asc.name}</option>
                                    ))
                                }
                            </select>
                            <FieldError message={fieldErrors.assignedAsc} />
                            <small className="form-text text-muted">{t('farmer_crop.supportNote')}</small>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')} disabled={isSubmitting}>
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? (t('common.processing') || "Processing...") : (isEditMode ? 'Update' : (t('common.save') || "Save"))}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterCrop;
