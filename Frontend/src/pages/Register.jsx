import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [nic, setNic] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('FARMER');
    const [assignedAsc, setAssignedAsc] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [ascs, setAscs] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchAscs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/ascs');
                const data = await response.json();
                setAscs(data);

                // Get unique districts
                const uniqueDistricts = [...new Set(data.map(asc => asc.district))].sort();
                setDistricts(uniqueDistricts);
            } catch (err) {
                console.error('Error fetching ASCs:', err);
            }
        };
        fetchAscs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        console.log('📝 Submitting registration form...', { role, assignedAsc, specialization });
        const res = await register(name, email, nic, password, role, assignedAsc, specialization);
        console.log('📋 Registration result:', res);
        if (res.success) {
            console.log('✅ Registration successful, redirecting to login...');
            navigate('/login', { state: { message: 'Registration successful! Please login with your credentials.' } });
        } else {
            console.error('❌ Registration failed:', res.message);
            setError(res.message);
        }
    };

    return (
        <div className="auth-page">
            <Navbar />
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Create an Account</h2>
                    {error && <div className="alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>NIC Number</label>
                            <input
                                type="text"
                                value={nic}
                                onChange={(e) => setNic(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>I am a</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="FARMER">Farmer</option>
                                <option value="ASC_OFFICER">ASC Officer</option>
                                <option value="STORE_OFFICER">Store Officer</option>
                                <option value="FINANCIAL_OFFICER">Financial Officer</option>
                                <option value="CROP_OFFICER">Crop Officer</option>
                                <option value="PRODUCT_MANAGER">Product Seller/Buyer</option>
                                <option value="MACHINERY_OFFICER">Machinery & Service Officer</option>
                                {/* Admin registration should typically be restricted, but keeping here for demo if needed */}
                            </select>
                        </div>

                        {(role === 'FARMER' || role === 'ASC_OFFICER' || role === 'STORE_OFFICER' || role === 'FINANCIAL_OFFICER' || role === 'CROP_OFFICER' || role === 'PRODUCT_MANAGER' || role === 'MACHINERY_OFFICER') && (
                            <>
                                <div className="form-group">
                                    <label>District</label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => {
                                            setSelectedDistrict(e.target.value);
                                            setAssignedAsc(''); // Reset center when district changes
                                        }}
                                        required={role === 'FARMER'}
                                    >
                                        <option value="">Select District</option>
                                        {districts.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Nearest ASC Center (Agrarian Service Center)</label>
                                    <select
                                        value={assignedAsc}
                                        onChange={(e) => setAssignedAsc(e.target.value)}
                                        required={role === 'FARMER'}
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
                                </div>
                            </>
                        )}

                        {role === 'CROP_OFFICER' && (
                            <div className="form-group">
                                <label>Specific Crop Side/Specialization (Sri Lanka)</label>
                                <select
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    required
                                >
                                    <option value="">Select Specialization</option>
                                    <option value="Paddy (වී)">Paddy (වී)</option>
                                    <option value="Vegetables (එළවළු)">Vegetables (එළවළු)</option>
                                    <option value="Fruits (පලතුරු)">Fruits (පලතුරු)</option>
                                    <option value="Spices (කුළුබඩු)">Spices (කුළුබඩු)</option>
                                    <option value="Export Crops (අපනයන බෝග)">Export Crops (අපනයන බෝග)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary btn-block">Sign Up</button>
                    </form>
                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
