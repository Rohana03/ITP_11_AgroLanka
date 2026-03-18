import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './RiceLeafDetection.css';

const RiceLeafDetection = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleScan = async () => {
        if (!image) return;

        setLoading(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('file', image);

        try {
            const response = await axios.post('http://localhost:5000/api/ai/detect-rice-leaf', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setResult(response.data);
        } catch (err) {
            console.error('Detection error:', err);
            setError(err.response?.data?.message || 'Failed to scan leaf. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="leaf-detection-page">
            <Navbar />
            <div className="leaf-detection-container">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/farmer-dashboard'); }} className="back-link">
                    ← {t('common.backToDashboard')}
                </a>

                <header className="detection-header">
                    <h1>{t('farmer.leafDiagnostic')} 🌾</h1>
                    <p>{t('farmer.leafDiagnosticDesc')}</p>
                </header>

                <div className="upload-section">
                    <div 
                        className={`drop-zone ${preview ? 'has-image' : ''}`}
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="Leaf Preview" className="preview-image" />
                                {loading && (
                                    <div className="scanner-overlay">
                                        <div className="scanner-line"></div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="upload-text">
                                <div className="upload-icon">📸</div>
                                <p><strong>{t('farmer.uploadPrompt')}</strong></p>
                                <p>{t('farmer.uploadHint')}</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button 
                        className="scan-btn" 
                        onClick={handleScan}
                        disabled={!image || loading}
                    >
                        {loading ? (
                            <><span>⏳</span> {t('farmer.scanning')}</>
                        ) : (
                            <><span>🔍</span> {t('farmer.scanLeaf')}</>
                        )}
                    </button>
                </div>

                {result && (
                    <div className="results-section">
                        <div className="result-card">
                            <div className="result-header">
                                <div>
                                    <small>{t('farmer.detectedDisease')}</small>
                                    <h2>{result.class_name}</h2>
                                </div>
                                <div className="confidence-badge">
                                    {t('farmer.confidence')}: {(result.confidence * 100).toFixed(1)}%
                                </div>
                            </div>
                            <div className="result-body">
                                <div className="info-block symptoms-block">
                                    <h3>🧪 {t('farmer.symptoms')}</h3>
                                    <p>{result.symptoms}</p>
                                </div>
                                <div className="info-block recommendations-block">
                                    <h3>💡 {t('farmer.recommendations')}</h3>
                                    <p>{result.recommendations}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <button 
                                className="scan-btn" 
                                style={{ background: '#64748b', margin: '0 auto' }}
                                onClick={() => {
                                    setImage(null);
                                    setPreview(null);
                                    setResult(null);
                                }}
                            >
                                🔄 {t('farmer.tryAgain')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiceLeafDetection;
