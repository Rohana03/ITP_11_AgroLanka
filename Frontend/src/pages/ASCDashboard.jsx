import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './AdminDashboard.css';

const ASCDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'overview') return;
        if (['farmers', 'staff', 'crops', 'loans', 'compensations', 'machinery'].includes(activeTab) && user?.assignedAsc) {
            fetchData(activeTab);
        }
    }, [activeTab, user]);

    const fetchData = async (type) => {
        setLoading(true);
        try {
            const ascId = user.assignedAsc?._id || user.assignedAsc;
            let url = '';

            switch (type) {
                case 'farmers': url = `http://localhost:5000/api/ascs/${ascId}/farmers`; break;
                case 'staff': url = `http://localhost:5000/api/ascs/${ascId}/staff`; break;
                case 'crops': url = `http://localhost:5000/api/crops`; break;
                case 'loans': url = `http://localhost:5000/api/loans?ascId=${ascId}`; break;
                case 'compensations': url = `http://localhost:5000/api/compensation`; break;
                case 'machinery': url = `http://localhost:5000/api/machinery/regional-data`; break;
                default: return;
            }

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (type === 'machinery') {
                // Combine machinery data for easier viewing
                const combined = [
                    ...res.data.inventory.map(i => ({ ...i, category: 'Inventory' })),
                    ...res.data.machineryRequests.map(r => ({ ...r, category: 'Request', name: r.machinery?.name }))
                ];
                setData(combined);
            } else {
                setData(res.data);
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const generateCSV = (type) => {
        if (data.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        let headers = "";

        if (type === 'farmers') headers = "Name,Email,NIC";
        else if (type === 'staff') headers = "Name,Email,Role,NIC";
        else if (type === 'crops') headers = "Farmer,Type,Variety,Land Size,Status";
        else if (type === 'loans') headers = "Farmer,Amount,Purpose,Status";
        else if (type === 'compensations') headers = "Farmer,Crop,Damage,Status";
        else if (type === 'machinery') headers = "Item,Type,Category,Status";

        csvContent += headers + "\r\n";

        data.forEach(item => {
            let row = "";
            if (type === 'farmers') row = `${item.name},${item.email},${item.nic}`;
            else if (type === 'staff') row = `${item.name},${item.email},${item.role},${item.nic}`;
            else if (type === 'crops') row = `${item.farmer?.name},${item.cropType},${item.variety},${item.landSize},${item.status}`;
            else if (type === 'loans') row = `${item.farmer?.name},${item.amount},${item.purpose},${item.status}`;
            else if (type === 'compensations') row = `${item.farmer?.name},${item.crop?.cropType},${item.damageType},${item.status}`;
            else if (type === 'machinery') row = `${item.name},${item.type},${item.category},${item.status}`;

            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${user.assignedAsc.name}_${type}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = () => {
        window.print();
    };

    const formatFarmerDisplay = (farmer) => {
        // CASE 1: Completely missing/null (Population failed)
        if (farmer === null || farmer === undefined) {
            return (
                <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '700' }}>⚠️ Unregistered Farmer</div>
                    <div style={{ fontSize: '0.7rem' }}>Link is broken in Database</div>
                </div>
            );
        }

        // CASE 2: Farmer is a String (ID not populated by Backend)
        if (typeof farmer === 'string') {
            return (
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '600' }}>🆔 ID: {farmer.substring(0, 10)}...</div>
                    <div style={{ fontSize: '0.7rem' }}>Wait: Data not populated</div>
                </div>
            );
        }

        // CASE 3: Farmer is an Object (Successful Population)
        const name = farmer.name || farmer.fullName || null;
        const nic = farmer.nic || null;
        const id = farmer._id || null;

        if (!name && !nic) return (
            <div style={{ color: '#94a3b8' }}>
                <div style={{ fontWeight: '600' }}>Anonymous Farmer</div>
                {id && <div style={{ fontSize: '0.7rem' }}>ID: {id.substring(0, 8)}</div>}
            </div>
        );

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' /* Professional Left Align */ }}>
                <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px', /* Sharper professional corners */
                    backgroundColor: '#064e3b',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {(name || 'F')[0].toUpperCase()}
                </div>
                <div>
                    <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>{name || 'No Name Set'}</div>
                    {nic && <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>🆔 {nic}</div>}
                    {!nic && id && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Ref: {id.substring(0, 8)}</div>}
                </div>
            </div>
        );
    };

    const getTableHeaders = (type) => {
        switch (type) {
            case 'farmers': return [t('auth.fullName'), t('auth.email'), t('auth.nic')];
            case 'staff': return [t('auth.fullName'), t('auth.email'), t('auth.role'), t('auth.nic')];
            case 'crops': return ['Farmer', 'Crop Type', 'Variety', 'Land Size', 'Status'];
            case 'loans': return ['Farmer', 'Amount', 'Purpose', 'Status'];
            case 'compensations': return ['Farmer', 'Crop Type', 'Damage Type', 'Status'];
            case 'machinery': return ['Item', 'Category', 'Type', 'Status'];
            default: return [];
        }
    };

    const renderTable = (type) => {
        if (type === 'products') {
            return (
                <div className="data-section" style={{ marginTop: '30px', textAlign: 'center' }}>
                    <div style={{ padding: '50px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
                        <h2>{t('dashboard.marketplace')}</h2>
                        <p style={{ color: '#7f8c8d', fontSize: '1.2rem' }}>Feature coming soon! Management of fertilizers, seeds, and equipment is under development.</p>
                        <button onClick={() => setActiveTab('overview')} style={{ marginTop: '20px', padding: '10px 25px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('common.back')}</button>
                    </div>
                </div>
            );
        }

        const headers = getTableHeaders(type);

        return (
            <div className="data-section dashboard-panel" style={{
                marginTop: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '0', /* Remove padding to let table flush with edges */
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
                    <h2 style={{ textTransform: 'capitalize', margin: 0, color: '#064e3b', fontSize: '1.5rem', fontWeight: '800' }}>
                        <span style={{ borderLeft: '6px solid #059669', paddingLeft: '15px' }}>{type.replace(/([A-Z])/g, ' $1')}</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => generateCSV(type)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>⬇️ Export CSV</button>
                        <button onClick={generatePDF} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>🖨️ Print Report</button>
                        <button onClick={() => setActiveTab('overview')} className="btn-outline" style={{ padding: '10px 20px' }}>⬅️ Back</button>
                    </div>
                </div>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <p style={{ color: '#059669', fontWeight: '600' }}>🔄 {t('common.loading')}...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                    {headers.map((h, i) => (
                                        <th key={h} style={{
                                            padding: '20px 24px',
                                            textAlign: i === 0 ? 'left' : 'center', /* Align Name/Primary Info to Left */
                                            fontWeight: '700',
                                            fontSize: '0.8rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.12em',
                                            width: i === 0 ? '35%' : i === headers.length - 1 ? '15%' : '25%'
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody style={{ backgroundColor: 'white' }}>
                                {data.map((item, index) => (
                                    <tr key={item._id} className="table-row" style={{
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', /* Elegant Zebra Striping */
                                        borderBottom: '1px solid #f1f5f9',
                                        transition: 'background 0.2s'
                                    }}>
                                        {type === 'farmers' && (
                                            <>
                                                <td style={{ padding: '18px 24px', textAlign: 'left' }}>
                                                    <div style={{ fontWeight: '700', color: '#111827' }}>{item.name}</div>
                                                </td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', color: '#4b5563' }}>{item.email}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>{item.nic}</td>
                                            </>
                                        )}
                                        {type === 'staff' && (
                                            <>
                                                <td style={{ padding: '18px 24px', textAlign: 'left' }}>{formatFarmerDisplay(item)}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', color: '#4b5563' }}>{item.email}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        backgroundColor: '#f1f5f9',
                                                        color: '#475569',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700'
                                                    }}>{item.role}</span>
                                                </td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600' }}>{item.nic}</td>
                                            </>
                                        )}
                                        {type === 'crops' && (
                                            <>
                                                <td style={{ padding: '18px 24px', textAlign: 'left' }}>{formatFarmerDisplay(item.farmer)}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', textTransform: 'capitalize', fontWeight: '600', color: '#111827' }}>{item.cropType}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', color: '#4b5563' }}>{item.variety}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600' }}>{item.landSize} <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Acres</span></td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center' }}><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                            </>
                                        )}
                                        {type === 'loans' && (
                                            <>
                                                <td style={{ padding: '18px 24px', textAlign: 'left' }}>{formatFarmerDisplay(item.farmer)}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '800', color: '#059669' }}>LKR {item.amount}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', color: '#4b5563' }}>{item.purpose}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center' }}><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                            </>
                                        )}
                                        {type === 'compensations' && (
                                            <>
                                                <td style={{ padding: '18px 24px', textAlign: 'left' }}>{formatFarmerDisplay(item.farmer)}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600' }}>{item.crop?.cropType}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>{item.damageType}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center' }}><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                            </>
                                        )}
                                        {type === 'machinery' && (
                                            <>
                                                <td style={{ padding: '18px 24px', textAlign: 'left' }}>
                                                    <div style={{ fontWeight: '700', color: '#111827' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Ref: {item.equipmentCode || 'N/A'}</div>
                                                </td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', color: '#4b5563' }}>{item.category}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600' }}>{item.type}</td>
                                                <td style={{ padding: '18px 24px', textAlign: 'center' }}><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={headers.length} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '1.1rem' }}>
                                            {t('common.error')}... No data records found for this category.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <style>
                    {`
                        .action-card:hover { border-color: #16a34a !important; }
                        .action-card:hover .btn-sm { background: #16a34a !important; color: white !important; }
                        .role-badge { background-color: #f0fdf4 !important; color: #15803d !important; border: 1px solid #dcfce7 !important; }
                        .welcome-text strong { color: #15803d; }
                        
                        .status-badge {
                            padding: 4px 10px;
                            border-radius: 9999px;
                            font-size: 0.75rem;
                            font-weight: 700;
                            text-transform: uppercase;
                        }
                        .status-badge.approved { background-color: #dcfce7; color: #166534; }
                        .status-badge.pending { background-color: #fef9c3; color: #854d0e; }
                        .status-badge.rejected { background-color: #fee2e2; color: #991b1b; }
                        
                        /* Fix for 6 cards layout (3x2) */
                        .action-grid {
                            grid-template-columns: repeat(3, 1fr) !important;
                        }
                        
                        @media (max-width: 1024px) {
                            .action-grid {
                                grid-template-columns: repeat(2, 1fr) !important;
                            }
                        }
                        
                        @media (max-width: 640px) {
                            .action-grid {
                                grid-template-columns: 1fr !important;
                            }
                        }
                        
                        @media print {
                            body * { visibility: hidden; }
                            .data-section, .data-section * { visibility: visible; }
                            .data-section { 
                                position: absolute; 
                                left: 0; 
                                top: 0; 
                                width: 100% !important; 
                                padding: 0 !important; 
                                margin: 0 !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                            .btn-outline, .btn-primary, .navbar, header, .sidebar { display: none !important; }
                            h2 { margin-bottom: 20px !important; color: #15803d !important; }
                            table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #ddd !important; }
                            th { background-color: #15803d !important; color: white !important; -webkit-print-color-adjust: exact; }
                            td { border-bottom: 1px solid #eee !important; }
                        }
                    `}
                </style>
                <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="header-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem' }}>{t('asc.dashboardTitle')} 🏛️</h1>
                            <span className="role-badge" style={{ backgroundColor: '#15803d', color: 'white', padding: '4px 12px' }}>
                                {t('dashboard.roleAsc')}
                            </span>
                        </div>
                        <p className="welcome-text" style={{ fontSize: '1.2rem', margin: 0 }}>
                            {t('dashboard.welcome')}, <strong style={{ color: '#15803d' }}>{user?.name}</strong>!
                        </p>
                        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{t('asc.manageCenter')}</p>
                    </div>

                    <div className="header-right" style={{ textAlign: 'right' }}>
                        {user?.assignedAsc ? (
                            <div style={{
                                padding: '16px 24px',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '16px',
                                border: '1px solid #dcfce7',
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '4px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{ color: '#166534', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    📍 {t('asc.assignedCenter')}
                                </div>
                                <div style={{ color: '#14532d', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    {user.assignedAsc.name}
                                </div>
                                <div style={{ color: '#166534', fontSize: '0.9rem' }}>
                                    {user.assignedAsc.district} {t('auth.district')}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '12px 20px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                <span style={{ color: '#9a3412', fontWeight: '600' }}>⚠️ {t('asc.noCenterAllocated')}</span>
                            </div>
                        )}
                    </div>
                </header>

                {activeTab !== 'overview' && (
                    <button
                        onClick={() => setActiveTab('overview')}
                        className="back-btn"
                        style={{
                            marginTop: '25px',
                            marginBottom: '-15px',
                            backgroundColor: 'white',
                            color: '#064e3b',
                            border: '1.5px solid #064e3b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.transform = 'translateX(-5px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'none'; }}
                    >
                        ⬅️ Back to Dashboard
                    </button>
                )}

                {activeTab === 'overview' ? (
                    <div className="action-grid">
                        <div className="action-card" onClick={() => setActiveTab('farmers')}>
                            <div className="card-icon">🏘️</div>
                            <h3>{t('asc.centerManagement')}</h3>
                            <p>{t('asc.centerManagementDesc')}</p>
                            <button className="btn-sm">Manage Farmers →</button>
                        </div>
                        <div className="action-card" onClick={() => setActiveTab('staff')}>
                            <div className="card-icon">👥</div>
                            <h3>{t('asc.staffCoordination')}</h3>
                            <p>{t('asc.staffCoordinationDesc')}</p>
                            <button className="btn-sm">View Staff →</button>
                        </div>
                        <div className="action-card" onClick={() => setActiveTab('crops')}>
                            <div className="card-icon">🌾</div>
                            <h3>{t('asc.cropRegs')}</h3>
                            <p>{t('asc.cropRegsDesc')}</p>
                            <button className="btn-sm">Track Crops →</button>
                        </div>
                        <div className="action-card" onClick={() => setActiveTab('loans')}>
                            <div className="card-icon">💳</div>
                            <h3>{t('asc.loanApps')}</h3>
                            <p>{t('asc.loanAppsDesc')}</p>
                            <button className="btn-sm">Review Loans →</button>
                        </div>
                        <div className="action-card" onClick={() => setActiveTab('compensations')}>
                            <div className="card-icon">📋</div>
                            <h3>{t('asc.compClaims')}</h3>
                            <p>{t('asc.compClaimsDesc')}</p>
                            <button className="btn-sm">Manage Claims →</button>
                        </div>
                        <div className="action-card" onClick={() => setActiveTab('machinery')}>
                            <div className="card-icon">🚜</div>
                            <h3>{t('asc.machineryServices')}</h3>
                            <p>{t('asc.machineryServicesDesc')}</p>
                            <button className="btn-sm">View Services →</button>
                        </div>
                    </div>
                ) : (
                    renderTable(activeTab)
                )}
            </div>
        </div>
    );
};

export default ASCDashboard;
