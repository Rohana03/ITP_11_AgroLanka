import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { language, switchLanguage, t } = useLanguage();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleServicesClick = (e) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        if (location.pathname === '/') {
            document.getElementById('services-showcase')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate('/', { state: { scrollToServices: true } });
        }
    };
    
    const AuthButtons = ({ isMobile }) => (
        <>
            <button
                className="btn btn-outline lang-btn"
                style={isMobile ? { width: '100%' } : {}}
                onClick={() => switchLanguage(language === 'en' ? 'si' : 'en')}
            >
                {language === 'en' ? 'සිං' : 'EN'}
            </button>

            {user ? (
                <div className="user-menu" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{t('dashboard.welcome')}, {user.name.split(' ')[0]}</span>
                    <button onClick={logout} className="btn btn-outline btn-logout" style={{ padding: '8px 16px', fontSize: '0.9rem', width: isMobile ? '100%' : 'auto' }}>{t('dashboard.logout')}</button>
                </div>
            ) : (
                <>
                    <Link to="/login" className="btn btn-outline" style={isMobile ? { width: '100%' } : {}}>{t('navbar.login')}</Link>
                    <Link to="/register" className="btn btn-primary" style={isMobile ? { width: '100%' } : {}}>{t('navbar.signup')}</Link>
                </>
            )}
        </>
    );

    return (
        <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    AgroLanka
                </Link>
                
                {/* Desktop Menu */}
                <div className="navbar-menu">
                    <Link to="/" className="navbar-item">{t('navbar.home')}</Link>
                    <Link to="/about" className="navbar-item">{t('navbar.about')}</Link>
                    <Link to="/services" className="navbar-item" onClick={handleServicesClick}>{t('navbar.services')}</Link>
                    <Link to="/contact" className="navbar-item">{t('navbar.contact')}</Link>
                    {user && <Link to="/admin" className="navbar-item">{t('dashboard.overview')}</Link>}
                </div>
                
                {/* Desktop Auth */}
                <div className="navbar-auth">
                    <AuthButtons isMobile={false} />
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="mobile-menu-btn" 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                <div className="mobile-menu-links">
                    <Link to="/" className="mobile-item">{t('navbar.home')}</Link>
                    <Link to="/about" className="mobile-item">{t('navbar.about')}</Link>
                    <Link to="/services" className="mobile-item" onClick={handleServicesClick}>{t('navbar.services')}</Link>
                    <Link to="/contact" className="mobile-item">{t('navbar.contact')}</Link>
                    {user && <Link to="/admin" className="mobile-item">{t('dashboard.overview')}</Link>}
                </div>
                <div className="mobile-menu-auth">
                    <AuthButtons isMobile={true} />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
