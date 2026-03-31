import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FarmerPages.css';
import './MyCrops.css';

const CROP_ICONS = {
    rice: '🌾', vegetables: '🥦', fruits: '🍎', spices: '🌶️',
    tea: '🍵', coconut: '🥥', rubber: '🌿', coffee: '☕', other: '🌱',
    paddy: '🌾', corn: '🌽', tomato: '🍅', potato: '🥔',
};

const CROP_COLORS = {
    rice: '#10b981', paddy: '#10b981',
    vegetables: '#22c55e',
    fruits: '#f59e0b',
    spices: '#ef4444',
    tea: '#84cc16',
    coconut: '#f97316',
    rubber: '#64748b',
    coffee: '#92400e',
    other: '#6366f1',
    corn: '#eab308',
    tomato: '#dc2626',
    potato: '#d97706',
};

const STATUS_CONFIG = {
    APPROVED: {
        bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        color: '#15803d',
        border: '#86efac',
        label: 'Approved',
        icon: '✅',
        dot: '#22c55e',
    },
    REJECTED: {
        bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        color: '#b91c1c',
        border: '#fca5a5',
        label: 'Rejected',
        icon: '❌',
        dot: '#ef4444',
    },
    PENDING: {
        bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        color: '#92400e',
        border: '#fcd34d',
        label: 'Pending Review',
        icon: '⏳',
        dot: '#f59e0b',
    },
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch { return '—'; }
};

