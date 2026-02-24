import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const AgriculturalProducts = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/products/available', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setProducts(data);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching products:', err);
                setLoading(false);
            }
        };
        fetchProducts();
    }, [token]);

    const categories = [
        { value: 'all', label: 'All Products' },
        { value: 'Crop Protection', label: '🛡️ Protection' },
        { value: 'Crop Nutrients', label: '🌿 Nutrients' },
        { value: 'Seeds & Planting Material', label: '🌾 Seeds' },
        { value: 'Agri Equipment', label: '🛠️ Equipment' },
        { value: 'Animal Health & Nutrition', label: '🐄 Animal Health' },
        { value: 'Post-Harvest & Storage', label: '📦 Storage' },
        { value: 'Irrigation & Water Management', label: '💧 Irrigation' },
        { value: 'Home & Garden', label: '🏡 Home' },
    ];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryImage = (category) => {
        switch (category) {
            case 'Seeds & Planting Material': return '🌾';
            case 'Crop Protection': return '🛡️';
            case 'Crop Nutrients': return '🌿';
            case 'Agri Equipment': return '🛠️';
            case 'Animal Health & Nutrition': return '🐄';
            case 'Post-Harvest & Storage': return '📦';
            case 'Irrigation & Water Management': return '💧';
            default: return '📦';
        }
    };

    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>🛒 Agricultural Products</h1>
                    <p>Browse products available in your district ({user?.assignedAsc?.district || 'Unknown'})</p>
                </div>

                {/* Search and Filter */}
                <div className="products-controls">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="category-filters">
                        {categories.map(cat => (
                            <button
                                key={cat.value}
                                className={`filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.value)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="products-grid">
                    {loading ? (
                        <div className="loading">Loading products...</div>
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product._id} className="product-card">
                                <div className="product-image" style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ fontSize: '4rem' }}>{getCategoryImage(product.category)}</div>
                                    )}
                                </div>
                                <div style={{ padding: '15px' }}>
                                    <h3 style={{ margin: '0 0 10px 0' }}>{product.name}</h3>
                                    <p className="product-description" style={{ fontSize: '0.9rem', color: '#64748b', height: '40px', overflow: 'hidden' }}>
                                        {product.description}
                                    </p>
                                    <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '10px' }}>
                                        👤 Sold by: {product.manager?.name}
                                    </div>
                                    <div className="product-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                        <span className="product-price" style={{ fontWeight: '700', color: '#059669' }}>
                                            LKR {product.price} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>/ {product.unit}</span>
                                        </span>
                                        <button className="btn btn-primary btn-sm">
                                            Contact Seller
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results" style={{ gridColumn: 'span 4', textAlign: 'center', padding: '50px' }}>
                            <p style={{ fontSize: '1.2rem', color: '#64748b' }}>No products found in your district matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgriculturalProducts;
