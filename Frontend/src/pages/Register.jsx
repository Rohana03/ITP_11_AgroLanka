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
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        console.log('📝 Submitting registration form...', { role });
        const res = await register(name, email, nic, password, role);
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
