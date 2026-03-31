import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
    validatePrice, validateImageFile,
    validateCardNumber, validateExpiry, validateCVV, required
} from '../utils/validators';
import './AdminDashboard.css';
import './FarmerDashboard.css';

/* Inline error helper */
const FieldError = ({ msg }) =>
    msg ? <small style={{ color: '#dc2626', display: 'block', marginTop: '4px', fontSize: '0.78rem' }}>{msg}</small> : null;

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
        name: '', category: 'Agri Equipment', description: '', price: '', unit: 'kg', image: '', districts: []
    });

    // Form validation state
    const [productFormErrors, setProductFormErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);

    // Payment modal state
    const [buyTarget, setBuyTarget] = useState(null);        // product being purchased
    const [purchaseQty, setPurchaseQty] = useState(1);
    const [payStep, setPayStep] = useState('confirm');        // 'confirm' | 'payment' | 'receipt'
    const [payMethod, setPayMethod] = useState('Card');
    const [cardFields, setCardFields] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [bankFields, setBankFields] = useState({ bank: '', accountName: '', reference: '' });
    const [processing, setProcessing] = useState(false);
    const [payError, setPayError] = useState('');
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
        if (!file) return;
        const sizeError = validateImageFile(file, 2);
        if (sizeError) {
            setProductFormErrors(prev => ({ ...prev, image: sizeError }));
            e.target.value = '';
            return;
        }
        setImageFile(file);
        setProductFormErrors(prev => ({ ...prev, image: null }));
        const reader = new FileReader();
        reader.onloadend = () => setNewProduct({ ...newProduct, image: reader.result });
        reader.readAsDataURL(file);
    };

    const validateProductForm = () => {
        const errors = {
            name:        required(newProduct.name, 'Product name'),
            price:       validatePrice(newProduct.price),
            description: (!newProduct.description || newProduct.description.trim().length < 20)
                            ? 'Description must be at least 20 characters.'
                            : null,
            unit:        required(newProduct.unit, 'Unit'),
            image:       !newProduct.image ? 'Please select an image (max 2 MB).' : null,
            districts:   (!newProduct.districts || newProduct.districts.length === 0) ? 'Please select at least one district.' : null,
        };
        setProductFormErrors(errors);
        return Object.values(errors).every(v => !v);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!validateProductForm()) return;
        try {
            const res = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newProduct)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Product listed! (Regulated categories await admin approval)' });
                setNewProduct({ name: '', category: 'Agri Equipment', description: '', price: '', unit: 'kg', image: '', districts: [] });
                setImageFile(null);
                setProductFormErrors({});
                setShowAddForm(false);
                fetchData();
            } else {
                const d = await res.json();
                setMessage({ type: 'error', text: d.message || 'Failed to list product.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        }
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
        setPurchaseQty(1);
        setPayStep('confirm');
        setPayMethod('Card');
        setCardFields({ number: '', expiry: '', cvv: '', name: '' });
        setBankFields({ bank: '', accountName: '', reference: '' });
        setPayError('');
        setReceipt(null);
    };

    const closeBuyModal = () => {
        setBuyTarget(null);
        setPayStep('confirm');
        setReceipt(null);
        fetchData(); // refresh marketplace (item may now be Out of Stock)
    };

    const handleConfirmBuy = () => { setPayError(''); setPayStep('payment'); };

    const validatePaymentFields = () => {
        if (payMethod === 'Card') {
            const nameErr   = required(cardFields.name, 'Cardholder name');
            const numErr    = validateCardNumber(cardFields.number);
            const expErr    = validateExpiry(cardFields.expiry);
            const cvvErr    = validateCVV(cardFields.cvv);
            const first = nameErr || numErr || expErr || cvvErr;
            if (first) { setPayError(first); return false; }
        } else {
            const bankErr = required(bankFields.bank, 'Bank name');
            const accErr  = required(bankFields.accountName, 'Account holder name');
            const refErr  = required(bankFields.reference, 'Transfer reference');
            const first = bankErr || accErr || refErr;
            if (first) { setPayError(first); return false; }
        }
        return true;
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setPayError('');
        if (!validatePaymentFields()) return;
        setProcessing(true);
        try {
            const res = await fetch('http://localhost:5000/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: buyTarget._id, paymentMethod: payMethod, purchaseQty })
            });
            const data = await res.json();
            if (res.ok) {
                setReceipt(data);
                setPayStep('receipt');
            } else {
                setPayError(data.message || 'Payment failed. Please try again.');
            }
        } catch (err) {
            setPayError('Network error. Please check your connection and try again.');
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
            'Pending': { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
            'Active': { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
            'Rejected': { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
            'Out of Stock': { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' },
            'APPROVED': { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
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
        <div className="admin-dashboard">
            <style>{printStyle}</style>
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1e3a8a' }}>Product Management 🛒</h1>
                            <span className="role-badge" style={{ backgroundColor: '#1d4ed8', color: 'white', padding: '4px 12px' }}>
                                PRODUCT MANAGER
                            </span>
                        </div>
                        <p className="welcome-text" style={{ fontSize: '1.2rem', margin: 0 }}>
                            Welcome back, <strong style={{ color: '#1d4ed8' }}>{user?.name}</strong>! Manage inventory and source crops from farmers.
                        </p>
                    </div>

                    <div className="header-right">
                        <div style={{ padding: '16px 24px', backgroundColor: '#eff6ff', borderRadius: '16px', border: '1px solid #dbeafe', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{ color: '#1e40af', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 OPERATING DISTRICTS</div>
                            <div style={{ color: '#1e3a8a', fontSize: '1rem', fontWeight: 'bold', maxWidth: '300px', textAlign: 'right' }}>
                                {user?.serviceDistricts?.length > 0 ? user.serviceDistricts.join(', ') : 'None Selected'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    <div className="stat-card">
                        <div className="card-icon">📦</div>
                        <div className="stat-label">My Listings</div>
                        <div className="stat-value">{myProducts.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="card-icon">🌾</div>
                        <div className="stat-label">Marketplace Items</div>
                        <div className="stat-value">{marketplaceProducts.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="card-icon">🧾</div>
                        <div className="stat-label">Total Purchases</div>
                        <div className="stat-value">{myPurchases.length}</div>
                    </div>
                    <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
                        <div className="card-icon">🏘️</div>
                        <div className="stat-label">Service Regions</div>
                        <div className="stat-value">{user?.serviceDistricts?.length || 0} <span style={{ fontSize: '1rem', fontWeight: '400', color: '#64748b' }}>Districts</span></div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    {/* ── Main Content Card ── */}
                    <div className="dashboard-panel" style={{ gridColumn: '1 / -1' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '2px solid #f1f5f9' }}>
                            {[['inventory', '📦 My Inventory'], ['marketplace', '🌾 Marketplace'], ['purchases', '🧾 Purchases']].map(([key, label]) => (
                                <button key={key} onClick={() => setActiveTab(key)}
                                    style={{
                                        padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer',
                                        borderBottom: activeTab === key ? '4px solid #3b82f6' : '4px solid transparent',
                                        fontWeight: activeTab === key ? '800' : '500',
                                        color: activeTab === key ? '#1e40af' : '#64748b',
                                        transition: 'all 0.2s',
                                        fontSize: '0.95rem'
                                    }}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* ── Inventory Tab ── */}
                        {activeTab === 'inventory' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '800' }}>Manage My Listings</h3>
                                    <button className={`btn ${showAddForm ? 'btn-red' : 'btn-primary'}`} 
                                        onClick={() => {
                                            if (!showAddForm) {
                                                setNewProduct(prev => ({ ...prev, districts: user?.serviceDistricts || [] }));
                                            }
                                            setShowAddForm(!showAddForm);
                                        }} 
                                        style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '700' }}>
                                        {showAddForm ? '✕ Close Form' : '➕ List New Product'}
                                    </button>
                                </div>

                                {showAddForm && (
                                    <form onSubmit={handleAddProduct} style={{
                                        backgroundColor: '#ffffff',
                                        padding: '32px',
                                        borderRadius: '16px',
                                        marginBottom: '32px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Product Name</label>
                                                <input
                                                    type="text"
                                                    value={newProduct.name}
                                                    onChange={e => { setNewProduct({ ...newProduct, name: e.target.value }); setProductFormErrors(p => ({ ...p, name: null })); }}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: productFormErrors.name ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '0.95rem' }}
                                                    placeholder="e.g. Urea Fertilizer"
                                                />
                                                <FieldError msg={productFormErrors.name} />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Category</label>
                                                <select
                                                    value={newProduct.category}
                                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', backgroundColor: 'white' }}
                                                >
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Price (LKR)</label>
                                                <input
                                                    type="number"
                                                    value={newProduct.price}
                                                    onChange={e => { setNewProduct({ ...newProduct, price: e.target.value }); setProductFormErrors(p => ({ ...p, price: null })); }}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: productFormErrors.price ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '0.95rem' }}
                                                    placeholder="e.g. 2500"
                                                    min="1"
                                                />
                                                <FieldError msg={productFormErrors.price} />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Unit</label>
                                                <input
                                                    type="text"
                                                    value={newProduct.unit}
                                                    onChange={e => { setNewProduct({ ...newProduct, unit: e.target.value }); setProductFormErrors(p => ({ ...p, unit: null })); }}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: productFormErrors.unit ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '0.95rem' }}
                                                    placeholder="e.g. kg, 500ml, pack"
                                                />
                                                <FieldError msg={productFormErrors.unit} />
                                            </div>
                                            <div className="form-group" style={{ margin: 0, gridColumn: 'span 1' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Product Image</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    style={{ width: '100%', fontSize: '0.85rem' }}
                                                />
                                                <FieldError msg={productFormErrors.image} />
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ marginTop: '20px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Available Districts</label>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0', marginBottom: '12px' }}>Pre-filled with your operating regions. You can add more specifically for this listing.</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {districts.map(d => {
                                                    const isSelected = newProduct.districts?.includes(d);
                                                    return (
                                                        <label key={d} style={{
                                                            padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: isSelected ? '700' : '500',
                                                            backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                                                            color: isSelected ? '#1d4ed8' : '#475569',
                                                            border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                                                            display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                                                        }}>
                                                            <input type="checkbox" checked={isSelected || false} onChange={(e) => {
                                                                const current = newProduct.districts || [];
                                                                if (e.target.checked) {
                                                                    setNewProduct(prev => ({ ...prev, districts: [...current, d] }));
                                                                } else {
                                                                    setNewProduct(prev => ({ ...prev, districts: current.filter(x => x !== d) }));
                                                                }
                                                                setProductFormErrors(p => ({ ...p, districts: null }));
                                                            }} style={{ display: 'none' }} />
                                                            {isSelected && <span style={{ marginRight: '4px' }}>✓</span>} {d}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            <FieldError msg={productFormErrors.districts} />
                                        </div>

                                        {['Crop Protection', 'Crop Nutrients', 'Animal Health & Nutrition'].includes(newProduct.category) && (
                                            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: '600' }}>
                                                    Regulated category detected. Listing will require administrator approval before going live.
                                                </p>
                                            </div>
                                        )}

                                        <div className="form-group" style={{ marginTop: '20px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Description (min 20 chars)</label>
                                            <textarea
                                                value={newProduct.description}
                                                onChange={e => { setNewProduct({ ...newProduct, description: e.target.value }); setProductFormErrors(p => ({ ...p, description: null })); }}
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: productFormErrors.description ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', fontSize: '0.95rem', minHeight: '100px' }}
                                                placeholder="Provide details about quality, usage, grade..."
                                            />
                                            <FieldError msg={productFormErrors.description} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#064e3b', border: 'none', padding: '14px 32px', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem' }}>🚀 Publish Listing</button>
                                            <button type="button" className="btn" onClick={() => setShowAddForm(false)} style={{ background: '#f1f5f9', color: '#475569', padding: '14px 32px', borderRadius: '10px', fontWeight: '700' }}>Cancel</button>
                                        </div>
                                    </form>
                                )}

                                <div className="data-table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                                {['Product', 'Category', 'Price', 'Status', 'Action'].map((h, i) => (
                                                    <th key={h} style={{
                                                        padding: '18px 24px',
                                                        textAlign: i === 0 ? 'left' : 'center',
                                                        fontWeight: '700',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em',
                                                        width: i === 0 ? '35%' : '16%'
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myProducts.map((p, index) => (
                                                <tr key={p._id} style={{
                                                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background 0.2s'
                                                }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>📦</span>}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem' }}>{p.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>per {p.unit}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>{p.category}</span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <div style={{ fontWeight: '800', color: '#064e3b' }}>LKR {Number(p.price).toLocaleString()}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontWeight: '800',
                                                            textTransform: 'uppercase',
                                                            ...getStatusStyle(p.status)
                                                        }}>{p.status}</span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <button onClick={() => handleDeleteProduct(p._id)} style={{ color: '#ef4444', background: '#fef2f2', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>🗑️ Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {myProducts.length === 0 && (
                                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '0.95rem' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                                                    No products listed yet. Click "+ List New Product" to start.
                                                </td></tr>
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
                                <div className="data-table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                                {['Harvest Details', 'Farmer', 'Districts', 'Pricing', 'Action'].map((h, i) => (
                                                    <th key={h} style={{
                                                        padding: '18px 24px',
                                                        textAlign: i === 0 || i === 1 ? 'left' : 'center',
                                                        fontWeight: '700',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em',
                                                        width: i === 0 ? '30%' : i === 1 ? '20%' : i === 4 ? '15%' : '17.5%'
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {marketplaceProducts.map((p, index) => (
                                                <tr key={p._id} style={{
                                                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background 0.2s'
                                                }}>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>🌾</span>}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem' }}>{p.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.description?.substring(0, 40)}...</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ fontWeight: '700', color: '#1f2937' }}>{p.seller?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.seller?.email}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                                                            {p.districts?.map(d => <span key={d} style={{ fontSize: '0.7rem', padding: '2px 8px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '4px', fontWeight: '600' }}>{d}</span>)}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <div style={{ fontWeight: '800', color: '#059669' }}>LKR {p.price}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>per {p.unit}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ backgroundColor: '#059669', padding: '8px 16px', fontSize: '0.85rem' }}
                                                            onClick={() => openBuyModal(p)}
                                                        >
                                                            🛒 Purchase
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {marketplaceProducts.length === 0 && (
                                                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌾</div>
                                                    No farmer crops available in your districts.
                                                </td></tr>
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
                                <div className="data-table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                                {['Receipt #', 'Crop', 'Farmer', 'Amount', 'Method', 'Date', 'Action'].map((h, i) => (
                                                    <th key={h} style={{
                                                        padding: '18px 24px',
                                                        textAlign: i === 1 || i === 2 ? 'left' : 'center',
                                                        fontWeight: '700',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em',
                                                        width: i === 0 ? '12%' : i === 1 ? '18%' : i === 2 ? '20%' : '12.5%'
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myPurchases.map((p, index) => (
                                                <tr key={p._id} style={{
                                                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background 0.2s'
                                                }}>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>{p.receiptNumber}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '700', color: '#111827' }}>{p.productName}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'left' }}>
                                                        <div style={{ fontWeight: '600' }}>{p.seller?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.seller?.email}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '800', color: '#059669' }}>LKR {p.amount?.toLocaleString()}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.8rem', padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: '600' }}>{p.paymentMethod}</span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <button onClick={() => handlePrintPurchaseReceipt(p)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700' }}>🖨️ Receipt</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {myPurchases.length === 0 && (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧾</div>
                                                    No purchases yet.
                                                </td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── District Selector ── */}
                    <div className="dashboard-panel" style={{ gridColumn: '1 / -1', marginTop: '32px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '800' }}>📍 Manage Service Districts</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Select the regions where you source crops and sell products.</p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn" onClick={() => setSelectedDistricts(districts)}
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#444', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>Select All</button>
                                <button type="button" className="btn" onClick={() => setSelectedDistricts([])}
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#444', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>Clear All</button>
                                <button className="btn btn-primary" onClick={handleUpdateDistricts} disabled={isUpdating}
                                    style={{ backgroundColor: '#1d4ed8', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '0.9rem' }}>
                                    {isUpdating ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                        </div>

                        {message.text && (
                            <div style={{ padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`, fontWeight: '700', textAlign: 'center' }}>
                                {message.type === 'success' ? '✅ ' : '⚠️ '}{message.text}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            {districts.map(d => (
                                <label key={d} style={{ 
                                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.9rem', padding: '12px 16px', borderRadius: '12px', transition: 'all 0.2s',
                                    backgroundColor: selectedDistricts.includes(d) ? '#eff6ff' : '#ffffff',
                                    color: selectedDistricts.includes(d) ? '#1e40af' : '#475569',
                                    fontWeight: selectedDistricts.includes(d) ? '800' : '500',
                                    border: selectedDistricts.includes(d) ? '2px solid #3b82f6' : '1px solid #f1f5f9',
                                    boxShadow: selectedDistricts.includes(d) ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : '0 1px 2px rgba(0,0,0,0.03)'
                                }}>
                                    <input type="checkbox" checked={selectedDistricts.includes(d)} onChange={(e) => {
                                            if (e.target.checked) setSelectedDistricts([...selectedDistricts, d]);
                                            else setSelectedDistricts(selectedDistricts.filter(x => x !== d));
                                        }} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                                    {d}
                                </label>
                            ))}
                        </div>
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
                                            <tr>
                                                <td style={{ color: '#64748b', padding: '6px 0', width: '40%' }}>Crop</td>
                                                <td style={{ fontWeight: '600', padding: '6px 0' }}>{buyTarget.name}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b', padding: '6px 0', width: '40%' }}>Farmer</td>
                                                <td style={{ fontWeight: '600', padding: '6px 0' }}>{buyTarget.seller?.name}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b', padding: '6px 0', width: '40%' }}>Unit Price</td>
                                                <td style={{ fontWeight: '600', padding: '6px 0' }}>LKR {Number(buyTarget.price).toLocaleString()} per {buyTarget.unit.replace(/\d+/g, '').trim() || 'unit'}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b', padding: '6px 0', width: '40%' }}>Order Quantity</td>
                                                <td style={{ fontWeight: '600', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="number" min="1" 
                                                        max={parseInt(buyTarget.unit.match(/\d+/) ? buyTarget.unit.match(/\d+/)[0] : Infinity, 10)}
                                                        value={purchaseQty} 
                                                        onChange={(e) => {
                                                            const maxQ = parseInt(buyTarget.unit.match(/\d+/) ? buyTarget.unit.match(/\d+/)[0] : Infinity, 10);
                                                            let val = parseInt(e.target.value) || 1;
                                                            if (val > maxQ) val = maxQ;
                                                            if (val < 1) val = 1;
                                                            setPurchaseQty(val);
                                                        }} 
                                                        style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                                                    /> 
                                                    <span>{buyTarget.unit.replace(/\d+/g, '').trim() || 'unit'}s (Max: {parseInt(buyTarget.unit.match(/\d+/) ? buyTarget.unit.match(/\d+/)[0] : 'N/A')})</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#64748b', padding: '12px 0 0 0', width: '40%', borderTop: '1px dashed #cbd5e1', marginTop: '8px' }}>Total Payout</td>
                                                <td style={{ fontWeight: '800', color: '#059669', padding: '12px 0 0 0', fontSize: '1.2rem', borderTop: '1px dashed #cbd5e1', marginTop: '8px' }}>
                                                    LKR {(buyTarget.price * purchaseQty).toLocaleString()}
                                                </td>
                                            </tr>
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
                                <p style={{ color: '#64748b', marginBottom: '20px' }}>Total Amount: <strong style={{ color: '#059669', fontSize: '1.2rem' }}>LKR {(buyTarget.price * purchaseQty).toLocaleString()}</strong></p>

                                {/* Method selector */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                    {['Card', 'Bank Transfer'].map(m => (
                                        <button key={m} onClick={() => setPayMethod(m)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', border: payMethod === m ? '2px solid #3b82f6' : '2px solid #e2e8f0', backgroundColor: payMethod === m ? '#eff6ff' : '#fff', color: payMethod === m ? '#1e40af' : '#64748b', fontWeight: payMethod === m ? '600' : '400' }}>
                                            {m === 'Card' ? '💳 Card' : '🏦 Bank Transfer'}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handlePayment} noValidate>
                                    {/* Inline payment error */}
                                    {payError && (
                                        <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ⚠️ {payError}
                                        </div>
                                    )}

                                    {payMethod === 'Card' ? (
                                        <>
                                            <div className="form-group">
                                                <label>Cardholder Name</label>
                                                <input type="text" placeholder="As shown on card" value={cardFields.name} onChange={e => { setCardFields({ ...cardFields, name: e.target.value }); setPayError(''); }} />
                                            </div>
                                            <div className="form-group">
                                                <label>Card Number</label>
                                                <input type="text" placeholder="1234 5678 9012 3456" maxLength="19"
                                                    value={cardFields.number}
                                                    onChange={e => { setCardFields({ ...cardFields, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() }); setPayError(''); }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div className="form-group">
                                                    <label>Expiry (MM/YY)</label>
                                                    <input type="text" placeholder="08/27" maxLength="5" value={cardFields.expiry} onChange={e => { setCardFields({ ...cardFields, expiry: e.target.value }); setPayError(''); }} />
                                                </div>
                                                <div className="form-group">
                                                    <label>CVV</label>
                                                    <input type="password" placeholder="•••" maxLength="3" value={cardFields.cvv} onChange={e => { setCardFields({ ...cardFields, cvv: e.target.value }); setPayError(''); }} />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="form-group">
                                                <label>Bank Name</label>
                                                <input type="text" placeholder="e.g. Bank of Ceylon" value={bankFields.bank} onChange={e => { setBankFields({ ...bankFields, bank: e.target.value }); setPayError(''); }} />
                                            </div>
                                            <div className="form-group">
                                                <label>Account Holder Name</label>
                                                <input type="text" placeholder="Your name" value={bankFields.accountName} onChange={e => { setBankFields({ ...bankFields, accountName: e.target.value }); setPayError(''); }} />
                                            </div>
                                            <div className="form-group">
                                                <label>Transfer Reference</label>
                                                <input type="text" placeholder="e.g. Invoice / Slip Number" value={bankFields.reference} onChange={e => { setBankFields({ ...bankFields, reference: e.target.value }); setPayError(''); }} />
                                            </div>
                                        </>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                        <button type="button" onClick={() => { setPayStep('confirm'); setPayError(''); }} className="btn btn-outline" style={{ flex: 1 }}>Back</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#059669' }} disabled={processing}>
                                            {processing ? 'Processing...' : `Pay LKR ${(buyTarget.price * purchaseQty).toLocaleString()}`}
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
