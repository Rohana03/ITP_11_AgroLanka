import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import {
    validateEmail, validateNIC, validatePhone, validatePassword
} from '../utils/validators';
import './Auth.css';

/* Inline error helper */
const FieldError = ({ msg }) =>
    msg ? <small style={{ color: '#dc2626', display: 'block', marginTop: '4px', fontSize: '0.78rem' }}>{msg}</small> : null;

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [nic, setNic] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('FARMER');
    const [assignedAsc, setAssignedAsc] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [serviceDistricts, setServiceDistricts] = useState([]);
    const [ascs, setAscs] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const { register } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                setAscs(data);
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };
        fetchAscs();
    }, []);

    /* Validate a single field and update fieldErrors */
    const validateField = (field, value) => {
        let msg = null;
        switch (field) {
            case 'name':
                if (!value.trim()) msg = 'Full name is required.';
                else if (value.trim().length < 3) msg = 'Name must be at least 3 characters.';
                break;
            case 'email': msg = validateEmail(value); break;
            case 'nic':   msg = validateNIC(value);   break;
            case 'phone': msg = validatePhone(value); break;
            case 'password': msg = validatePassword(value); break;
            default: break;
        }
        setFieldErrors(prev => ({ ...prev, [field]: msg }));
        return msg;
    };

    const validateAll = () => {
        const errors = {
            name:     validateField('name', name),
            email:    validateField('email', email),
            nic:      validateField('nic', nic),
            phone:    validateField('phone', phone),
            password: validateField('password', password),
        };
        // Extra: PRODUCT_MANAGER must select at least one district
        if (role === 'PRODUCT_MANAGER' && serviceDistricts.length === 0) {
            errors.serviceDistricts = t('auth.atLeastOne');
        }
        setFieldErrors(errors);
        return Object.values(errors).every(v => !v);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateAll()) return;     // stop if client-side errors exist

        setSubmitting(true);
        try {
            const res = await register(name, email, nic, phone, password, role, assignedAsc, specialization, serviceDistricts);
            if (res.success) {
                navigate('/login', { state: { message: t('auth.successReg') } });
            } else {
                setError(res.message || 'Registration failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container">
                <div className="auth-card">
                    <h2>{t('auth.registerTitle')}</h2>

                    {/* Global server error */}
                    {error && <div className="alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Full Name */}
                        <div className="form-group">
                            <label>{t('auth.fullName')}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={(e) => validateField('name', e.target.value)}
                                style={fieldErrors.name ? { borderColor: '#dc2626' } : {}}
                                placeholder="e.g. Nuwan Perera"
                            />
                            <FieldError msg={fieldErrors.name} />
                        </div>

                        {/* NIC */}
                        <div className="form-group">
                            <label>{t('auth.nic')}</label>
                            <input
                                type="text"
                                value={nic}
                                onChange={(e) => setNic(e.target.value)}
                                onBlur={(e) => validateField('nic', e.target.value)}
                                style={fieldErrors.nic ? { borderColor: '#dc2626' } : {}}
                                placeholder="e.g. 881234567V or 198812345678"
                            />
                            <FieldError msg={fieldErrors.nic} />
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label>{t('auth.email')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={(e) => validateField('email', e.target.value)}
                                style={fieldErrors.email ? { borderColor: '#dc2626' } : {}}
                                placeholder="e.g. nuwan@email.com"
                            />
                            <FieldError msg={fieldErrors.email} />
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label>{t('auth.phone')} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(Optional)</span></label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onBlur={(e) => validateField('phone', e.target.value)}
                                style={fieldErrors.phone ? { borderColor: '#dc2626' } : {}}
                                placeholder={t('auth.enterPhone')}
                            />
                            <FieldError msg={fieldErrors.phone} />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label>{t('auth.password')}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={(e) => validateField('password', e.target.value)}
                                    style={fieldErrors.password ? { borderColor: '#dc2626' } : {}}
                                    placeholder="Min 8 chars, include a number"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? t('auth.hidePass') : t('auth.showPass')}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <FieldError msg={fieldErrors.password} />
                        </div>

                        {/* Role */}
                        <div className="form-group">
                            <label>{t('auth.role')}</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="FARMER">{t('dashboard.roleFarmer')}</option>
                                <option value="ASC_OFFICER">{t('dashboard.roleAsc')}</option>
                                <option value="FINANCIAL_OFFICER">{t('dashboard.roleFinancial')}</option>
                                <option value="CROP_OFFICER">{t('dashboard.roleCrop')}</option>
                                <option value="PRODUCT_MANAGER">{t('dashboard.roleProduct')}</option>
                                <option value="MACHINERY_OFFICER">{t('dashboard.roleMachinery')}</option>
                            </select>
                        </div>

                        {/* Service Districts (Product Manager) */}
                        {(role === 'PRODUCT_MANAGER') && (
                            <div className="form-group">
                                <label style={{ marginBottom: '10px', display: 'block' }}>
                                    {t('auth.serviceDistricts')} ({t('auth.selectDistricts')}) *
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: '10px', padding: '15px',
                                    backgroundColor: '#f9fafb', borderRadius: '8px',
                                    border: fieldErrors.serviceDistricts ? '1px solid #dc2626' : '1px solid #e5e7eb',
                                    maxHeight: '200px', overflowY: 'auto'
                                }}>
                                    {districts.map(district => (
                                        <label key={district} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            <input
                                                type="checkbox"
                                                value={district}
                                                checked={serviceDistricts.includes(district)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked
                                                        ? [...serviceDistricts, district]
                                                        : serviceDistricts.filter(d => d !== district);
                                                    setServiceDistricts(updated);
                                                    if (updated.length > 0) setFieldErrors(prev => ({ ...prev, serviceDistricts: null }));
                                                }}
                                            />
                                            {district}
                                        </label>
                                    ))}
                                </div>
                                <FieldError msg={fieldErrors.serviceDistricts} />
                            </div>
                        )}

                        {/* District + ASC (non Product Manager roles) */}
                        {(role !== 'PRODUCT_MANAGER' && (role === 'FARMER' || role === 'ASC_OFFICER' || role === 'STORE_OFFICER' || role === 'FINANCIAL_OFFICER' || role === 'CROP_OFFICER' || role === 'MACHINERY_OFFICER')) && (
                            <>
                                <div className="form-group">
                                    <label>{t('auth.district')}</label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => {
                                            setSelectedDistrict(e.target.value);
                                            setAssignedAsc('');
                                        }}
                                        required={role === 'FARMER'}
                                    >
                                        <option value="">{t('auth.district')}</option>
                                        {districts.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t('auth.asc')}</label>
                                    <select
                                        value={assignedAsc}
                                        onChange={(e) => setAssignedAsc(e.target.value)}
                                        required={role === 'FARMER'}
                                        disabled={!selectedDistrict}
                                    >
                                        <option value="">{selectedDistrict ? t('auth.selectAsc') : t('auth.selectDistrictFirst')}</option>
                                        {ascs
                                            .filter(asc => asc.district === selectedDistrict)
                                            .map(asc => (
                                                <option key={asc._id} value={asc._id}>{asc.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Specialization (Crop Officer) */}
                        {role === 'CROP_OFFICER' && (
                            <div className="form-group">
                                <label>{t('auth.specialization')}</label>
                                <select
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    required
                                >
                                    <option value="">{t('auth.selectSpecialization')}</option>
                                    <option value="Paddy (වී)">{t('auth.paddy')} (වී)</option>
                                    <option value="Vegetables (එළවළු)">{t('auth.vegetables')} (එළවළු)</option>
                                    <option value="Fruits (පලතුරු)">{t('auth.fruits')} (පලතුරු)</option>
                                    <option value="Spices (කුළුබඩු)">{t('auth.spices')} (කුළුබඩු)</option>
                                    <option value="Export Crops (අපනයන බෝග)">{t('auth.exportCrops')} (අපනයන බෝග)</option>
                                    <option value="Other">{t('auth.other')}</option>
                                </select>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                            {submitting ? 'Registering...' : t('auth.registerBtn')}
                        </button>
                    </form>

                    <p className="auth-footer">
                        {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
