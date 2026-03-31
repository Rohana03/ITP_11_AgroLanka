import React from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import './About.css';

const About = () => {
    const { t } = useLanguage();

    const team = [
        { name: t('about_page.member1Name'), role: t('about_page.member1Role'), img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop' },
        { name: t('about_page.member2Name'), role: t('about_page.member2Role'), img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&auto=format&fit=crop' },
        { name: t('about_page.member3Name'), role: t('about_page.member3Role'), img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=400&auto=format&fit=crop' },
        { name: t('about_page.member4Name'), role: t('about_page.member4Role'), img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&h=400&auto=format&fit=crop' }
    ];

    return (
        <div className="about-page">
            <Navbar />

            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <h1>{t('about_page.heroTitle')}</h1>
                    <p>{t('about_page.heroSubtitle')}</p>
                </div>
            </section>

            {/* Story Section */}
            <section className="about-section">
                <div className="story-container">
                    <div className="story-image">
                        <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop" alt="Sri Lankan Field" />
                    </div>
                    <div className="story-text">
                        <h3>{t('about_page.storyTitle')}</h3>
                        <p>{t('about_page.storyText1')}</p>
                        <p>{t('about_page.storyText2')}</p>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="about-section" style={{ backgroundColor: '#fff' }}>
                <div className="mission-box">
                    <h2>{t('about_page.missionTitle')}</h2>
                    <p>{t('about_page.missionText')}</p>
                </div>
            </section>



            {/* Tech Stack Section */}
            <section className="about-section" style={{ textAlign: 'center' }}>
                <div className="section-title">
                    <h2>Built with Modern Tech</h2>
                </div>
                <div className="tech-stack">
                    <span className="tech-tag">React</span>
                    <span className="tech-tag">Node.js</span>
                    <span className="tech-tag">Express</span>
                    <span className="tech-tag">MongoDB</span>
                    <span className="tech-tag">Vite</span>
                    <span className="tech-tag">Context API</span>
                </div>
            </section>

        </div>
    );
};

export default About;
