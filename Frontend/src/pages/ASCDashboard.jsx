import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerDashboard.css';

const ASCDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'overview') return;
        if (['farmers', 'staff', 'crops', 'loans', 'compensations', 'machinery'].includes(activeTab) && user?.assignedAsc) {
            fetchData(activeTab);
        }
    }, [activeTab, user]);

    const fetchData = async (type) => {
        setLoading(true);
        try {
            const ascId = user.assignedAsc?._id || user.assignedAsc;
            let url = '';

            switch (type) {
                case 'farmers': url = `http://localhost:5000/api/ascs/${ascId}/farmers`; break;
                case 'staff': url = `http://localhost:5000/api/ascs/${ascId}/staff`; break;
                case 'crops': url = `http://localhost:5000/api/crops`; break;
                case 'loans': url = `http://localhost:5000/api/loans?ascId=${ascId}`; break;
                case 'compensations': url = `http://localhost:5000/api/compensation`; break;
                case 'machinery': url = `http://localhost:5000/api/machinery/regional-data`; break;
                default: return;
            }

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (type === 'machinery') {
                // Combine machinery data for easier viewing
                const combined = [
                    ...res.data.inventory.map(i => ({ ...i, category: 'Inventory' })),
                    ...res.data.machineryRequests.map(r => ({ ...r, category: 'Request', name: r.machinery?.name }))
                ];
                setData(combined);
            } else {
                setData(res.data);
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const generateCSV = (type) => {
        if (data.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        let headers = "";

        if (type === 'farmers') headers = "Name,Email,NIC";
        else if (type === 'staff') headers = "Name,Email,Role,NIC";
        else if (type === 'crops') headers = "Farmer,Type,Variety,Land Size,Status";
        else if (type === 'loans') headers = "Farmer,Amount,Purpose,Status";
        else if (type === 'compensations') headers = "Farmer,Crop,Damage,Status";
        else if (type === 'machinery') headers = "Item,Type,Category,Status";

        csvContent += headers + "\r\n";

        data.forEach(item => {
            let row = "";
            if (type === 'farmers') row = `${item.name},${item.email},${item.nic}`;
            else if (type === 'staff') row = `${item.name},${item.email},${item.role},${item.nic}`;
            else if (type === 'crops') row = `${item.farmer?.name},${item.cropType},${item.variety},${item.landSize},${item.status}`;
            else if (type === 'loans') row = `${item.farmer?.name},${item.amount},${item.purpose},${item.status}`;
            else if (type === 'compensations') row = `${item.farmer?.name},${item.crop?.cropType},${item.damageType},${item.status}`;
            else if (type === 'machinery') row = `${item.name},${item.type},${item.category},${item.status}`;

            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${user.assignedAsc.name}_${type}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = () => {
        window.print();
    };

    const getTableHeaders = (type) => {
        switch (type) {
            case 'farmers': return ['Name', 'Email', 'NIC'];
            case 'staff': return ['Name', 'Email', 'Role', 'NIC'];
            case 'crops': return ['Farmer', 'Type', 'Variety', 'Land Size', 'Status'];
            case 'loans': return ['Farmer', 'Amount', 'Purpose', 'Status'];
            case 'compensations': return ['Farmer', 'Crop', 'Damage', 'Status'];
            case 'machinery': return ['Item', 'Type', 'Category', 'Status'];
            default: return [];
        }
    };

    const renderTable = (type) => {
        if (type === 'products') {
            return (
                <div className="data-section" style={{ marginTop: '30px', textAlign: 'center' }}>
                    <div style={{ padding: '50px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
                        <h2>Agricultural Products</h2>
                        <p style={{ color: '#7f8c8d', fontSize: '1.2rem' }}>Feature coming soon! Management of fertilizers, seeds, and equipment is under development.</p>
                        <button onClick={() => setActiveTab('overview')} style={{ marginTop: '20px', padding: '10px 25px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back to Overview</button>
                    </div>
                </div>
            );
        }

        const headers = getTableHeaders(type);

        return (
            <div className="data-section" style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ textTransform: 'capitalize' }}>{type.replace(/([A-Z])/g, ' $1')}</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => generateCSV(type)} className="export-btn" style={{ padding: '8px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Generate CSV</button>
                        <button onClick={generatePDF} className="export-btn" style={{ padding: '8px 16px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Generate PDF</button>
                        <button onClick={() => setActiveTab('overview')} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back to Overview</button>
                    </div>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <thead style={{ backgroundColor: '#2ecc71', color: 'white' }}>
                                <tr>
                                    {headers.map(h => <th key={h} style={{ padding: '12px', textAlign: 'left' }}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={item._id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}>
                                        {type === 'farmers' && <><td style={{ padding: '12px' }}>{item.name}</td><td style={{ padding: '12px' }}>{item.email}</td><td style={{ padding: '12px' }}>{item.nic}</td></>}
                                        {type === 'staff' && <><td style={{ padding: '12px' }}>{item.name}</td><td style={{ padding: '12px' }}>{item.email}</td><td style={{ padding: '12px' }}>{item.role}</td><td style={{ padding: '12px' }}>{item.nic}</td></>}
                                        {type === 'crops' && <><td style={{ padding: '12px' }}>{item.farmer?.name}</td><td style={{ padding: '12px' }}>{item.cropType}</td><td style={{ padding: '12px' }}>{item.variety}</td><td style={{ padding: '12px' }}>{item.landSize}</td><td style={{ padding: '12px' }}>{item.status}</td></>}
                                        {type === 'loans' && <><td style={{ padding: '12px' }}>{item.farmer?.name}</td><td style={{ padding: '12px' }}>{item.amount}</td><td style={{ padding: '12px' }}>{item.purpose}</td><td style={{ padding: '12px' }}>{item.status}</td></>}
                                        {type === 'compensations' && <><td style={{ padding: '12px' }}>{item.farmer?.name}</td><td style={{ padding: '12px' }}>{item.crop?.cropType}</td><td style={{ padding: '12px' }}>{item.damageType}</td><td style={{ padding: '12px' }}>{item.status}</td></>}
                                        {type === 'machinery' && <><td style={{ padding: '12px' }}>{item.name}</td><td style={{ padding: '12px' }}>{item.type}</td><td style={{ padding: '12px' }}>{item.category}</td><td style={{ padding: '12px' }}>{item.status}</td></>}
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={headers.length} style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="farmer-dashboard-page">
            <Navbar />
            <div className="dashboard-container">
                <style>
                    {`
                        @media print {
                            .navbar, .export-btn, header, .back-btn { display: none !important; }
                            .data-section { margin-top: 0 !important; }
                            table { width: 100% !important; border: 1px solid #ccc !important; }
                        }
                    `}
                </style>
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1>ASC Officer Dashboard 🏛️</h1>
                        <p>Welcome, {user?.name}! Manage your Agricultural Service Center.</p>
                        {user?.assignedAsc ? (
                            <div className="allocation-info" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981', display: 'inline-block' }}>
                                <span style={{ color: '#065f46', fontWeight: '600' }}>📍 Assigned Center: </span>
                                <span style={{ color: '#047857' }}>{user.assignedAsc.name} - {user.assignedAsc.district} District</span>
                            </div>
                        ) : (
                            <div className="allocation-info" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #f97316', display: 'inline-block' }}>
                                <span style={{ color: '#9a3412', fontWeight: '500' }}>⚠️ No ASC Center allocated yet. Please contact Admin.</span>
                            </div>
                        )}
                    </div>
                </header>

                {activeTab === 'overview' ? (
                    <div className="dashboard-grid">
                        <div className="dashboard-card" onClick={() => setActiveTab('farmers')}>
                            <div className="card-icon">🏘️</div>
                            <h3>Center Management</h3>
                            <p>View all farmers registered under this center.</p>
                        </div>
                        <div className="dashboard-card" onClick={() => setActiveTab('staff')}>
                            <div className="card-icon">👥</div>
                            <h3>Staff Coordination</h3>
                            <p>View allocated officers and staff in your center.</p>
                        </div>
                        <div className="dashboard-card" onClick={() => setActiveTab('crops')}>
                            <div className="card-icon">🌾</div>
                            <h3>Crop Registrations</h3>
                            <p>View all crop registration requests in your center.</p>
                        </div>
                        <div className="dashboard-card" onClick={() => setActiveTab('loans')}>
                            <div className="card-icon">💳</div>
                            <h3>Loan Applications</h3>
                            <p>View all loan requests in your center.</p>
                        </div>
                        <div className="dashboard-card" onClick={() => setActiveTab('compensations')}>
                            <div className="card-icon">📋</div>
                            <h3>Compensation Claims</h3>
                            <p>View crop damage compensation claims.</p>
                        </div>
                        <div className="dashboard-card" onClick={() => setActiveTab('machinery')}>
                            <div className="card-icon">🚜</div>
                            <h3>Machinery & Services</h3>
                            <p>View machinery inventory and service requests.</p>
                        </div>
                        <div className="dashboard-card" onClick={() => setActiveTab('products')}>
                            <div className="card-icon">🛒</div>
                            <h3>Agricultural Products</h3>
                            <p>Management of farming supplies (Coming Soon).</p>
                        </div>
                    </div>
                ) : (
                    renderTable(activeTab)
                )}
            </div>
        </div>
    );
};

export default ASCDashboard;
