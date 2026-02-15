import React from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import './LandingPage.css';

const LandingPage = () => {
    const { t } = useLanguage();

    return (
        <div className="landing-page">
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>{t('hero.title')}</h1>
                    <p>{t('hero.subtitle')}</p>
                    <div className="hero-buttons">
                        <button className="btn btn-primary btn-lg">{t('hero.getStarted')}</button>
                        <button className="btn btn-outline btn-lg">{t('hero.learnMore')}</button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="section-title">
                    <h2>{t('features.title')}</h2>
                    <p>{t('features.subtitle')}</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🌱</div>
                        <h3>{t('features.smartFarming')}</h3>
                        <p>{t('features.smartFarmingDesc')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🤝</div>
                        <h3>{t('features.directConnection')}</h3>
                        <p>{t('features.directConnectionDesc')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>{t('features.realTimeMarket')}</h3>
                        <p>{t('features.realTimeMarketDesc')}</p>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="about">
                <div className="about-content">
                    <h2>{t('about.title')}</h2>
                    <p>{t('about.description')}</p>
                    <button className="btn btn-primary">{t('about.readStory')}</button>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>AgroLanka</h3>
                        <p>{t('footer.brandQuote')}</p>
                    </div>
                    <div className="footer-section">
                        <h4>{t('footer.quickLinks')}</h4>
                        <ul>
                            <li><a href="#">{t('navbar.home')}</a></li>
                            <li><a href="#">{t('navbar.services')}</a></li>
                            <li><a href="#">{t('navbar.about')}</a></li>
                            <li><a href="#">{t('navbar.contact')}</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>{t('footer.contact')}</h4>
                        <p>Email: info@agrolanka.lk</p>
                        <p>Phone: +94 11 234 5678</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>{t('footer.rights')}</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
