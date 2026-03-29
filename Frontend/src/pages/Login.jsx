import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import { validateEmail } from '../utils/validators';
import './Auth.css';

/* Inline error helper */
const FieldError = ({ msg }) =>
    msg ? <small style={{ color: '#dc2626', display: 'block', marginTop: '4px', fontSize: '0.78rem' }}>{msg}</small> : null;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message;

    const validateField = (field, value) => {
        let msg = null;
        if (field === 'email') msg = validateEmail(value);
        if (field === 'password' && !value) msg = 'Password is required.';
        setFieldErrors(prev => ({ ...prev, [field]: msg }));
        return msg;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side checks before hitting the server
        const emailErr = validateField('email', email);
        const passErr  = validateField('password', password);
        if (emailErr || passErr) return;

        setSubmitting(true);
        try {
            const res = await login(email, password);
            if (res.success) {
                const role = res.user?.role;
                if      (role === 'FARMER')           navigate('/farmer-dashboard');
                else if (role === 'ADMIN')             navigate('/admin');
                else if (role === 'FINANCIAL_OFFICER') navigate('/financial-dashboard');
                else if (role === 'CROP_OFFICER')      navigate('/crop-dashboard');
                else if (role === 'PRODUCT_MANAGER')   navigate('/product-dashboard');
                else if (role === 'MACHINERY_OFFICER') navigate('/machinery-dashboard');
                else if (role === 'ASC_OFFICER')       navigate('/asc-dashboard');
                else navigate('/');
            } else {
                setError(res.message || 'Invalid email or password. Please try again.');
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
                    <h2>{t('auth.loginTitle')}</h2>

                    {successMessage && (
                        <div className="alert-success" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' }}>
                            {successMessage}
                        </div>
                    )}

                    {/* Global server error */}
                    {error && <div className="alert-error">{error}</div>}

                    <form onSubmit={handleSubmit} noValidate>
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

                        <div className="form-group">
                            <label>{t('auth.password')}</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={(e) => validateField('password', e.target.value)}
                                    style={fieldErrors.password ? { borderColor: '#dc2626' } : {}}
                                    placeholder="Your password"
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

                        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                            {submitting ? 'Logging in...' : t('auth.loginBtn')}
                        </button>
                    </form>

                    <p className="auth-footer">
                        {t('auth.noAccount')} <Link to="/register">{t('auth.registerLink')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
