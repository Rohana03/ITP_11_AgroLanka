import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        console.log('🔑 Submitting login form...');
        const res = await login(email, password);
        console.log('📋 Login result:', res);
        if (res.success) {
            console.log('✅ Login successful, user role:', res.user?.role);
            // Check role and redirect (roles are uppercase in backend)
            if (res.user && res.user.role === 'FARMER') {
                console.log('🚜 Redirecting to farmer dashboard...');
                navigate('/farmer-dashboard');
            } else if (res.user && res.user.role === 'ADMIN') {
                console.log('👨‍💼 Redirecting to admin panel...');
                navigate('/admin');
            } else if (res.user && res.user.role === 'FINANCIAL_OFFICER') {
                navigate('/financial-dashboard');
            } else if (res.user && res.user.role === 'CROP_OFFICER') {
                navigate('/crop-dashboard');
            } else if (res.user && res.user.role === 'PRODUCT_MANAGER') {
                navigate('/product-dashboard');
            } else if (res.user && res.user.role === 'MACHINERY_OFFICER') {
                navigate('/machinery-dashboard');
            } else if (res.user && res.user.role === 'ASC_OFFICER') {
                navigate('/asc-dashboard');
            } else {
                console.log('🏠 Redirecting to home...');
                navigate('/'); // Default fallback
            }
        } else {
            console.error('❌ Login failed:', res.message);
            setError(res.message);
        }
    };

    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container">
                <div className="auth-card">
                    <h2>{t('auth.loginTitle')}</h2>
                    {successMessage && <div className="alert-success" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' }}>{successMessage}</div>}
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
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
                        <button type="submit" className="btn btn-primary btn-block">{t('auth.loginBtn')}</button>
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
