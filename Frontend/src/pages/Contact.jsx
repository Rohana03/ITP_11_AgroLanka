import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import './Contact.css';

const Contact = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Thank you! Your message has been sent to itprojectg11@gmail.com');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="contact-page">
            <Navbar />

            {/* Hero Section */}
            <section className="contact-hero">
                <div className="contact-hero-content">
                    <h1>{t('contact_page.heroTitle')}</h1>
                    <p>{t('contact_page.heroSubtitle')}</p>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="contact-container">
                {/* Info Card */}
                <aside className="contact-info-card">
                    <h3>{t('contact_page.infoTitle')}</h3>

                    <div className="info-item">
                        <div className="info-icon">📧</div>
                        <div className="info-text">
                            <h4>{t('contact_page.emailInfo')}</h4>
                            <p>itprojectg11@gmail.com</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">📞</div>
                        <div className="info-text">
                            <h4>{t('contact_page.phoneInfo')}</h4>
                            <p>+94 11 234 5678</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">📍</div>
                        <div className="info-text">
                            <h4>{t('contact_page.addressInfo')}</h4>
                            <p>No. 45, Agrarian Road, Colombo 03</p>
                        </div>
                    </div>
                </aside>

                {/* Form Card */}
                <main className="contact-form-card">
                    <h3>{t('contact_page.formTitle')}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('contact_page.nameLabel')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('contact_page.emailLabel')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label>{t('contact_page.subjectLabel')}</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>{t('contact_page.messageLabel')}</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '15px' }}>
                            {t('contact_page.sendButton')}
                        </button>
                    </form>
                </main>
            </div>

            {/* Map Placeholder Section */}
            <section className="map-section">
                <div className="section-title">
                    <h2>{t('contact_page.locationTitle')}</h2>
                </div>
                <div className="map-placeholder">
                    {/* Visual placeholder for map */}
                </div>
            </section>

        </div>
    );
};

export default Contact;
