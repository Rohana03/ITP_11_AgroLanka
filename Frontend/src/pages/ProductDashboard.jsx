import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './FarmerDashboard.css';

const ProductDashboard = () => {
    const { user, token, updateUser } = useAuth();
    const [districts, setDistricts] = useState([]);
    const [selectedDistricts, setSelectedDistricts] = useState(user?.serviceDistricts || []);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Product Listing State
    const [products, setProducts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'Crop Protection',
        description: '',
        price: '',
        unit: 'kg',
        image: ''
    });

    useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };

        const fetchMyProducts = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/products/available', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) setProducts(data);
            } catch (err) {
                console.error('Error fetching products:', err);
            }
        };

        fetchAscs();
        fetchMyProducts();
    }, [token]);

    const handleUpdateDistricts = async () => {
        if (selectedDistricts.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one district.' });
            return;
        }

        setIsUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:5000/api/auth/update-districts', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ serviceDistricts: selectedDistricts })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Service districts updated successfully!' });
                if (updateUser) updateUser(data);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update districts' });
            }
        } catch (err) {
            console.error('Update error:', err);
            setMessage({ type: 'error', text: 'An error occurred while updating.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProduct({ ...newProduct, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newProduct)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Product listed successfully! (Sensitive categories await Admin approval)' });
                setNewProduct({ name: '', category: 'Crop Protection', description: '', price: '', unit: 'kg', image: '' });
                setShowAddForm(false);
                handleRefreshProducts();
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.message });
            }
        } catch (err) {
            console.error('Add product error:', err);
        }
    };

    const handleRefreshProducts = async () => {
        const res = await fetch('http://localhost:5000/api/products/available', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setProducts(data);
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setProducts(products.filter(p => p._id !== id));
                setMessage({ type: 'success', text: 'Product deleted' });
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const categories = [
        "Crop Protection",
        "Crop Nutrients",
        "Seeds & Planting Material",
        "Agri Equipment",
        "Animal Health & Nutrition",
        "Post-Harvest & Storage",
        "Irrigation & Water Management",
        "Home & Garden",
        "Other"
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { backgroundColor: '#fef3c7', color: '#92400e' };
            case 'Active': return { backgroundColor: '#dcfce7', color: '#166534' };
            case 'Rejected': return { backgroundColor: '#fee2e2', color: '#991b1b' };
            default: return { backgroundColor: '#f1f5f9', color: '#475569' };
        }
    };

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>Product Manager Dashboard 🛒</h1>
                        <p>Welcome, {user?.name}! Manage your service regions and inventory.</p>

                        <div className="allocation-info" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #3b82f6', display: 'inline-block' }}>
                            <span style={{ color: '#1e40af', fontWeight: '600' }}>📍 Operating Districts: </span>
                            <span style={{ color: '#1d4ed8' }}>
                                {user?.serviceDistricts?.length > 0
                                    ? user.serviceDistricts.join(', ')
                                    : 'No districts selected'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="dashboard-grid">
                    <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3>📦 My Product Listings</h3>
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
                                    {newProduct.image && (
                                        <div className="image-preview" style={{ marginTop: '10px' }}>
                                            <img src={newProduct.image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                        </div>
                                    )}
                                </div>
                                <div className="form-group" style={{ marginTop: '15px' }}>
                                    <label>Description</label>
                                    <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required placeholder="Provide details about the product..." rows="3"></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Publish Listing</button>
                                {["Animal Health & Nutrition", "Crop Protection", "Crop Nutrients"].includes(newProduct.category) && (
                                    <p style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '10px' }}>⚠️ This category requires Admin approval before being visible to farmers.</p>
                                )}
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
                                    {products.map(p => (
                                        <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    ) : (
                                                        <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>📦</div>
                                                    )}
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
                                    {products.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No products listed yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="dashboard-card" style={{ gridColumn: 'span 1' }}>
                        <div className="card-icon">🗺️</div>
                        <h3>Manage Service Districts</h3>
                        <p style={{ marginBottom: '15px' }}>Regions where your products are visible.</p>

                        {message.text && (
                            <div style={{
                                padding: '10px',
                                borderRadius: '6px',
                                marginBottom: '15px',
                                backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                                color: message.type === 'success' ? '#065f46' : '#991b1b',
                                border: `1px solid ${message.type === 'success' ? '#10b981' : '#f87171'}`
                            }}>
                                {message.text}
                            </div>
                        )}

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '8px',
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            marginBottom: '15px'
                        }}>
                            {districts.map(district => (
                                <label key={district} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedDistricts.includes(district)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedDistricts([...selectedDistricts, district]);
                                            else setSelectedDistricts(selectedDistricts.filter(d => d !== district));
                                        }}
                                    />
                                    {district}
                                </label>
                            ))}
                        </div>

                        <button className="btn btn-primary btn-sm btn-block" onClick={handleUpdateDistricts} disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Update Districts'}
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🤝</div>
                        <h3>Recent Activity</h3>
                        <p>No recent orders from farmers.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDashboard;
