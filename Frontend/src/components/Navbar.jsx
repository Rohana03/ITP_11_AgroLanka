import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { language, switchLanguage, t } = useLanguage();
    const { user, logout } = useAuth();
    const location = useLocation();

    const handleServicesClick = (e) => {
        if (location.pathname === '/') {
            e.preventDefault();
            document.getElementById('services-showcase')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    AgroLanka
                </Link>
                <div className="navbar-menu">
                    <Link to="/" className="navbar-item">{t('navbar.home')}</Link>
                    <Link to="/about" className="navbar-item">{t('navbar.about')}</Link>
                    <Link to="/services" className="navbar-item" onClick={handleServicesClick}>{t('navbar.services')}</Link>
                    <Link to="/contact" className="navbar-item">{t('navbar.contact')}</Link>
                    {user && <Link to="/admin" className="navbar-item">{t('dashboard.overview')}</Link>}
                </div>
                <div className="navbar-auth">
                    <button
                        className="btn btn-outline lang-btn"
                        onClick={() => switchLanguage(language === 'en' ? 'si' : 'en')}
                    >
                        {language === 'en' ? 'SI' : 'EN'}
                    </button>

                    {user ? (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{t('dashboard.welcome')}, {user.name.split(' ')[0]}</span>
                            <button onClick={logout} className="btn btn-outline btn-logout" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>{t('dashboard.logout')}</button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-outline">{t('navbar.login')}</Link>
                            <Link to="/register" className="btn btn-primary">{t('navbar.signup')}</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
