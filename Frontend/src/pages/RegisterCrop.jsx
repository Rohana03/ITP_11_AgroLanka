import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const RegisterCrop = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        cropType: '',
        variety: '',
        landSize: '',
        plantingDate: '',
        expectedHarvest: '',
        location: '',
        soilType: ''
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // TODO: Send to backend API
        console.log('Crop registration data:', formData);

        // Simulated success
        setSuccess('Crop registered successfully!');
        setTimeout(() => {
            navigate('/farmer-dashboard');
        }, 2000);
    };

    return (
        <div className="farmer-page">
            <Navbar />
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/farmer-dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>🌱 Register New Crop</h1>
                    <p>Register your crop details for better management and support</p>
                </div>

                <div className="form-card">
                    {success && <div className="alert-success">{success}</div>}
                    {error && <div className="alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Crop Type *</label>
                                <select name="cropType" value={formData.cropType} onChange={handleChange} required>
                                    <option value="">Select crop type</option>
                                    <option value="rice">Rice (වී)</option>
                                    <option value="vegetables">Vegetables (එළවළු)</option>
                                    <option value="fruits">Fruits (පලතුරු)</option>
                                    <option value="spices">Spices (කුළුබඩු)</option>
                                    <option value="tea">Tea (තේ)</option>
                                    <option value="coconut">Coconut (පොල්)</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Variety *</label>
                                <input
                                    type="text"
                                    name="variety"
                                    value={formData.variety}
                                    onChange={handleChange}
                                    placeholder="e.g., Basmati, Red Lady"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Land Size (Acres) *</label>
                                <input
                                    type="number"
                                    name="landSize"
                                    value={formData.landSize}
                                    onChange={handleChange}
                                    step="0.1"
                                    placeholder="e.g., 2.5"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Soil Type *</label>
                                <select name="soilType" value={formData.soilType} onChange={handleChange} required>
                                    <option value="">Select soil type</option>
                                    <option value="clay">Clay</option>
                                    <option value="sandy">Sandy</option>
                                    <option value="loamy">Loamy</option>
                                    <option value="silt">Silt</option>
                                    <option value="peat">Peat</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Planting Date *</label>
                                <input
                                    type="date"
                                    name="plantingDate"
                                    value={formData.plantingDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Expected Harvest Date *</label>
                                <input
                                    type="date"
                                    name="expectedHarvest"
                                    value={formData.expectedHarvest}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Location/District *</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., Anuradhapura"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Register Crop
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterCrop;
