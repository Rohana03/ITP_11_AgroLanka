import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FarmerPages.css';
 
const MyCrops = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
 
    useEffect(() => {
        const fetchMyCrops = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/crops', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setCrops(data);
                } else {
                    setError(data.message || t('common.error'));
                }
            } catch (err) {
                setError(t('common.error'));
            } finally {
                setLoading(false);
            }
        };
 
        if (user) {
            fetchMyCrops();
        }
    }, [user, t]);
 
    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return { backgroundColor: '#e6f4ea', color: '#1e7e34' };
            case 'REJECTED': return { backgroundColor: '#fce8e6', color: '#d93025' };
            case 'PENDING': return { backgroundColor: '#fef7e0', color: '#f29900' };
            default: return {};
        }
    };
 
    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer/register-crop')}>
                        ← {t('common.back')}
                    </button>
                    <h1>🌾 {t('farmer_crop.headerList')}</h1>
                    <p>{t('farmer_crop.subtitleList')}</p>
                </div>
 
                <div className="content-card">
                    {loading ? (
                        <div className="loading">{t('common.loading')}</div>
                    ) : error ? (
                        <div className="alert-error">{error}</div>
                    ) : crops.length === 0 ? (
                        <div className="empty-state">
                            <p>{t('farmer_crop.emptyList')}</p>
                            <button className="btn btn-primary" onClick={() => navigate('/farmer/register-crop')}>
                                {t('farmer_crop.createNew')}
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('farmer_crop.cropType')}</th>
                                        <th>{t('farmer_crop.variety')}</th>
                                        <th>{t('farmer_crop.landSize')}</th>
                                        <th>{t('farmer_crop.season')}</th>
                                        <th>{t('farmer_finance.tableStatus')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {crops.map((crop) => (
                                        <tr key={crop._id}>
                                            <td style={{ textTransform: 'capitalize' }}>
                                                {t(`farmer_crop.${crop.cropType.toLowerCase()}`)}
                                            </td>
                                            <td>{['rice', 'vegetables', 'fruits', 'spices', 'other', 'tea', 'coconut', 'rubber', 'coffee'].includes(crop.cropType) ? crop.variety : '-'}</td>
                                            <td>{crop.landSize}</td>
                                            <td>{crop.season === 'N/A' || !crop.season ? '-' : t(`farmer_crop.${crop.season.toLowerCase()}`)}</td>
                                            <td>
                                                <span className="status-badge" style={getStatusStyle(crop.status)}>
                                                    {crop.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
 
export default MyCrops;
