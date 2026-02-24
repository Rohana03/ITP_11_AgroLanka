import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const AgriculturalProducts = () => {
<<<<<<< HEAD
    const { user } = useAuth();
=======
    useAuth();
>>>>>>> 9b47020 (solved)
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Mock products data
    const products = [
        { id: 1, name: 'Organic Fertilizer', category: 'fertilizer', price: 'LKR 2,500/bag', image: '🌿', description: '50kg bag of organic compost' },
        { id: 2, name: 'Pesticide Spray', category: 'pesticide', price: 'LKR 1,800/bottle', image: '🧪', description: 'Eco-friendly pest control solution' },
        { id: 3, name: 'Rice Seeds (BG 300)', category: 'seeds', price: 'LKR 450/kg', image: '🌾', description: 'High-yield rice variety' },
        { id: 4, name: 'Vegetable Seeds Pack', category: 'seeds', price: 'LKR 850', image: '🥬', description: 'Mixed vegetable seeds' },
        { id: 5, name: 'NPK Fertilizer', category: 'fertilizer', price: 'LKR 3,200/bag', image: '💊', description: 'Balanced nutrient fertilizer' },
        { id: 6, name: 'Watering System Kit', category: 'equipment', price: 'LKR 12,500', image: '💧', description: 'Drip irrigation starter kit' },
        { id: 7, name: 'Hand Tools Set', category: 'equipment', price: 'LKR 4,500', image: '🛠️', description: 'Essential farming hand tools' },
        { id: 8, name: 'Organic Herbicide', category: 'pesticide', price: 'LKR 2,100/bottle', image: '🌱', description: 'Natural weed control' },
    ];

    const categories = [
        { value: 'all', label: 'All Products' },
        { value: 'seeds', label: '🌾 Seeds' },
        { value: 'fertilizer', label: '🌿 Fertilizers' },
        { value: 'pesticide', label: '🧪 Pesticides' },
        { value: 'equipment', label: '🛠️ Equipment' },
    ];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>🛒 Agricultural Products</h1>
                    <p>Browse and purchase farming supplies and equipment</p>
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
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product.id} className="product-card">
                                <div className="product-image">{product.image}</div>
                                <h3>{product.name}</h3>
                                <p className="product-description">{product.description}</p>
                                <div className="product-footer">
                                    <span className="product-price">{product.price}</span>
                                    <button className="btn btn-primary btn-sm">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <p>No products found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgriculturalProducts;
