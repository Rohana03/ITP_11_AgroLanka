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
                        <button className="back-btn" onClick={() => navigate('/admin-dashboard')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: '10px' }}>
                            ← Back to Dashboard
                        </button>
                        <h1>📦 Product Approval Queue</h1>
                        <p>Review and approve regulated product listings.</p>
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
                        <div className="data-table-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px' }}>Product</th>
                                        <th style={{ padding: '12px' }}>Manager</th>
                                        <th style={{ padding: '12px' }}>Category</th>
                                        <th style={{ padding: '12px' }}>Price</th>
                                        <th style={{ padding: '12px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingProducts.map(p => (
                                        <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {p.image && <img src={p.image} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                                                    <div>
                                                        <div style={{ fontWeight: '600' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.description.substring(0, 50)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: '500' }}>{p.manager?.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.manager?.email}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>{p.category}</td>
                                            <td style={{ padding: '12px' }}>LKR {p.price}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleReview(p._id, 'Active')} className="btn btn-primary btn-sm" style={{ backgroundColor: '#10b981' }}>Approve</button>
                                                    <button onClick={() => handleReview(p._id, 'Rejected')} className="btn btn-outline btn-sm" style={{ color: '#ef4444', borderColor: '#ef4444' }}>Reject</button>
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
