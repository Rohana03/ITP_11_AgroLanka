import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const CROP_ICONS = {
    rice: '🌾', vegetables: '🥦', fruits: '🍎', spices: '🌶️',
    tea: '🍵', coconut: '🥥', rubber: '🌿', coffee: '☕', other: '🌱',
    paddy: '🌾', corn: '🌽', tomato: '🍅', potato: '🥔',
};

const STATUS_CONFIG = {
    APPROVED: { bg: '#dcfce7', color: '#166534', border: '#10b981', label: '✅ Approved', icon: '✅' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b', border: '#f87171', label: '❌ Rejected', icon: '❌' },
    PENDING:  { bg: '#fef3c7', color: '#92400e', border: '#f59e0b', label: '⏳ Pending', icon: '⏳' },
};

const MyCrops = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const fetchMyCrops = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/crops', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (res.ok) setCrops(data);
                else setError(data.message || t('common.error'));
            } catch {
                setError(t('common.error'));
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMyCrops();
    }, [user, t]);

    const filtered = filter === 'ALL' ? crops : crops.filter(c => c.status === filter);
    const counts = {
        ALL: crops.length,
        APPROVED: crops.filter(c => c.status === 'APPROVED').length,
        PENDING:  crops.filter(c => c.status === 'PENDING').length,
        REJECTED: crops.filter(c => c.status === 'REJECTED').length,
    };

    const getCropIcon = (type) => CROP_ICONS[type?.toLowerCase()] || '🌱';

    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                {/* Header */}
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← {t('common.backToDashboard')}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h1>🌾 {t('farmer_crop.headerList')}</h1>
                            <p>{t('farmer_crop.subtitleList')}</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/farmer/register-crop')}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            + {t('farmer_crop.createNew')}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {!loading && !error && crops.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                        {[
                            { key: 'ALL',      label: 'All Crops',  icon: '🌱', color: '#3b82f6', bg: '#eff6ff' },
                            { key: 'APPROVED', label: 'Approved',   icon: '✅', color: '#10b981', bg: '#ecfdf5' },
                            { key: 'PENDING',  label: 'Pending',    icon: '⏳', color: '#f59e0b', bg: '#fffbeb' },
                            { key: 'REJECTED', label: 'Rejected',   icon: '❌', color: '#ef4444', bg: '#fef2f2' },
                        ].map(({ key, label, icon, color, bg }) => (
                            <div
                                key={key}
                                onClick={() => setFilter(key)}
                                style={{
                                    backgroundColor: filter === key ? color : bg,
                                    border: `2px solid ${filter === key ? color : 'transparent'}`,
                                    borderRadius: '12px', padding: '16px', textAlign: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: filter === key ? `0 4px 14px ${color}40` : '0 2px 8px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{icon}</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: filter === key ? '#fff' : color }}>{counts[key]}</div>
                                <div style={{ fontSize: '0.78rem', color: filter === key ? 'rgba(255,255,255,0.9)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌱</div>
                        <p style={{ fontSize: '1.1rem' }}>{t('common.loading')}</p>
                    </div>
                ) : error ? (
                    <div className="alert-error">{error}</div>
                ) : crops.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🌱</div>
                        <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>{t('farmer_crop.emptyList')}</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Register your first crop to start tracking your harvest.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/farmer/register-crop')}>
                            + {t('farmer_crop.createNew')}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', color: '#64748b' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                        <p>No crops with <strong>{filter}</strong> status.</p>
                        <button onClick={() => setFilter('ALL')} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>Show all crops</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {filtered.map((crop) => {
                            const st = STATUS_CONFIG[crop.status] || STATUS_CONFIG.PENDING;
                            const cropKey = crop.cropType?.toLowerCase();
                            return (
                                <div key={crop._id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    borderTop: `4px solid ${st.border}`,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                                >
                                    {/* Card Header */}
                                    <div style={{ padding: '20px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                                                {getCropIcon(crop.cropType)}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: '700', textTransform: 'capitalize' }}>
                                                    {crop.cropType}
                                                </h3>
                                                {crop.variety && crop.variety !== 'N/A' && (
                                                    <p style={{ margin: '2px 0 0', fontSize: '0.83rem', color: '#64748b' }}>{crop.variety}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: '700', padding: '4px 10px',
                                            borderRadius: '20px', backgroundColor: st.bg, color: st.color,
                                            border: `1px solid ${st.border}`, whiteSpace: 'nowrap'
                                        }}>
                                            {st.icon} {crop.status}
                                        </span>
                                    </div>

                                    {/* Card Stats */}
                                    <div style={{ display: 'flex', borderTop: '1px solid #f1f5f9' }}>
                                        {[
                                            { label: t('farmer_crop.landSize'), value: crop.landSize ? `${crop.landSize} ac` : '—', icon: '📐' },
                                            { label: t('farmer_crop.season'),   value: (crop.season && crop.season !== 'N/A') ? crop.season : '—',        icon: '🗓️' },
                                            { label: 'Year',                    value: crop.year || '—',                                                   icon: '📅' },
                                        ].map(({ label, value, icon }) => (
                                            <div key={label} style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{icon}</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{value}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Notes Section */}
                                    {crop.notes && (
                                        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', fontSize: '0.83rem', color: '#64748b', fontStyle: 'italic' }}>
                                            💬 "{crop.notes}"
                                        </div>
                                    )}

                                    {/* ASC Center */}
                                    {crop.asc?.name && (
                                        <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc' }}>
                                            🏛️ <span>{crop.asc.name}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCrops;
