import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './FarmerPages.css';

const MachineryService = () => {
<<<<<<< HEAD
    const { user } = useAuth();
=======
    useAuth();
>>>>>>> 9b47020 (solved)
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        serviceType: '',
        machineryType: '',
        requestDate: '',
        duration: '',
        landSize: '',
        location: '',
        additionalNotes: ''
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
        console.log('Service request data:', formData);
        setSuccess('Service request submitted successfully!');
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
                    <h1>🚜 Machinery & Services</h1>
                    <p>Request agricultural machinery and services for your farm</p>
                </div>

                <div className="form-card">
                    {success && <div className="alert-success">{success}</div>}
                    {error && <div className="alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Service Type *</label>
                            <select name="serviceType" value={formData.serviceType} onChange={handleChange} required>
                                <option value="">Select service type</option>
                                <option value="rental">Machinery Rental</option>
                                <option value="operator">Machinery with Operator</option>
                                <option value="custom">Custom Farming Service</option>
                                <option value="maintenance">Equipment Maintenance</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Machinery/Equipment Type *</label>
                            <select name="machineryType" value={formData.machineryType} onChange={handleChange} required>
                                <option value="">Select machinery</option>
                                <option value="tractor">Tractor</option>
                                <option value="harvester">Combine Harvester</option>
                                <option value="plough">Plough</option>
                                <option value="seeder">Seed Drill/Planter</option>
                                <option value="sprayer">Sprayer</option>
                                <option value="thresher">Thresher</option>
                                <option value="rotavator">Rotavator</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Request Date *</label>
                                <input
                                    type="date"
                                    name="requestDate"
                                    value={formData.requestDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Duration *</label>
                                <select name="duration" value={formData.duration} onChange={handleChange} required>
                                    <option value="">Select duration</option>
                                    <option value="half-day">Half Day</option>
                                    <option value="full-day">Full Day</option>
                                    <option value="2-days">2 Days</option>
                                    <option value="3-days">3 Days</option>
                                    <option value="week">1 Week</option>
                                    <option value="custom">Custom</option>
                                </select>
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
                                <label>Location *</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., Anuradhapura"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Additional Notes</label>
                            <textarea
                                name="additionalNotes"
                                value={formData.additionalNotes}
                                onChange={handleChange}
                                placeholder="Any specific requirements or instructions"
                                rows="4"
                            />
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

export default MachineryService;
