import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const AgriculturalProducts = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);

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
        { value: 'all', label: t('farmer_market.allProducts') },
        { value: 'Crop Protection', label: `🛡️ ${t('farmer_market.protection')}` },
        { value: 'Crop Nutrients', label: `🌿 ${t('farmer_market.nutrients')}` },
        { value: 'Seeds & Planting Material', label: `🌾 ${t('farmer_market.seeds')}` },
        { value: 'Agri Equipment', label: `🛠️ ${t('farmer_market.equipment')}` },
        { value: 'Animal Health & Nutrition', label: `🐄 ${t('farmer_market.animalHealth')}` },
        { value: 'Post-Harvest & Storage', label: `📦 ${t('farmer_market.storage')}` },
        { value: 'Irrigation & Water Management', label: `💧 ${t('farmer_market.irrigation')}` },
        { value: 'Home & Garden', label: `🏡 ${t('farmer_market.homeGarden')}` },
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
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← {t('common.backToDashboard')}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h1 style={{ margin: '8px 0 4px', fontSize: '2.2rem' }}>🛒 {t('farmer_market.title')}</h1>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
                                📍 Showing products available in the <strong style={{ color: '#10b981' }}>{user?.assignedAsc?.district || 'General'}</strong> region
                            </p>
                        </div>
                        {user?.assignedAsc?.name && (
                            <div style={{ padding: '8px 16px', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', fontSize: '0.85rem', color: '#166534' }}>
                                🏛️ Linked to: <strong>{user.assignedAsc.name}</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="products-controls">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder={t('farmer_market.searchPlaceholder')}
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
                        <div className="loading">{t('common.loading')}</div>
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
                                        👤 {t('farmer_market.soldBy')}: {product.seller?.name || product.manager?.name || 'Authorized Seller'}
                                    </div>
                                    <div className="product-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                        <span className="product-price" style={{ fontWeight: '700', color: '#059669' }}>
                                            LKR {product.price} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>/ {product.unit || t('farmer_market.unit')}</span>
                                        </span>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setShowContactModal(true);
                                            }}
                                        >
                                            {t('farmer_market.contactSeller')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results" style={{ gridColumn: 'span 4', textAlign: 'center', padding: '50px' }}>
                            <p style={{ fontSize: '1.2rem', color: '#64748b' }}>{t('farmer_market.noProductsDist')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Seller Modal */}
            {showContactModal && selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '30px', borderRadius: '16px',
                        width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        position: 'relative', animation: 'modalSlideUp 0.3s ease-out'
                    }}>
                        <button 
                            onClick={() => setShowContactModal(false)}
                            style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                        >×</button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👤</div>
                            <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{selectedProduct.seller?.name || selectedProduct.manager?.name || 'Seller'}</h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{selectedProduct.sellerRole === 'PRODUCT_MANAGER' ? 'Product Manager' : 'Farmer'}</p>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            <a 
                                href={`mailto:${selectedProduct.seller?.email || selectedProduct.manager?.email}?subject=AgroLanka Inquiry: ${selectedProduct.name}`}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    padding: '12px', backgroundColor: '#f0fdf4', color: '#166534',
                                    borderRadius: '10px', textDecoration: 'none', fontWeight: '600',
                                    border: '1px solid #dcfce7', transition: 'all 0.2s'
                                }}
                            >
                                📧 Send Email
                            </a>
                            
                            {(selectedProduct.seller?.phone || selectedProduct.manager?.phone) && (
                                <a 
                                    href={`tel:${selectedProduct.seller?.phone || selectedProduct.manager?.phone}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        padding: '12px', backgroundColor: '#eff6ff', color: '#1e40af',
                                        borderRadius: '10px', textDecoration: 'none', fontWeight: '600',
                                        border: '1px solid #dbeafe', transition: 'all 0.2s'
                                    }}
                                >
                                    📞 Call Seller
                                </a>
                            )}
                            
                            {!selectedProduct.seller?.phone && !selectedProduct.manager?.phone && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>
                                    Phone number not shared by seller.
                                </div>
                            )}
                        </div>

                        <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                            Inquiring about: <strong>{selectedProduct.name}</strong>
                        </p>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AgriculturalProducts;
