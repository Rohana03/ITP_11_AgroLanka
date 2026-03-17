import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FarmerPages.css';
 
const SellHarvest = () => {
    const { user, token } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'sales'
    const [listings, setListings] = useState([]);
    const [sales, setSales] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [newListing, setNewListing] = useState({
        name: '', category: 'Other', description: '', price: '', unit: 'kg', image: ''
    });
 
    useEffect(() => {
        fetchMyListings();
        fetchMySales();
    }, []);
 
    const fetchMyListings = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/products/my-listings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setListings(data);
        } catch (err) { console.error(err); }
    };
 
    const fetchMySales = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/purchases/my-sales', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setSales(data);
        } catch (err) { console.error(err); }
    };
 
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setNewListing({ ...newListing, image: reader.result });
            reader.readAsDataURL(file);
        }
    };
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newListing)
            });
            if (res.ok) {
                setMessage(t('farmer_market.listingPublished'));
                setNewListing({ name: '', category: 'Other', description: '', price: '', unit: 'kg', image: '' });
                setShowForm(false);
                fetchMyListings();
            } else {
                const data = await res.json();
                setMessage(data.message);
            }
        } catch (err) { console.error(err); }
    };
 
    const handleDelete = async (id) => {
        if (!window.confirm(t('common.confirmDelete'))) return;
        try {
            const res = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setListings(listings.filter(l => l._id !== id));
                setMessage(t('farmer_market.listingDeleted'));
            }
        } catch (err) { console.error(err); }
    };
 
    const handlePrintReceipt = (sale) => {
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>AgroLanka Sale Receipt</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
                h2 { color: #059669; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                .label { color: #64748b; width: 45%; }
                .total { font-size: 1.5rem; font-weight: 700; color: #059669; text-align: center; margin: 20px 0; padding: 16px; background: #ecfdf5; border-radius: 10px; }
                .footer { text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 30px; }
            </style></head>
            <body>
                <div style="text-align:center;margin-bottom:20px">
                    <div style="font-size:2rem">🌿 AgroLanka</div>
                    <h2>${t('farmer_market.receiptTitle')}</h2>
                    <div style="color:#64748b;font-size:0.85rem">${new Date(sale.createdAt).toLocaleString()}</div>
                </div>
                <div style="text-align:center;background:#eff6ff;padding:8px;border-radius:6px;font-family:monospace;margin-bottom:20px">${t('farmer_market.receiptNum')} # ${sale.receiptNumber}</div>
                <table>
                    <tr><td class="label">${t('farmer_market.tableCrop')}</td><td><strong>${sale.productName}</strong></td></tr>
                    <tr><td class="label">${t('farmer_market.quantity')}</td><td>${sale.quantity}</td></tr>
                    <tr><td class="label">${t('farmer_market.buyer')}</td><td>${sale.buyer?.name}</td></tr>
                    <tr><td class="label">${t('farmer_market.buyerEmail')}</td><td>${sale.buyer?.email}</td></tr>
                    <tr><td class="label">${t('farmer_market.method')}</td><td>${sale.paymentMethod}</td></tr>
                    <tr><td class="label">${t('farmer_finance.tableStatus')}</td><td>${sale.status}</td></tr>
                </table>
                <div class="total">LKR ${Number(sale.amount).toLocaleString()}</div>
                <div class="footer">${t('farmer_market.receiptFooter')} 🌾</div>
            </body></html>
        `);
        win.document.close();
        win.print();
    };
 
    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← {t('common.backToDashboard')}
                    </button>
                    <h1>💰 {t('farmer_market.title')}</h1>
                    <p>{t('farmer_market.subtitle')}</p>
                </div>
 
                {message && (
                    <div className="alert-success" style={{ marginBottom: '20px' }}>{message}</div>
                )}
 
                <div className="content-card">
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                        {[
                            ['listings', `📋 ${t('farmer_market.tabListings')}`], 
                            ['sales', `🧾 ${t('farmer_market.tabSales')}`]
                        ].map(([key, label]) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                style={{
                                    padding: '10px 5px', border: 'none', background: 'none', cursor: 'pointer',
                                    borderBottom: activeTab === key ? '3px solid #059669' : 'none',
                                    fontWeight: activeTab === key ? '600' : '400',
                                    color: activeTab === key ? '#065f46' : '#64748b'
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>
 
                    {/* ── My Listings Tab ── */}
                    {activeTab === 'listings' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>{t('farmer_market.activeListings')}</h3>
                                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                                    {showForm ? t('common.cancel') : t('farmer_market.createNew')}
                                </button>
                            </div>
 
                            {showForm && (
                                <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label>{t('farmer_market.cropName')}</label>
                                            <input type="text" value={newListing.name} onChange={e => setNewListing({ ...newListing, name: e.target.value })} required placeholder="e.g. Red Onions" />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('farmer_market.price')}</label>
                                            <input type="number" value={newListing.price} onChange={e => setNewListing({ ...newListing, price: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('farmer_market.unit')}</label>
                                            <input type="text" value={newListing.unit} onChange={e => setNewListing({ ...newListing, unit: e.target.value })} required placeholder="e.g. 500kg, 20 Tons" />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('farmer_market.image')}</label>
                                            <input type="file" accept="image/*" onChange={handleImageChange} required />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label>{t('farmer_market.description')}</label>
                                        <textarea value={newListing.description} onChange={e => setNewListing({ ...newListing, description: e.target.value })} required placeholder="Quality, grade, pick-up location..." rows="4" />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>{t('farmer_market.postListing')}</button>
                                </form>
                            )}
 
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{t('farmer_market.tableImage')}</th>
                                            <th>{t('farmer_market.tableCrop')}</th>
                                            <th>{t('farmer_market.tablePriceQty')}</th>
                                            <th>{t('farmer_finance.tableStatus')}</th>
                                            <th>{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listings.map(l => (
                                            <tr key={l._id}>
                                                <td>
                                                    {l.image
                                                        ? <img src={l.image} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                                        : <div style={{ width: '50px', height: '50px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>🌾</div>
                                                    }
                                                </td>
                                                <td><strong>{l.name}</strong></td>
                                                <td>LKR {l.price} / {l.unit}</td>
                                                <td>
                                                    {(() => {
                                                        const statusMap = {
                                                            'Active': { label: `✅ ${t('farmer_market.statusAvailable')}`, bg: '#dcfce7', color: '#166534' },
                                                            'Out of Stock': { label: `🏷️ ${t('farmer_market.statusSold')}`, bg: '#ede9fe', color: '#5b21b6' },
                                                            'Pending': { label: `⏳ ${t('farmer_market.statusPending')}`, bg: '#fef3c7', color: '#92400e' },
                                                            'Rejected': { label: `❌ ${t('farmer_market.statusRejected')}`, bg: '#fee2e2', color: '#991b1b' },
                                                        };
                                                        const s = statusMap[l.status] || { label: l.status, bg: '#f1f5f9', color: '#475569' };
                                                        return (
                                                            <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', backgroundColor: s.bg, color: s.color, fontWeight: '600' }}>
                                                                {s.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td>
                                                    <button onClick={() => handleDelete(l._id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>{t('common.delete')}</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {listings.length === 0 && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>{t('farmer_market.emptyListings')}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
 
                    {/* ── My Sales Tab ── */}
                    {activeTab === 'sales' && (
                        <>
                            <div style={{ marginBottom: '20px' }}>
                                <h3>{t('farmer_market.saleHistory')}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('farmer_market.saleHistoryDesc')}</p>
                            </div>
 
                            {sales.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌾</div>
                                    <p>{t('farmer_market.emptySales')}</p>
                                    <p style={{ fontSize: '0.85rem' }}>{t('farmer_market.emptySalesTip')}</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('farmer_market.receiptNum')} #</th>
                                                <th>{t('farmer_market.tableCrop')}</th>
                                                <th>{t('farmer_market.buyer')}</th>
                                                <th>{t('farmer_market.amount')}</th>
                                                <th>{t('farmer_market.method')}</th>
                                                <th>{t('farmer_market.date')}</th>
                                                <th>{t('farmer_market.receipt')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map(s => (
                                                <tr key={s._id}>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#3b82f6' }}>{s.receiptNumber}</td>
                                                    <td><strong>{s.productName}</strong><br /><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.quantity}</span></td>
                                                    <td>
                                                        <div>{s.buyer?.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.buyer?.email}</div>
                                                    </td>
                                                    <td style={{ fontWeight: '700', color: '#059669' }}>LKR {s.amount?.toLocaleString()}</td>
                                                    <td>{s.paymentMethod}</td>
                                                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <button onClick={() => handlePrintReceipt(s)} className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
                                                            🖨️ {t('common.print')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
 
export default SellHarvest;
