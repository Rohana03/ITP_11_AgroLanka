import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../AdminDashboard.css';
import './RegionalReports.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const SRI_LANKA_DISTRICTS = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Hambantota', 'Galle', 'Matara', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Kegalle', 'Ratnapura', 'Badulla', 'Moneragala', 'Jaffna', 'Kilinochchi', 'Vavuniya', 'Mullaitivu', 'Mannar', 'Trincomalee', 'Batticaloa', 'Ampara'];

const RegionalReports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState('All');

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            navigate('/login');
            return;
        }
        fetchAnalytics(selectedDistrict);
    }, [user, navigate, selectedDistrict]);

    const fetchAnalytics = async (district) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const url = district === 'All'
                ? 'http://localhost:5000/api/admin/analytics'
                : `http://localhost:5000/api/admin/analytics?district=${district}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/district-reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setReportData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch detailed report data:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading || !analytics) {
        return (
            <div className="reports-container">
                <Navbar />
                <div className="loading-content">
                    <p>Loading analytics data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <header className="dashboard-header" style={{ marginBottom: '24px' }}>
                    <div className="header-left">
                        <button className="btn-outline" onClick={() => navigate('/admin')} style={{ marginBottom: '12px', padding: '6px 16px' }}>
                            &larr; Back to Dashboard
                        </button>
                        <h1>📊 Regional Analytics</h1>
                        <p className="welcome-text">Platform-wide agricultural and demographic insights</p>
                    </div>
                    <div className="header-right" style={{ gap: '16px', flexWrap: 'wrap' }}>
                        <div className="district-filter" style={{ backgroundColor: '#f8fafc', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <label style={{ marginRight: '8px', fontWeight: '600', color: '#475569' }}>Filter by District:</label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' }}
                            >
                                <option value="All">All Districts</option>
                                {SRI_LANKA_DISTRICTS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="btn-download-report"
                            onClick={handlePrint}
                            style={{ height: '45px' }}
                        >
                            {`📄 Print ${selectedDistrict === 'All' ? 'Full' : selectedDistrict} Report`}
                        </button>
                    </div>
                </header>

                {/* KPI Summary Cards */}
                <div className="summary-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon">👥</div>
                        <div className="kpi-info">
                            <h3>Total Users</h3>
                            <p className="kpi-value">{analytics.summary.totalUsers}</p>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">🌾</div>
                        <div className="kpi-info">
                            <h3>Total Crops Tracked</h3>
                            <p className="kpi-value">{analytics.summary.totalCrops}</p>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon">🚜</div>
                        <div className="kpi-info">
                            <h3>Registered Machinery</h3>
                            <p className="kpi-value">{analytics.summary.totalMachinery}</p>
                        </div>
                    </div>
                </div>

                <div className="charts-grid">
                    {/* User Distribution Chart */}
                    <div className="chart-card">
                        <h2>{selectedDistrict === 'All' ? 'User Distribution by District' : `User Distribution in ${selectedDistrict} by Role`}</h2>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={analytics.userDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey={selectedDistrict === 'All' ? "district" : "role"} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="count" name="Total Users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Crop Cultivation Chart */}
                    <div className="chart-card">
                        <h2>Cultivated Acres by Crop Type</h2>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={analytics.cropDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="totalAcres"
                                        nameKey="cropType"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {analytics.cropDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Machinery Distribution Chart */}
                    <div className="chart-card full-width">
                        <h2>Machinery Types Available</h2>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.machineryDistribution} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis dataKey="type" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="count" name="Available Units" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Secret Print-Only Content */}
                {reportData && (
                    <div className="print-only-report">
                        <div className="print-header">
                            <h1>Ministry of Agriculture - AgroLanka</h1>
                            <h2>Comprehensive Regional Analytics Report</h2>
                            <p>Generated on: {new Date().toLocaleDateString()}</p>
                            {selectedDistrict !== 'All' && <h3>District: {selectedDistrict}</h3>}
                        </div>

                        {Object.entries(reportData)
                            .filter(([dist]) => selectedDistrict === 'All' || dist === selectedDistrict)
                            .map(([districtName, stats]) => (
                                <div key={districtName} className="print-district-section">
                                    <h3 className="district-title">District: {districtName}</h3>

                                    <div className="print-table-container">
                                        <h4>User Demographics</h4>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>User Role</th>
                                                    <th>Registered Count</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(stats.users).map(([role, count]) => (
                                                    <tr key={role}>
                                                        <td>{role.replace('_', ' ')}</td>
                                                        <td>{count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="print-table-container">
                                        <h4>Crop Cultivation</h4>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Crop Type</th>
                                                    <th>Total Acres</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(stats.crops).map(([crop, acres]) => (
                                                    <tr key={crop}>
                                                        <td>{crop}</td>
                                                        <td>{acres} Acres</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="print-table-container">
                                        <h4>Machinery & Equipment</h4>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Equipment Type</th>
                                                    <th>Total Units</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(stats.machinery).map(([type, count]) => (
                                                    <tr key={type}>
                                                        <td>{type}</td>
                                                        <td>{count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        <div className="print-footer">
                            <p>© {new Date().getFullYear()} AgroLanka System - Ministry of Agriculture</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegionalReports;
