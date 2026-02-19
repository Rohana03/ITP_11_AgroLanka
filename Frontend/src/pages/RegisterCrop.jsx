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
        season: '',
        location: user?.assignedAsc?.district || '',
        soilType: '',
        assignedAsc: user?.assignedAsc?._id || user?.assignedAsc || ''
    });
    const [ascs, setAscs] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(user?.assignedAsc?.district || '');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    React.useEffect(() => {
        const varietyNeeded = ['rice', 'vegetables', 'fruits', 'spices', 'other'].includes(formData.cropType);
        if (!varietyNeeded && formData.cropType !== '') {
            setFormData(prev => ({ ...prev, variety: 'General' }));
        }

        // Handle Season
        if (formData.cropType === 'rice') {
            if (formData.season === 'N/A') setFormData(prev => ({ ...prev, season: '' }));
        } else if (formData.cropType !== '') {
            setFormData(prev => ({ ...prev, season: 'N/A' }));
        }
    }, [formData.cropType]);

    React.useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                setAscs(data);

                // Get unique districts
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);

                // If user has an assigned ASC, pre-fill it
                if (user?.assignedAsc) {
                    setFormData(prev => ({
                        ...prev,
                        assignedAsc: user.assignedAsc._id || user.assignedAsc,
                        location: user.assignedAsc.district
                    }));
                }
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };
        fetchAscs();
    }, [user]);

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

        try {
            const response = await fetch('http://localhost:5000/api/crops', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Registration request submitted successfully! It is now pending officer approval.');
                setTimeout(() => {
                    navigate('/farmer-dashboard');
                }, 3000);
            } else {
                setError(data.message || 'Failed to register crop');
            }
        } catch (err) {
            setError('Server error during crop registration');
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
                    <h1>🌱 Crop Registration Request</h1>
                    <p>Submit your crop details for officer review and approval</p>
                    <button className="view-btn" onClick={() => navigate('/farmer/my-crops')}>
                        View my requests →
                    </button>
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
                                    <option value="rubber">Rubber (රබර්)</option>
                                    <option value="coffee">Coffee (කෝපි)</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {['rice', 'vegetables', 'fruits', 'spices', 'other'].includes(formData.cropType) && (
                                <div className="form-group">
                                    <label>Variety *</label>
                                    <input
                                        type="text"
                                        name="variety"
                                        value={formData.variety}
                                        onChange={handleChange}
                                        placeholder="Enter the variety of the selected crop"
                                        required
                                    />
                                </div>
                            )}
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

                        {formData.cropType === 'rice' && (
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Season *</label>
                                <select name="season" value={formData.season} onChange={handleChange} required>
                                    <option value="">Select season</option>
                                    <option value="Yala">Yala (යල)</option>
                                    <option value="Maha">Maha (මහ)</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>District *</label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => {
                                    const district = e.target.value;
                                    setSelectedDistrict(district);
                                    setFormData(prev => ({
                                        ...prev,
                                        assignedAsc: '',
                                        location: district
                                    }));
                                }}
                                required
                            >
                                <option value="">Select District</option>
                                {districts.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Assigned Agrarian Service Center (ASC) *</label>
                            <select
                                name="assignedAsc"
                                value={formData.assignedAsc}
                                onChange={handleChange}
                                required
                                disabled={!selectedDistrict}
                            >
                                <option value="">{selectedDistrict ? 'Select ASC Center' : 'Select District first'}</option>
                                {ascs
                                    .filter(asc => asc.district === selectedDistrict)
                                    .map(asc => (
                                        <option key={asc._id} value={asc._id}>{asc.name}</option>
                                    ))
                                }
                            </select>
                            <small className="form-text text-muted">Select the center where you will receive support and services.</small>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => navigate('/farmer-dashboard')}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterCrop;