const MyCrops = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [expandedCard, setExpandedCard] = useState(null);

    const fetchMyCrops = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:5000/api/crops', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Sort by newest first
                const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setCrops(sortedData);
            } else setError(data.message || t('common.error'));
        } catch {
            setError(t('common.error'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        if (user) fetchMyCrops();
    }, [user, fetchMyCrops]);

    const getCropIcon = (type) => CROP_ICONS[type?.toLowerCase()] || '🌱';
    const getCropColor = (type) => CROP_COLORS[type?.toLowerCase()] || '#6366f1';

    const filtered = crops
        .filter(c => filter === 'ALL' || c.status === filter)
        .filter(c => !search || c.cropType?.toLowerCase().includes(search.toLowerCase()) || c.variety?.toLowerCase().includes(search.toLowerCase()));

    const counts = {
        ALL:      crops.length,
        APPROVED: crops.filter(c => c.status === 'APPROVED').length,
        PENDING:  crops.filter(c => c.status === 'PENDING').length,
        REJECTED: crops.filter(c => c.status === 'REJECTED').length,
    };

    const FILTER_TABS = [
        { key: 'ALL',      label: 'All Crops',  icon: '🌱', color: '#3b82f6', bg: '#eff6ff', activeBg: '#3b82f6' },
        { key: 'APPROVED', label: 'Approved',   icon: '✅', color: '#22c55e', bg: '#f0fdf4', activeBg: '#22c55e' },
        { key: 'PENDING',  label: 'Pending',    icon: '⏳', color: '#f59e0b', bg: '#fffbeb', activeBg: '#f59e0b' },
        { key: 'REJECTED', label: 'Rejected',   icon: '❌', color: '#ef4444', bg: '#fef2f2', activeBg: '#ef4444' },
    ];

    return (
        <div className="farmer-page mycrops-page">
            <Navbar />
            <div className="mycrops-container">
                {/* ── Header ── */}
                <div className="mycrops-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← {t('common.backToDashboard')}
                    </button>
                    <div className="mycrops-title-row">
                        <div>
                            <h1 className="mycrops-title">🌾 {user?.name}'s {t('farmer_crop.headerList')}</h1>
                            <p className="mycrops-subtitle">{t('farmer_crop.subtitleList')}</p>
                        </div>
                        <div className="mycrops-header-actions">
                            <button
                                className="mycrops-refresh-btn"
                                onClick={() => fetchMyCrops(true)}
                                disabled={refreshing}
                                title="Refresh"
                            >
                                <span className={refreshing ? 'spin' : ''}>↻</span>
                            </button>
                            <button
                                className="btn btn-primary mycrops-new-btn"
                                onClick={() => navigate('/farmer/register-crop')}
                            >
                                + {t('farmer_crop.createNew')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Summary Filter Cards ── */}
                {!loading && !error && crops.length > 0 && (
                    <div className="mycrops-stats">
                        {FILTER_TABS.map(({ key, label, icon, color, bg, activeBg }) => {
                            const isActive = filter === key;
                            return (
                                <button
                                    key={key}
                                    className={`mycrops-stat-card ${isActive ? 'active' : ''}`}
                                    onClick={() => setFilter(key)}
                                    style={{
                                        '--stat-color': color,
                                        '--stat-bg': bg,
                                        '--stat-active': activeBg,
                                    }}
                                >
                                    <span className="mycrops-stat-icon">{icon}</span>
                                    <span className="mycrops-stat-count">{counts[key]}</span>
                                    <span className="mycrops-stat-label">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Search Bar ── */}
                {!loading && !error && crops.length > 0 && (
                    <div className="mycrops-search-row">
                        <div className="mycrops-search-box">
                            <span className="mycrops-search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by crop type or variety…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="mycrops-search-input"
                            />
                            {search && (
                                <button className="mycrops-search-clear" onClick={() => setSearch('')}>✕</button>
                            )}
                        </div>
                        <span className="mycrops-results-count">
                            {filtered.length} crop{filtered.length !== 1 ? 's' : ''} found
                        </span>
                    </div>
                )}

                {/* ── Content ── */}
                {loading ? (
                    <div className="mycrops-loading">
                        <div className="mycrops-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-leaf">🌱</div>
                        </div>
                        <p>{t('common.loading')}</p>
                    </div>
                ) : error ? (
                    <div className="mycrops-error-box">
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚠️</div>
                        <p>{error}</p>
                        <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={() => fetchMyCrops()}>
                            Try Again
                        </button>
                    </div>
                ) : crops.length === 0 ? (
                    <div className="mycrops-empty">
                        <div className="mycrops-empty-art">🌱</div>
                        <h2>{t('farmer_crop.emptyList')}</h2>
                        <p>Register your first crop to start tracking your harvest and accessing ASC services.</p>
                        <button className="btn btn-primary mycrops-empty-btn" onClick={() => navigate('/farmer/register-crop')}>
                            + {t('farmer_crop.createNew')}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="mycrops-no-match">
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                        <p>No crops match your <strong>{filter !== 'ALL' ? filter.toLowerCase() : ''}</strong> {search ? `"${search}"` : ''} filter.</p>
                        <button
                            onClick={() => { setFilter('ALL'); setSearch(''); }}
                            className="mycrops-clear-filter"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="mycrops-grid">
                        {filtered.map((crop) => {
                            const st = STATUS_CONFIG[crop.status] || STATUS_CONFIG.PENDING;
                            const cropColor = getCropColor(crop.cropType);
                            const isExpanded = expandedCard === crop._id;

                            return (
                                <div
                                    key={crop._id}
                                    className={`mycrops-card ${isExpanded ? 'expanded' : ''}`}
                                    style={{ '--crop-color': cropColor }}
                                >
                                    {/* Card top accent bar */}
                                    <div className="mycrops-card-accent" />

                                    {/* Card Header */}
                                    <div className="mycrops-card-header">
                                        <div className="mycrops-card-icon-wrap">
                                            <span className="mycrops-card-icon">{getCropIcon(crop.cropType)}</span>
                                        </div>
                                        <div className="mycrops-card-title-group">
                                            <h3 className="mycrops-card-title">{crop.cropType}</h3>
                                            {crop.variety && crop.variety !== 'N/A' && (
                                                <p className="mycrops-card-variety">{crop.variety}</p>
                                            )}
                                        </div>
                                        <span className="mycrops-status-badge" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                                            <span className="status-dot" style={{ background: st.dot }} />
                                            {st.label}
                                        </span>
                                    </div>

                                    {/* Divider */}
                                    <div className="mycrops-card-divider" />

                                    {/* Stats row */}
                                    <div className="mycrops-card-stats">
                                        <div className="mycrops-stat-item">
                                            <span className="stat-icon">📐</span>
                                            <span className="stat-value">{crop.landSize ? `${crop.landSize} ac` : '—'}</span>
                                            <span className="stat-label">{t('farmer_crop.landSize') || 'Land Size'}</span>
                                        </div>
                                        <div className="mycrops-stat-item">
                                            <span className="stat-icon">🗓️</span>
                                            <span className="stat-value">{(crop.season && crop.season !== 'N/A') ? crop.season : '—'}</span>
                                            <span className="stat-label">{t('farmer_crop.season') || 'Season'}</span>
                                        </div>
                                        <div className="mycrops-stat-item">
                                            <span className="stat-icon">🌍</span>
                                            <span className="stat-value">{crop.soilType || '—'}</span>
                                            <span className="stat-label">Soil Type</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '10px', padding: '10px 18px', borderTop: '1px solid #f1f5f9' }}>
                                        <button
                                            className="mycrops-expand-btn"
                                            onClick={() => setExpandedCard(isExpanded ? null : crop._id)}
                                            style={{ flex: 1, borderTop: 'none', padding: '8px 0', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}
                                        >
                                            {isExpanded ? '▲ Hide details' : '▼ More details'}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate(`/farmer/edit-crop/${crop._id}`)}
                                            style={{ flex: 1, padding: '8px 0', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                        >
                                            ✏️ Update
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="mycrops-card-details">
                                            {crop.plantingDate && (
                                                <div className="detail-row">
                                                    <span className="detail-icon">🌱</span>
                                                    <span className="detail-label">Planting Date</span>
                                                    <span className="detail-value">{formatDate(crop.plantingDate)}</span>
                                                </div>
                                            )}
                                            {crop.expectedHarvest && (
                                                <div className="detail-row">
                                                    <span className="detail-icon">🌾</span>
                                                    <span className="detail-label">Expected Harvest</span>
                                                    <span className="detail-value">{formatDate(crop.expectedHarvest)}</span>
                                                </div>
                                            )}
                                            {crop.location && (
                                                <div className="detail-row">
                                                    <span className="detail-icon">📍</span>
                                                    <span className="detail-label">Location</span>
                                                    <span className="detail-value">{crop.location}</span>
                                                </div>
                                            )}
                                            {crop.notes && (
                                                <div className="detail-row detail-notes">
                                                    <span className="detail-icon">💬</span>
                                                    <span className="detail-label">Notes</span>
                                                    <span className="detail-value">{crop.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ASC Center footer */}
                                    {crop.assignedAsc?.name && (
                                        <div className="mycrops-card-footer">
                                            <span>🏛️</span>
                                            <span>{crop.assignedAsc.name}</span>
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
