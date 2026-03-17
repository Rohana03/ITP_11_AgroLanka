import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './Auth.css';

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
    const { register } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                setAscs(data);

                // Get unique districts
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };
        fetchAscs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (role === 'PRODUCT_MANAGER' && serviceDistricts.length === 0) {
            setError(t('auth.atLeastOne'));
            return;
        }
        console.log('📝 Submitting registration form...', { role, assignedAsc, specialization, serviceDistricts });
        const res = await register(name, email, nic, phone, password, role, assignedAsc, specialization, serviceDistricts);
        console.log('📋 Registration result:', res);
        if (res.success) {
            console.log('✅ Registration successful, redirecting to login...');
            navigate('/login', { state: { message: t('auth.successReg') } });
        } else {
            console.error('❌ Registration failed:', res.message);
            setError(res.message);
        }
    };

    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container">
                <div className="auth-card">
                    <h2>{t('auth.registerTitle')}</h2>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>{t('auth.fullName')}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('auth.nic')}</label>
                            <input
                                type="text"
                                value={nic}
                                onChange={(e) => setNic(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('auth.email')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('auth.phone')}</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t('auth.enterPhone')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('auth.password')}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
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
                        </div>
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

                        {(role === 'PRODUCT_MANAGER') && (
                            <div className="form-group">
                                <label style={{ marginBottom: '10px', display: 'block' }}>{t('auth.serviceDistricts')} ({t('auth.selectDistricts')}) *</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: '10px',
                                    padding: '15px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {districts.map(district => (
                                        <label key={district} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            <input
                                                type="checkbox"
                                                value={district}
                                                checked={serviceDistricts.includes(district)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setServiceDistricts([...serviceDistricts, district]);
                                                    } else {
                                                        setServiceDistricts(serviceDistricts.filter(d => d !== district));
                                                    }
                                                }}
                                            />
                                            {district}
                                        </label>
                                    ))}
                                </div>
                                {serviceDistricts.length === 0 && <small style={{ color: '#ef4444' }}>{t('auth.atLeastOne')}</small>}
                            </div>
                        )}

                        {(role !== 'PRODUCT_MANAGER' && (role === 'FARMER' || role === 'ASC_OFFICER' || role === 'STORE_OFFICER' || role === 'FINANCIAL_OFFICER' || role === 'CROP_OFFICER' || role === 'MACHINERY_OFFICER')) && (
                            <>
                                <div className="form-group">
                                    <label>{t('auth.district')}</label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => {
                                            setSelectedDistrict(e.target.value);
                                            setAssignedAsc(''); // Reset center when district changes
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
                        <button type="submit" className="btn btn-primary btn-block">{t('auth.registerBtn')}</button>
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
