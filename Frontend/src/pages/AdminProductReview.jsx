import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';

const AdminProductReview = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [pendingProducts, setPendingProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPendingProducts();
    }, []);

    const fetchPendingProducts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/products/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setPendingProducts(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching pending products:', err);
            setLoading(false);
        }
    };

    const handleReview = async (id, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/products/${id}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setMessage(`Product ${status === 'Active' ? 'Approved' : 'Rejected'} successfully!`);
                setPendingProducts(pendingProducts.filter(p => p._id !== id));
            } else {
                const data = await response.json();
                setMessage(data.message);
            }
        } catch (err) {
            console.error('Review error:', err);
        }
    };

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', marginBottom: '10px', fontSize: '0.9rem', fontWeight: '700', padding: 0 }}>
                            ⬅️ Back to Control Panel
                        </button>
                        <h1 style={{ color: '#064e3b', margin: '4px 0', fontSize: '1.8rem' }}>📦 Product Approval Queue</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>Review and approve regulated product listings.</p>
                    </div>
                </header>

                {message && (
                    <div style={{ padding: '15px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>
                        {message}
                    </div>
                )}

                <div className="dashboard-content">
                    {loading ? (
                        <p>Loading pending reviews...</p>
                    ) : pendingProducts.length > 0 ? (
                        <div className="data-table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#064e3b', color: 'white' }}>
                                        {['Product', 'Manager', 'Category', 'Price', 'Actions'].map((h, i) => (
                                            <th key={h} style={{
                                                padding: '18px 24px',
                                                textAlign: i === 0 || i === 1 ? 'left' : 'center',
                                                fontWeight: '800',
                                                fontSize: '0.8rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                width: i === 0 ? '30%' : i === 1 ? '20%' : i === 4 ? '20%' : '15%'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingProducts.map((p, index) => (
                                        <tr key={p._id} style={{
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background 0.2s'
                                        }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                                        {p.image ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>📦</span>}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', color: '#111827', fontSize: '1.05rem' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.description?.substring(0, 50)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'left' }}>
                                                <div style={{ fontWeight: '700', color: '#1f2937' }}>{p.seller?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.seller?.email}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>{p.category}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <div style={{ fontWeight: '800', color: '#064e3b', fontSize: '1.1rem' }}>LKR {Number(p.price).toLocaleString()}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleReview(p._id, 'Active')} className="btn btn-primary" style={{ backgroundColor: '#10b981', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem' }}>✅ Approve</button>
                                                    <button onClick={() => handleReview(p._id, 'Rejected')} className="btn btn-outline" style={{ color: '#ef4444', border: '1px solid #ef4444', backgroundColor: '#fef2f2', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem' }}>❌ Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '12px' }}>
                            <p style={{ fontSize: '1.2rem', color: '#64748b' }}>No products pending review at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProductReview;
