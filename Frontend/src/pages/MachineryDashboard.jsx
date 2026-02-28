import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './FarmerDashboard.css';

const STATUS_STYLE = {
    PENDING: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' },
    APPROVED: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #10b981' },
    REJECTED: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
    Available: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #10b981' },
    Booked: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' },
};

const StatusBadge = ({ status }) => (
    <span style={{
        fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
        ...(STATUS_STYLE[status] || { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' })
    }}>
        {status}
    </span>
);

const EmptyState = ({ icon, message }) => (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{icon}</div>
        <p style={{ fontSize: '1rem', fontWeight: '500' }}>{message}</p>
    </div>
);

const MachineryDashboard = () => {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('machinery-requests');
    const [data, setData] = useState({ machineryRequests: [], serviceRequests: [], farmerRentals: [], inventory: [] });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ type: '', text: '' });

    // Inventory form
    const [newItem, setNewItem] = useState({ name: '', type: 'Tractor', totalCount: 1 });
    // Inventory edit state
    const [editingId, setEditingId] = useState(null);
    const [editCount, setEditCount] = useState('');

    const showToast = (type, text) => {
        setToast({ type, text });
        setTimeout(() => setToast({ type: '', text: '' }), 3500);
    };

    useEffect(() => {
        if (user && token) fetchRegionalData();
    }, [user, token]);

    const fetchRegionalData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/machinery/regional-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error('Error fetching regional data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (type, id, status) => {
        try {
            const endpoint = type === 'machinery' ? `/api/machinery/requests/${id}` : `/api/machinery/services/${id}`;
            await axios.patch(`http://localhost:5000${endpoint}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('success', `Status updated to ${status}`);
            fetchRegionalData();
        } catch {
            showToast('error', 'Failed to update status');
        }
    };

    const handleAddInventory = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/machinery/inventory', newItem, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('success', 'Inventory item added!');
            setNewItem({ name: '', type: 'Tractor', totalCount: 1 });
            fetchRegionalData();
        } catch {
            showToast('error', 'Failed to add inventory item');
        }
    };

    const handleDeleteInventory = async (id) => {
        if (!window.confirm('Remove this item from inventory?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/machinery/inventory/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('success', 'Item removed from inventory.');
            fetchRegionalData();
        } catch {
            showToast('error', 'Failed to delete item');
        }
    };

    const handleUpdateAvailable = async (id) => {
        try {
            await axios.patch(`http://localhost:5000/api/machinery/inventory/${id}`, { availableCount: Number(editCount) }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('success', 'Available count updated!');
            setEditingId(null);
            fetchRegionalData();
        } catch {
            showToast('error', 'Failed to update count');
        }
    };

    const generateCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        let headers = "";
        let rows = [];

        if (activeTab === 'machinery-requests') {
            headers = "Farmer Name,Email,NIC,Machinery,Type,Request Date,Duration (Days),Location,Land Size (Ac),Notes,Status";
            rows = data.machineryRequests.map(r => [
                r.farmer?.name, r.farmer?.email, r.farmer?.nic || 'N/A',
                r.machinery?.name, r.machinery?.type,
                new Date(r.requestDate).toLocaleDateString(),
                r.duration, r.location, r.landSize,
                `"${(r.additionalNotes || '').replace(/"/g, '""')}"`,
                r.status
            ]);
        } else if (activeTab === 'service-requests') {
            headers = "Farmer Name,Email,NIC,Service Type,Request Date,Location,Description,Status";
            rows = data.serviceRequests.map(s => [
                s.farmer?.name, s.farmer?.email, s.farmer?.nic || 'N/A',
                s.serviceType,
                new Date(s.requestDate).toLocaleDateString(),
                s.location,
                `"${(s.description || '').replace(/"/g, '""')}"`,
                s.status
            ]);
        } else if (activeTab === 'farmer-rentals') {
            headers = "Farmer Name,Email,Machinery Type,Rent Per Day,Contact Number,Description";
            rows = data.farmerRentals.map(f => [
                f.farmer?.name, f.farmer?.email,
                f.machineryType, f.rentPerDay, f.contactNumber,
                `"${(f.description || '').replace(/"/g, '""')}"`
            ]);
        } else if (activeTab === 'inventory') {
            headers = "Item Name,Type,Total Count,Available Count,Status";
            rows = data.inventory.map(i => [
                i.name, i.type, i.totalCount, i.availableCount,
                i.availableCount > 0 ? 'Available' : 'Booked'
            ]);
        }

        csvContent += headers + "\r\n" + rows.map(e => e.join(",")).join("\r\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Machinery_${activeTab}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = () => {
        window.print();
    };

    // Derived stats
    const pendingMachinery = data.machineryRequests.filter(r => r.status === 'PENDING').length;
    const pendingService = data.serviceRequests.filter(r => r.status === 'PENDING').length;
    const totalInventory = data.inventory.length;
    const availableItems = data.inventory.filter(i => i.availableCount > 0).length;

    const tabs = [
        ['machinery-requests', '🚜 Machinery Requests', pendingMachinery],
        ['service-requests', '🔧 Service Requests', pendingService],
        ['farmer-rentals', '🌾 Farmer Listings', null],
        ['inventory', '📦 ASC Inventory', null],
    ];

    const thStyle = { padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' };
    const tdStyle = { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };

    return (
        <div className="farmer-dashboard-page">
            <style>
                {`
                    @media print {
                        .navbar, .dashboard-header p, .dashboard-header div, 
                        .dashboard-grid, .summary-stats-container, 
                        button, form, .tabs-container { display: none !important; }
                        .dashboard-container { padding: 0 !important; max-width: 100% !important; }
                        table { width: 100% !important; border: 1px solid #ccc !important; font-size: 10px !important; }
                        th, td { padding: 8px !important; }
                        .print-header { display: block !important; margin-bottom: 20px; text-align: center; }
                        h1 { font-size: 18px !important; margin-bottom: 5px !important; }
                    }
                    .print-header { display: none; }
                `}
            </style>
            <Navbar />
            <div className="dashboard-container">
                <div className="print-header">
                    <h2 style={{ color: '#2e7d32', margin: 0 }}>AgroLanka - Agrarian Service Center</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>{user?.assignedAsc?.name} Dashboard Report | {new Date().toLocaleDateString()}</p>
                </div>

                {/* Header */}
                <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="header-info">
                        <h1>Machinery &amp; Service Dashboard 🚜</h1>
                        <p>Welcome, {user?.name}! Manage equipment and field services for your ASC center.</p>
                        {user?.assignedAsc ? (
                            <div style={{ marginTop: '12px', padding: '10px 20px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981', display: 'inline-block' }}>
                                <span style={{ color: '#065f46', fontWeight: '600' }}>📍 Assigned Center: </span>
                                <span style={{ color: '#047857' }}>{user.assignedAsc.name} — {user.assignedAsc.district} District</span>
                            </div>
                        ) : (
                            <div style={{ marginTop: '12px', padding: '10px 20px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #f97316', display: 'inline-block' }}>
                                <span style={{ color: '#9a3412', fontWeight: '500' }}>⚠️ No ASC Center allocated. Please contact Admin.</span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={generateCSV} style={{ padding: '10px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📊 Export CSV
                        </button>
                        <button onClick={generatePDF} style={{ padding: '10px 18px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📄 Export PDF
                        </button>
                    </div>
                </header>

                {/* Summary Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    {[
                        { label: 'Pending Machinery', value: pendingMachinery, icon: '⏳', color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Pending Services', value: pendingService, icon: '🔧', color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Inventory Items', value: totalInventory, icon: '📦', color: '#8b5cf6', bg: '#f5f3ff' },
                        { label: 'Available Items', value: availableItems, icon: '✅', color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Farmer Listings', value: data.farmerRentals.length, icon: '🌾', color: '#f97316', bg: '#fff7ed' },
                    ].map(({ label, value, icon, color, bg }) => (
                        <div key={label} style={{ backgroundColor: bg, border: `1px solid ${color}30`, borderRadius: '12px', padding: '18px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color }}>{value}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Toast */}
                {toast.text && (
                    <div style={{
                        padding: '12px 20px', borderRadius: '8px', marginBottom: '16px', fontWeight: '500',
                        backgroundColor: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
                        color: toast.type === 'success' ? '#166534' : '#991b1b',
                        border: `1px solid ${toast.type === 'success' ? '#10b981' : '#f87171'}`
                    }}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.text}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
                    {tabs.map(([key, label, badge]) => (
                        <button key={key} onClick={() => setActiveTab(key)} style={{
                            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                            borderBottom: activeTab === key ? '3px solid #2e7d32' : '3px solid transparent',
                            fontWeight: activeTab === key ? '700' : '400',
                            color: activeTab === key ? '#166534' : '#64748b', transition: 'all 0.15s',
                        }}>
                            {label}
                            {badge > 0 && (
                                <span style={{ marginLeft: '6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '0.7rem', padding: '1px 6px', fontWeight: '700' }}>
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>⏳ Loading data...</div>
                    ) : (
                        <>
                            {/* ── Machinery Requests ── */}
                            {activeTab === 'machinery-requests' && (
                                data.machineryRequests.length === 0
                                    ? <EmptyState icon="🚜" message="No machinery requests yet for your ASC center." />
                                    : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                {['Farmer', 'Machinery', 'Date Requested', 'Duration', 'Location', 'Land Size', 'Notes', 'Status', 'Actions'].map(h => (
                                                    <th key={h} style={thStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.machineryRequests.map(req => (
                                                <tr key={req._id} style={{ transition: 'background 0.1s' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: '600' }}>{req.farmer?.name}</div>
                                                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{req.farmer?.email}</div>
                                                        {req.farmer?.nic && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>NIC: {req.farmer.nic}</div>}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: '500' }}>{req.machinery?.name || '—'}</div>
                                                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{req.machinery?.type}</div>
                                                    </td>
                                                    <td style={tdStyle}>{new Date(req.requestDate).toLocaleDateString()}</td>
                                                    <td style={tdStyle}>{req.duration ? `${req.duration} day(s)` : '—'}</td>
                                                    <td style={tdStyle}>{req.location || '—'}</td>
                                                    <td style={tdStyle}>{req.landSize ? `${req.landSize} ac` : '—'}</td>
                                                    <td style={{ ...tdStyle, maxWidth: '150px', fontSize: '0.82rem', color: '#64748b' }}>{req.additionalNotes || '—'}</td>
                                                    <td style={tdStyle}><StatusBadge status={req.status} /></td>
                                                    <td style={tdStyle}>
                                                        {req.status === 'PENDING' ? (
                                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                <button onClick={() => handleStatusUpdate('machinery', req._id, 'APPROVED')}
                                                                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                                                                    ✓ Approve
                                                                </button>
                                                                <button onClick={() => handleStatusUpdate('machinery', req._id, 'REJECTED')}
                                                                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                                                                    ✕ Reject
                                                                </button>
                                                            </div>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Reviewed</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            )}

                            {/* ── Service Requests ── */}
                            {activeTab === 'service-requests' && (
                                data.serviceRequests.length === 0
                                    ? <EmptyState icon="🔧" message="No service requests yet for your ASC center." />
                                    : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                {['Farmer', 'Service Type', 'Date Requested', 'Location', 'Description', 'Status', 'Actions'].map(h => (
                                                    <th key={h} style={thStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.serviceRequests.map(req => (
                                                <tr key={req._id}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: '600' }}>{req.farmer?.name}</div>
                                                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{req.farmer?.email}</div>
                                                        {req.farmer?.nic && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>NIC: {req.farmer.nic}</div>}
                                                    </td>
                                                    <td style={tdStyle}><span style={{ fontWeight: '500' }}>{req.serviceType}</span></td>
                                                    <td style={tdStyle}>{new Date(req.requestDate).toLocaleDateString()}</td>
                                                    <td style={tdStyle}>{req.location || '—'}</td>
                                                    <td style={{ ...tdStyle, maxWidth: '180px', fontSize: '0.82rem', color: '#64748b' }}>{req.description || '—'}</td>
                                                    <td style={tdStyle}><StatusBadge status={req.status} /></td>
                                                    <td style={tdStyle}>
                                                        {req.status === 'PENDING' ? (
                                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                <button onClick={() => handleStatusUpdate('service', req._id, 'APPROVED')}
                                                                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                                                                    ✓ Approve
                                                                </button>
                                                                <button onClick={() => handleStatusUpdate('service', req._id, 'REJECTED')}
                                                                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                                                                    ✕ Reject
                                                                </button>
                                                            </div>
                                                        ) : <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Reviewed</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            )}

                            {/* ── Farmer Listings ── */}
                            {activeTab === 'farmer-rentals' && (
                                data.farmerRentals.length === 0
                                    ? <EmptyState icon="🌾" message="No farmer machinery listings in your ASC area." />
                                    : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '24px' }}>
                                        {data.farmerRentals.map(rental => (
                                            <div key={rental._id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>{rental.machineryType}</h4>
                                                    <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>For Rent</span>
                                                </div>
                                                <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.7' }}>
                                                    <div>👤 <strong>{rental.farmer?.name}</strong></div>
                                                    <div>📧 {rental.farmer?.email}</div>
                                                    <div>📞 {rental.contactNumber}</div>
                                                    <div>💵 LKR <strong>{rental.rentPerDay?.toLocaleString()}</strong>/day</div>
                                                    {rental.description && <div style={{ marginTop: '8px', color: '#64748b', fontSize: '0.82rem' }}>{rental.description}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            )}

                            {/* ── ASC Inventory ── */}
                            {activeTab === 'inventory' && (
                                <div style={{ padding: '24px' }}>
                                    {/* Add form */}
                                    <form onSubmit={handleAddInventory} style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f1f8f4', borderRadius: '10px', border: '1px solid #d1fae5', display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Name</label>
                                            <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required placeholder="e.g. John Deere 5075E" style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Type</label>
                                            <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })} style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
                                                {['Tractor', 'Harvester', 'Plough', 'Seeder', 'Sprayer'].map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '0.82rem', fontWeight: '600' }}>Total Count</label>
                                            <input type="number" min="1" value={newItem.totalCount} onChange={e => setNewItem({ ...newItem, totalCount: e.target.value })} required style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', width: '90px' }} />
                                        </div>
                                        <button type="submit" style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>
                                            + Add Item
                                        </button>
                                    </form>

                                    {data.inventory.length === 0
                                        ? <EmptyState icon="📦" message="No inventory items added yet." />
                                        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
                                            {data.inventory.map(item => (
                                                <div key={item._id} style={{ padding: '18px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #2e7d32', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.97rem' }}>{item.name}</h4>
                                                        <button onClick={() => handleDeleteInventory(item._id)}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }} title="Remove item">🗑️</button>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>
                                                        <div>Type: <strong>{item.type}</strong></div>
                                                        <div>Total: <strong>{item.totalCount}</strong></div>
                                                    </div>

                                                    {editingId === item._id ? (
                                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                            <input type="number" min="0" max={item.totalCount} value={editCount}
                                                                onChange={e => setEditCount(e.target.value)}
                                                                style={{ width: '65px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }} />
                                                            <button onClick={() => handleUpdateAvailable(item._id)}
                                                                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                                                            <button onClick={() => setEditingId(null)}
                                                                style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <StatusBadge status={item.availableCount > 0 ? 'Available' : 'Booked'} />
                                                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                                                <strong style={{ color: item.availableCount > 0 ? '#10b981' : '#ef4444' }}>{item.availableCount}</strong>/{item.totalCount} avail.
                                                                <button onClick={() => { setEditingId(item._id); setEditCount(item.availableCount); }}
                                                                    style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.78rem', fontWeight: '600', textDecoration: 'underline' }}>
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    }
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MachineryDashboard;
