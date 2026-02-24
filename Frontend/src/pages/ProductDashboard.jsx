import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './FarmerDashboard.css';

/* ─── Receipt Print Styles (injected once) ─── */
const printStyle = `
@media print {
  body > * { display: none !important; }
  #receipt-printable { display: block !important; }
}
#receipt-printable { display: none; }
`;

const ProductDashboard = () => {
    const { user, token, updateUser } = useAuth();
    const [districts, setDistricts] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState(user?.serviceDistricts || []);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('inventory');

    // Product state
    const [myProducts, setMyProducts] = useState([]);
    const [marketplaceProducts, setMarketplaceProducts] = useState([]);
    const [myPurchases, setMyPurchases] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '', category: 'Agri Equipment', description: '', price: '', unit: 'kg', image: ''
    });

    // Payment modal state
    const [buyTarget, setBuyTarget] = useState(null);        // product being purchased
    const [payStep, setPayStep] = useState('confirm');        // 'confirm' | 'payment' | 'receipt'
    const [payMethod, setPayMethod] = useState('Card');
    const [cardFields, setCardFields] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [bankFields, setBankFields] = useState({ bank: '', accountName: '', reference: '' });
    const [processing, setProcessing] = useState(false);
    const [receipt, setReceipt] = useState(null);

    const receiptRef = useRef();

    useEffect(() => {
        const fetchAscs = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/ascs');
                const data = await res.json();
                const unique = [...new Set(data.map(a => a.district))].sort();
                setDistricts(unique);
            } catch (err) { console.error(err); }
        };
        fetchAscs();
        fetchData();
    }, [token, activeTab]);

    const fetchData = async () => {
        try {
            const [myRes, marketRes, purchaseRes] = await Promise.all([
                fetch('http://localhost:5000/api/products/my-listings', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/products/available', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/purchases/my-purchases', { headers: { 'Authorization': `Bearer ${token}` } }),
            ]);
            if (myRes.ok) setMyProducts(await myRes.json());
            if (marketRes.ok) setMarketplaceProducts(await marketRes.json());
            if (purchaseRes.ok) setMyPurchases(await purchaseRes.json());
        } catch (err) { console.error(err); }
    };

    const handleUpdateDistricts = async () => {
        if (selectedDistricts.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one district.' });
            return;
        }
        setIsUpdating(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch('http://localhost:5000/api/auth/update-districts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ serviceDistricts: selectedDistricts })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Districts updated!' });
                if (updateUser) updateUser(data);
                fetchData();
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setNewProduct({ ...newProduct, image: reader.result });
            reader.readAsDataURL(file);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newProduct)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Product listed! (Regulated categories await admin approval)' });
                setNewProduct({ name: '', category: 'Agri Equipment', description: '', price: '', unit: 'kg', image: '' });
                setShowAddForm(false);
                fetchData();
            } else {
                const d = await res.json();
                setMessage({ type: 'error', text: d.message });
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this listing?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMyProducts(myProducts.filter(p => p._id !== id));
                setMessage({ type: 'success', text: 'Product deleted.' });
            }
        } catch (err) { console.error(err); }
    };

    /* ── BUY FLOW ── */
    const openBuyModal = (product) => {
        setBuyTarget(product);
        setPayStep('confirm');
        setPayMethod('Card');
        setCardFields({ number: '', expiry: '', cvv: '', name: '' });
        setBankFields({ bank: '', accountName: '', reference: '' });
        setReceipt(null);
    };

    const closeBuyModal = () => {
        setBuyTarget(null);
        setPayStep('confirm');
        setReceipt(null);
        fetchData(); // refresh marketplace (item may now be Out of Stock)
    };

    const handleConfirmBuy = () => setPayStep('payment');

    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await fetch('http://localhost:5000/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: buyTarget._id, paymentMethod: payMethod })
            });
            const data = await res.json();
            if (res.ok) {
                setReceipt(data);
                setPayStep('receipt');
            } else {
                alert(data.message || 'Payment failed');
            }
        } catch (err) {
            alert('An error occurred. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handlePrint = () => {
        const printContents = receiptRef.current?.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>AgroLanka Receipt</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
                .receipt-header { text-align: center; margin-bottom: 30px; }
                .receipt-logo { font-size: 2rem; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                .label { color: #64748b; width: 45%; }
                .amount { font-size: 1.5rem; font-weight: 700; color: #059669; text-align: center; margin: 20px 0; }
                .footer { text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 30px; }
                .badge { background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 20px; font-size: 0.85rem; }
            </style></head><body>${printContents}</body></html>
        `);
        win.document.close();
        win.print();
    };

    const handlePrintPurchaseReceipt = (p) => {
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>AgroLanka Purchase Receipt</title>
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
                    <h2>Purchase Receipt</h2>
                    <div style="color:#64748b;font-size:0.85rem">${new Date(p.createdAt).toLocaleString()}</div>
                </div>
                <div style="text-align:center;background:#eff6ff;padding:8px;border-radius:6px;font-family:monospace;margin-bottom:20px">Receipt # ${p.receiptNumber}</div>
                <table>
                    <tr><td class="label">Crop / Item</td><td><strong>${p.productName}</strong></td></tr>
                    <tr><td class="label">Quantity</td><td>${p.quantity}</td></tr>
                    <tr><td class="label">Buyer</td><td>${p.buyer?.name || 'N/A'}</td></tr>
                    <tr><td class="label">Seller (Farmer)</td><td>${p.seller?.name}</td></tr>
                    <tr><td class="label">Seller Email</td><td>${p.seller?.email}</td></tr>
                    <tr><td class="label">Payment Method</td><td>${p.paymentMethod}</td></tr>
                    <tr><td class="label">Status</td><td>${p.status}</td></tr>
                </table>
                <div class="total">LKR ${Number(p.amount).toLocaleString()}</div>
                <div class="footer">Thank you for using AgroLanka Marketplace 🌾</div>
            </body></html>
        `);
        win.document.close();
        win.print();
    };


    const categories = [
        "Crop Protection", "Crop Nutrients", "Seeds & Planting Material",
        "Agri Equipment", "Animal Health & Nutrition", "Post-Harvest & Storage",
        "Irrigation & Water Management", "Home & Garden", "Other"
    ];

    const getStatusStyle = (s) => {
        const map = {
            'Pending': { backgroundColor: '#fef3c7', color: '#92400e' },
            'Active': { backgroundColor: '#dcfce7', color: '#166534' },
            'Rejected': { backgroundColor: '#fee2e2', color: '#991b1b' },
            'Out of Stock': { backgroundColor: '#f1f5f9', color: '#475569' },
        };
        return map[s] || { backgroundColor: '#f1f5f9', color: '#475569' };
    };

    const modalOverlay = {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    };
    const modalBox = {
        backgroundColor: '#fff', borderRadius: '16px', padding: '36px',
        width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    };

    return (
        <div className="farmer-dashboard-page">
            <style>{printStyle}</style>
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>Product Manager Dashboard 🛒</h1>
                        <p>Welcome, {user?.name}! Manage inventory and source crops from farmers.</p>
                        <div style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #3b82f6', display: 'inline-block' }}>
                            <span style={{ color: '#1e40af', fontWeight: '600' }}>📍 Operating Districts: </span>
                            <span style={{ color: '#1d4ed8' }}>
                                {user?.serviceDistricts?.length > 0 ? user.serviceDistricts.join(', ') : 'No districts selected'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* ── Main Content Card ── */}
                    <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                            {[['inventory', '📦 My Inventory'], ['marketplace', '🌾 Source from Farmers'], ['purchases', '🧾 My Purchases']].map(([key, label]) => (
                                <button key={key} onClick={() => setActiveTab(key)}
                                    style={{
                                        padding: '10px 5px', border: 'none', background: 'none', cursor: 'pointer',
                                        borderBottom: activeTab === key ? '3px solid #3b82f6' : 'none',
                                        fontWeight: activeTab === key ? '600' : '400',
                                        color: activeTab === key ? '#1e40af' : '#64748b'
                                    }}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* ── Inventory Tab ── */}
                        {activeTab === 'inventory' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3>My Product Listings</h3>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                                        {showAddForm ? 'Cancel' : '+ Add New Product'}
                                    </button>
                                </div>

                                {showAddForm && (
                                    <form onSubmit={handleAddProduct} style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label>Product Name</label>
                                                <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required placeholder="e.g. Urea Fertilizer" />
                                            </div>
                                            <div className="form-group">
                                                <label>Category</label>
                                                <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Price (LKR)</label>
                                                <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Unit</label>
                                                <input type="text" value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} required placeholder="e.g. kg, 500ml, pack" />
                                            </div>
                                            <div className="form-group">
                                                <label>Product Image</label>
                                                <input type="file" accept="image/*" onChange={handleImageChange} required />
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginTop: '15px' }}>
                                            <label>Description</label>
                                            <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required placeholder="Provide details..." rows="3" />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Publish Listing</button>
                                    </form>
                                )}

                                <div className="data-table-container">
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '12px' }}>Product</th>
                                                <th style={{ padding: '12px' }}>Category</th>
                                                <th style={{ padding: '12px' }}>Price</th>
                                                <th style={{ padding: '12px' }}>Status</th>
                                                <th style={{ padding: '12px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myProducts.map(p => (
                                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {p.image ? <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /> : <span>📦</span>}
                                                            <div>
                                                                <div style={{ fontWeight: '600' }}>{p.name}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.unit}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>{p.category}</td>
                                                    <td style={{ padding: '12px' }}>LKR {p.price}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', ...getStatusStyle(p.status) }}>{p.status}</span>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <button onClick={() => handleDeleteProduct(p._id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {myProducts.length === 0 && (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No products listed yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── Marketplace Tab ── */}
                        {activeTab === 'marketplace' && (
                            <>
                                <div style={{ marginBottom: '15px' }}>
                                    <h3>Marketplace: Crops from Farmers</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Crops available for purchase in your service districts.</p>
                                </div>
                                <div className="data-table-container">
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '12px' }}>Harvest Details</th>
                                                <th style={{ padding: '12px' }}>Farmer</th>
                                                <th style={{ padding: '12px' }}>Districts</th>
                                                <th style={{ padding: '12px' }}>Price / Qty</th>
                                                <th style={{ padding: '12px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marketplaceProducts.map(p => (
                                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            {p.image ? <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /> : <span>🌾</span>}
                                                            <div>
                                                                <div style={{ fontWeight: '600' }}>{p.name}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.description?.substring(0, 30)}...</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: '500' }}>{p.seller?.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.seller?.email}</div>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>{p.districts?.join(', ')}</td>
                                                    <td style={{ padding: '12px' }}>LKR {p.price} / {p.unit}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            style={{ backgroundColor: '#059669' }}
                                                            onClick={() => openBuyModal(p)}
                                                        >
                                                            🛒 Buy
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {marketplaceProducts.length === 0 && (
                                                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No farmer crops available in your districts.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── My Purchases Tab ── */}
                        {activeTab === 'purchases' && (
                            <>
                                <div style={{ marginBottom: '15px' }}>
                                    <h3>My Purchase History</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>All crops you have purchased from farmers.</p>
                                </div>
                                <div className="data-table-container">
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '12px' }}>Receipt #</th>
                                                <th style={{ padding: '12px' }}>Crop</th>
                                                <th style={{ padding: '12px' }}>Farmer</th>
                                                <th style={{ padding: '12px' }}>Amount</th>
                                                <th style={{ padding: '12px' }}>Method</th>
                                                <th style={{ padding: '12px' }}>Date</th>
                                                <th style={{ padding: '12px' }}>Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myPurchases.map(p => (
                                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#3b82f6' }}>{p.receiptNumber}</td>
                                                    <td style={{ padding: '12px', fontWeight: '500' }}>{p.productName}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <div>{p.seller?.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.seller?.email}</div>
                                                    </td>
                                                    <td style={{ padding: '12px', fontWeight: '600', color: '#059669' }}>LKR {p.amount?.toLocaleString()}</td>
                                                    <td style={{ padding: '12px' }}>{p.paymentMethod}</td>
                                                    <td style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <button onClick={() => handlePrintPurchaseReceipt(p)} className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>🖨️ Print</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {myPurchases.length === 0 && (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No purchases yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── District Selector ── */}
                    <div className="dashboard-card" style={{ gridColumn: 'span 1' }}>
                        <div className="card-icon">🗺️</div>
                        <h3>Manage Service Districts</h3>
                        <p style={{ marginBottom: '15px' }}>Regions where you source and sell.</p>

                        {message.text && (
                            <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '15px', backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', color: message.type === 'success' ? '#065f46' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#10b981' : '#f87171'}` }}>
                                {message.text}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' }}>
                            {districts.map(d => (
                                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                    <input type="checkbox" checked={selectedDistricts.includes(d)} onChange={(e) => {
                                        if (e.target.checked) setSelectedDistricts([...selectedDistricts, d]);
                                        else setSelectedDistricts(selectedDistricts.filter(x => x !== d));
                                    }} />
                                    {d}
                                </label>
                            ))}
                        </div>

                        <button className="btn btn-primary btn-sm btn-block" onClick={handleUpdateDistricts} disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Update Districts'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════ BUY MODAL ══════════════ */}
            {buyTarget && (
                <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeBuyModal(); }}>
                    <div style={modalBox}>

                        {/* ── Step 1: Confirm ── */}
                        {payStep === 'confirm' && (
                            <>
                                <h2 style={{ marginBottom: '5px' }}>🛒 Confirm Purchase</h2>
                                <p style={{ color: '#64748b', marginBottom: '24px' }}>Review the details before proceeding to payment.</p>

                                <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                                    {buyTarget.image && <img src={buyTarget.image} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />}
                                    <table style={{ width: '100%' }}>
                                        <tbody>
                                            {[['Crop', buyTarget.name], ['Farmer', buyTarget.seller?.name], ['Quantity', buyTarget.unit], ['Price', `LKR ${Number(buyTarget.price).toLocaleString()}`]].map(([l, v]) => (
                                                <tr key={l}>
                                                    <td style={{ color: '#64748b', padding: '6px 0', width: '40%' }}>{l}</td>
                                                    <td style={{ fontWeight: '600', padding: '6px 0' }}>{v}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={closeBuyModal} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                                    <button onClick={handleConfirmBuy} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#059669' }}>Proceed to Pay</button>
                                </div>
                            </>
                        )}

                        {/* ── Step 2: Payment ── */}
                        {payStep === 'payment' && (
                            <>
                                <h2 style={{ marginBottom: '5px' }}>💳 Payment Portal</h2>
                                <p style={{ color: '#64748b', marginBottom: '20px' }}>Amount: <strong style={{ color: '#059669', fontSize: '1.2rem' }}>LKR {Number(buyTarget.price).toLocaleString()}</strong></p>

                                {/* Method selector */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                    {['Card', 'Bank Transfer'].map(m => (
                                        <button key={m} onClick={() => setPayMethod(m)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', border: payMethod === m ? '2px solid #3b82f6' : '2px solid #e2e8f0', backgroundColor: payMethod === m ? '#eff6ff' : '#fff', color: payMethod === m ? '#1e40af' : '#64748b', fontWeight: payMethod === m ? '600' : '400' }}>
                                            {m === 'Card' ? '💳 Card' : '🏦 Bank Transfer'}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handlePayment}>
                                    {payMethod === 'Card' ? (
                                        <>
                                            <div className="form-group">
                                                <label>Cardholder Name</label>
                                                <input type="text" placeholder="As shown on card" value={cardFields.name} onChange={e => setCardFields({ ...cardFields, name: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Card Number</label>
                                                <input type="text" placeholder="1234 5678 9012 3456" maxLength="19"
                                                    value={cardFields.number}
                                                    onChange={e => setCardFields({ ...cardFields, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })}
                                                    required />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div className="form-group">
                                                    <label>Expiry (MM/YY)</label>
                                                    <input type="text" placeholder="08/27" maxLength="5" value={cardFields.expiry} onChange={e => setCardFields({ ...cardFields, expiry: e.target.value })} required />
                                                </div>
                                                <div className="form-group">
                                                    <label>CVV</label>
                                                    <input type="password" placeholder="•••" maxLength="3" value={cardFields.cvv} onChange={e => setCardFields({ ...cardFields, cvv: e.target.value })} required />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="form-group">
                                                <label>Bank Name</label>
                                                <input type="text" placeholder="e.g. Bank of Ceylon" value={bankFields.bank} onChange={e => setBankFields({ ...bankFields, bank: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Account Holder Name</label>
                                                <input type="text" placeholder="Your name" value={bankFields.accountName} onChange={e => setBankFields({ ...bankFields, accountName: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Transfer Reference</label>
                                                <input type="text" placeholder="e.g. Invoice / Slip Number" value={bankFields.reference} onChange={e => setBankFields({ ...bankFields, reference: e.target.value })} required />
                                            </div>
                                        </>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                        <button type="button" onClick={() => setPayStep('confirm')} className="btn btn-outline" style={{ flex: 1 }}>Back</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#059669' }} disabled={processing}>
                                            {processing ? 'Processing...' : `Pay LKR ${Number(buyTarget.price).toLocaleString()}`}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* ── Step 3: Receipt ── */}
                        {payStep === 'receipt' && receipt && (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✅</div>
                                    <h2 style={{ color: '#059669', marginBottom: '4px' }}>Payment Successful!</h2>
                                    <p style={{ color: '#64748b' }}>Your purchase has been recorded.</p>
                                </div>

                                {/* Printable Receipt */}
                                <div ref={receiptRef} style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669' }}>🌿 AgroLanka</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Official Purchase Receipt</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{new Date(receipt.createdAt).toLocaleString()}</div>
                                    </div>

                                    <div style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: '0.85rem', color: '#3b82f6', marginBottom: '16px', backgroundColor: '#eff6ff', padding: '6px', borderRadius: '6px' }}>
                                        Receipt # {receipt.receiptNumber}
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {[
                                                ['Crop / Item', receipt.productName],
                                                ['Quantity', receipt.quantity],
                                                ['Buyer', receipt.buyer?.name],
                                                ['Seller (Farmer)', receipt.seller?.name],
                                                ['Seller Email', receipt.seller?.email],
                                                ['Payment Method', receipt.paymentMethod],
                                                ['Status', receipt.status],
                                            ].map(([l, v]) => (
                                                <tr key={l} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '8px 0', color: '#64748b', fontSize: '0.87rem' }}>{l}</td>
                                                    <td style={{ padding: '8px 0', fontWeight: '500', fontSize: '0.87rem', textAlign: 'right' }}>{v}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div style={{ textAlign: 'center', marginTop: '20px', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Paid</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669' }}>LKR {receipt.amount?.toLocaleString()}</div>
                                    </div>

                                    <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                        Thank you for using AgroLanka Marketplace 🌾
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={handlePrint} className="btn btn-outline" style={{ flex: 1 }}>🖨️ Print Receipt</button>
                                    <button onClick={closeBuyModal} className="btn btn-primary" style={{ flex: 1 }}>Done</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDashboard;
