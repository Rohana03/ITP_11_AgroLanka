import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FarmerDashboard.css'; // We will create this css file next

const FarmerDashboard = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [ascs, setAscs] = React.useState([]);
    const [districts, setDistricts] = React.useState([]);
    const [selectedDistrict, setSelectedDistrict] = React.useState('');
    const [selectedAsc, setSelectedAsc] = React.useState('');
    const [isEditingAsc, setIsEditingAsc] = React.useState(false);
    const [isEditingPhone, setIsEditingPhone] = React.useState(false);
    const [newPhone, setNewPhone] = React.useState(user?.phone || '');
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                setAscs(data);
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };
        fetchAscs();
    }, []);

    const handleUpdateAsc = async () => {
        if (!selectedAsc) return;
        setSaving(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/update-asc', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ assignedAsc: selectedAsc })
            });

            const data = await response.json();
            if (response.ok) {
                updateUser(data);
                setIsEditingAsc(false);
            }
        } catch (err) {
            console.error('Error updating ASC:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ phone: newPhone })
            });

            const data = await response.json();
            if (response.ok) {
                updateUser(data);
                setIsEditingPhone(false);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1>{t('dashboard.welcome')}, {user.name || 'Farmer'}! 🌾</h1>
                            <p>{t('farmer.manageActivities')}</p>
                        </div>

                        <div className="asc-status-card" style={{
                            backgroundColor: '#fff',
                            padding: '15px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            border: '1px solid #e2e8f0',
                            maxWidth: '350px'
                        }}>
                            {!isEditingAsc ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>{t('farmer.yourCenter')}</span>
                                        <button
                                            onClick={() => setIsEditingAsc(true)}
                                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            {t('farmer.change')}
                                        </button>
                                    </div>
                                    {user.assignedAsc ? (
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>📍 {user.assignedAsc.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.assignedAsc.district} {t('auth.district')}</div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.9rem' }}>⚠️ {t('farmer.noCenter')}</div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '10px' }}>{t('farmer.selectNewCenter')}</div>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                        style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="">{t('auth.district')}</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select
                                        value={selectedAsc}
                                        onChange={(e) => setSelectedAsc(e.target.value)}
                                        disabled={!selectedDistrict}
                                        style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    >
                                        <option value="">{t('auth.asc')}</option>
                                        {ascs.filter(a => a.district === selectedDistrict).map(a => (
                                            <option key={a._id} value={a._id}>{a.name}</option>
                                        ))}
                                    </select>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleUpdateAsc}
                                            disabled={saving || !selectedAsc}
                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                        >
                                            {saving ? t('common.loading') : t('common.save')}
                                        </button>
                                        <button
                                            onClick={() => setIsEditingAsc(false)}
                                            disabled={saving}
                                            style={{ backgroundColor: '#cbd5e1', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Phone Status Card */}
                        <div className="asc-status-card" style={{
                            backgroundColor: '#fff',
                            padding: '15px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            border: '1px solid #e2e8f0',
                            maxWidth: '350px',
                            marginLeft: '15px'
                        }}>
                            {!isEditingPhone ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>{t('farmer.phoneNumber')}</span>
                                        <button
                                            onClick={() => setIsEditingPhone(true)}
                                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            {t('farmer.edit')}
                                        </button>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>📞 {user.phone || 'Not added'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('farmer.primaryContact')}</div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '10px' }}>{t('farmer.updatePhone')}</div>
                                    <input
                                        type="text"
                                        value={newPhone}
                                        onChange={(e) => setNewPhone(e.target.value)}
                                        placeholder={t('farmer.enterPhone')}
                                        style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={saving}
                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                        >
                                            {saving ? '...' : t('common.save')}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditingPhone(false); setNewPhone(user.phone || ''); }}
                                            disabled={saving}
                                            style={{ backgroundColor: '#cbd5e1', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* Block 1: Register Crop */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/register-crop')}>
                        <div className="card-inner">
                            <div className="card-front">
                                <div className="card-icon">🌱</div>
                                <h3>{t('farmer.registerCrop')}</h3>
                                <p>{t('farmer.registerCropDesc')}</p>
                            </div>
                            <div className="card-back">
                                <h3>{t('farmer.registerCrop')}</h3>
                                <p>{t('farmer.registerCropBack')}</p>
                                <div className="go-btn">{t('common.viewAll')} →</div>
                            </div>
                        </div>
                    </div>

                    {/* Block 2: Financial Assistance and Compensation */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/financial-aid')}>
                        <div className="card-inner">
                            <div className="card-front">
                                <div className="card-icon">💰</div>
                                <h3>{t('farmer.financialAid')}</h3>
                                <p>{t('farmer.financialAidDesc')}</p>
                            </div>
                            <div className="card-back">
                                <h3>{t('farmer.financialAid')}</h3>
                                <p>{t('farmer.financialAidBack')}</p>
                                <div className="go-btn">{t('common.viewAll')} →</div>
                            </div>
                        </div>
                    </div>

                    {/* Block 3: Machinery and Service */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/machinery')}>
                        <div className="card-inner">
                            <div className="card-front">
                                <div className="card-icon">🚜</div>
                                <h3>{t('farmer.machineryHub')}</h3>
                                <p>{t('farmer.machineryHubDesc')}</p>
                            </div>
                            <div className="card-back">
                                <h3>{t('farmer.machineryHub')}</h3>
                                <p>{t('farmer.machineryHubBack')}</p>
                                <div className="go-btn">{t('common.viewAll')} →</div>
                            </div>
                        </div>
                    </div>

                    {/* Block 4: Agricultural Products */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/products')}>
                        <div className="card-inner">
                            <div className="card-front">
                                <div className="card-icon">🛒</div>
                                <h3>{t('farmer.agriProducts')}</h3>
                                <p>{t('farmer.agriProductsDesc')}</p>
                            </div>
                            <div className="card-back">
                                <h3>{t('farmer.agriProducts')}</h3>
                                <p>{t('farmer.agriProductsBack')}</p>
                                <div className="go-btn">{t('common.viewAll')} →</div>
                            </div>
                        </div>
                    </div>

                    {/* Block 5: Sell Harvest */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/sell-harvest')}>
                        <div className="card-inner">
                            <div className="card-front">
                                <div className="card-icon">📈</div>
                                <h3>{t('farmer.sellHarvest')}</h3>
                                <p>{t('farmer.sellHarvestDesc')}</p>
                            </div>
                            <div className="card-back">
                                <h3>{t('farmer.sellHarvest')}</h3>
                                <p>{t('farmer.sellHarvestBack')}</p>
                                <div className="go-btn">{t('common.viewAll')} →</div>
                            </div>
                        </div>
                    </div>

                    {/* Block 6: Rice Leaf Diagnostic AI */}
                    <div className="dashboard-card" onClick={() => navigate('/farmer/leaf-detection')}>
                        <div className="card-inner">
                            <div className="card-front">
                                <div className="card-icon">🔍</div>
                                <h3>{t('farmer.leafDiagnostic')}</h3>
                                <p>{t('farmer.leafDiagnosticDesc')}</p>
                            </div>
                            <div className="card-back">
                                <h3>{t('farmer.leafDiagnostic')}</h3>
                                <p>{t('farmer.leafDiagnosticBack')}</p>
                                <div className="go-btn">{t('common.viewAll')} →</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
