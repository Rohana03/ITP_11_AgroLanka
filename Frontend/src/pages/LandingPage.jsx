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
                        <button className="btn btn-primary btn-lg" onClick={() => window.location.href = '/register'}>{t('hero.getStarted')}</button>
                        <button
                            className="btn btn-outline btn-lg"
                            style={{ borderColor: 'white', color: 'white' }}
                            onClick={() => document.getElementById('services-showcase')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            {t('hero.learnMore')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="stats-bar">
                <div className="stat-item">
                    <h2>1,200+</h2>
                    <p>{t('landing.statFarmers')}</p>
                </div>
                <div className="stat-item">
                    <h2>25+</h2>
                    <p>{t('landing.statDistricts')}</p>
                </div>
                <div className="stat-item">
                    <h2>500+</h2>
                    <p>{t('landing.statMachinery')}</p>
                </div>
                <div className="stat-item">
                    <h2>10k+</h2>
                    <p>{t('landing.statHarvests')}</p>
                </div>
            </section>

            {/* Mission Statement (Solving Challenges) */}
            <section className="features" style={{ paddingBottom: '0' }}>
                <div className="section-title" style={{ marginBottom: '40px' }}>
                    <h2>{t('landing.missionTitle')}</h2>
                    <p>{t('landing.missionSubtitle')}</p>
                </div>
            </section>

            {/* Service Showcase Carousel */}
            <section id="services-showcase" className="carousel-section" style={{ paddingTop: '20px' }}>
                <div className="section-title">
                    <h2>{t('landing.servicesTitle')}</h2>
                </div>
                <div className="carousel-container">
                    <div className="carousel-track">
                        {[...Array(2)].map((_, i) => (
                            <React.Fragment key={i}>
                                <div className="carousel-item">
                                    <div className="service-img-container">
                                        <img src="/images/services/crop_reg.jpg" alt="Crop Registration" className="service-img" />
                                    </div>
                                    <div className="carousel-item-content">
                                        <h4>{t('landing.serviceCrop')}</h4>
                                    </div>
                                </div>
                                <div className="carousel-item">
                                    <div className="service-img-container">
                                        <img src="/images/services/machinery.jfif" alt="Machinery Booking" className="service-img" />
                                    </div>
                                    <div className="carousel-item-content">
                                        <h4>{t('landing.serviceMachinery')}</h4>
                                    </div>
                                </div>
                                <div className="carousel-item">
                                    <div className="service-img-container">
                                        <img src="/images/services/marketplace.png" alt="Marketplace" className="service-img" />
                                    </div>
                                    <div className="carousel-item-content">
                                        <h4>{t('landing.serviceMarket')}</h4>
                                    </div>
                                </div>
                                <div className="carousel-item">
                                    <div className="service-img-container">
                                        <img src="/images/services/finance.png" alt="Finance" className="service-img" />
                                    </div>
                                    <div className="carousel-item-content">
                                        <h4>{t('landing.serviceFinance')}</h4>
                                    </div>
                                </div>
                                <div className="carousel-item">
                                    <div className="service-img-container">
                                        <img src="/images/services/expert.png" alt="Expert Advisory" className="service-img" />
                                    </div>
                                    <div className="carousel-item-content">
                                        <h4>{t('landing.serviceConsult')}</h4>
                                    </div>
                                </div>

                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <div className="section-title">
                    <h2>{t('landing.testimonialsTitle')}</h2>
                </div>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="quote-icon">"</div>
                        <p>{t('landing.testimonial1')}</p>
                        <div className="author-info">
                            <div>
                                <div className="author-name">{t('landing.author1')}</div>
                                <div className="author-role">{t('landing.role1')}</div>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <div className="quote-icon">"</div>
                        <p>{t('landing.testimonial2')}</p>
                        <div className="author-info">
                            <div>
                                <div className="author-name">{t('landing.author2')}</div>
                                <div className="author-role">{t('landing.role2')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About / Impact Section */}
            <section className="about">
                <div className="about-content">
                    <h2>{t('landing.aboutTitle')}</h2>
                    <p>{t('landing.aboutDesc')}</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>AgroLanka</h3>
                        <p>{t('landing.footerQuote')}</p>
                        <div className="social-links">
                            <div className="social-btn">📱</div>
                            <div className="social-btn">📘</div>
                            <div className="social-btn">📸</div>
                        </div>
                    </div>
                    <div className="footer-section">
                        <h4>{t('landing.quickLinks')}</h4>
                        <ul>
                            <li><a href="/">{t('navbar.home')}</a></li>
                            <li><a href="/login">{t('navbar.login')}</a></li>
                            <li><a href="/register">{t('navbar.signup')}</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>{t('navbar.contact')}</h4>
                        <p>{t('landing.contactMsg')}</p>
                        <p>📞 +94 11 234 5678</p>
                        <p>Colombo, Sri Lanka</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>{t('landing.rights')}</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
