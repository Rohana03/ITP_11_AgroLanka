import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './AdminDashboard.css';
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
    
    // Delete modal state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: null, itemName: '' });

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
        
        if (Number(newItem.totalCount) < 1) {
            showToast('error', 'Total count must be at least 1.');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/machinery/inventory', newItem, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('success', 'Inventory item added!');
            setNewItem({ name: '', type: 'Tractor', totalCount: 1 });
            fetchRegionalData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to add inventory item';
            showToast('error', errorMsg);
        }
    };

    const triggerDelete = (id, name) => {
        setDeleteModal({ isOpen: true, itemId: id, itemName: name });
    };

    const confirmDelete = async () => {
        const id = deleteModal.itemId;
        setDeleteModal({ isOpen: false, itemId: null, itemName: '' });
        if (!id) return;

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
        const countValue = Number(editCount);
        if (isNaN(countValue) || countValue < 0) {
            showToast('error', 'Available count cannot be negative.');
            return;
        }

        // Find the item to check its totalCount
        const item = data.inventory.find(i => i._id === id);
        if (item && countValue > item.totalCount) {
            showToast('error', `Available count cannot exceed total count (${item.totalCount}).`);
            return;
        }

        try {
            await axios.patch(`http://localhost:5000/api/machinery/inventory/${id}`, { availableCount: countValue }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('success', 'Available count updated!');
            setEditingId(null);
            fetchRegionalData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to update count';
            showToast('error', errorMsg);
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
        const ascName = user?.assignedAsc?.name || 'ASC Center';
        const district = user?.assignedAsc?.district || '';
        const date = new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });

        const pendingMachineryRows = data.machineryRequests.filter(r => r.status === 'PENDING');
        const pendingServiceRows = data.serviceRequests.filter(r => r.status === 'PENDING');
        const availableInventory = data.inventory.filter(i => i.availableCount > 0);

        const section = (title, icon, tableHTML) => `
            <div class="section">
                <h2 class="section-title">${icon} ${title}</h2>
                ${tableHTML}
            </div>`;

        const emptyRow = (cols, msg) =>
            `<tr><td colspan="${cols}" style="text-align:center;color:#94a3b8;padding:16px;font-style:italic;">${msg}</td></tr>`;

        // Table 1: Pending Machinery Requests
        const machineryRows = pendingMachineryRows.length > 0
            ? pendingMachineryRows.map(r => `<tr>
                <td>${r.farmer?.name || '-'}<br/><small>${r.farmer?.email || ''}</small><br/><small>NIC: ${r.farmer?.nic || '-'}</small></td>
                <td>${r.machinery?.name || '-'}<br/><small>${r.machinery?.type || ''}</small></td>
                <td>${new Date(r.requestDate).toLocaleDateString()}</td>
                <td>${r.duration ? r.duration + ' day(s)' : '-'}</td>
                <td>${r.location || '-'}</td>
                <td>${r.landSize ? r.landSize + ' ac' : '-'}</td>
                <td>${r.additionalNotes || '-'}</td>
            </tr>`).join('')
            : emptyRow(7, 'No pending machinery requests.');

        const machineryTable = `<table><thead><tr><th>Farmer</th><th>Machinery</th><th>Date</th><th>Duration</th><th>Location</th><th>Land Size</th><th>Notes</th></tr></thead><tbody>${machineryRows}</tbody></table>`;

        // Table 2: Pending Service Requests
        const serviceRows = pendingServiceRows.length > 0
            ? pendingServiceRows.map(r => `<tr>
                <td>${r.farmer?.name || '-'}<br/><small>${r.farmer?.email || ''}</small><br/><small>NIC: ${r.farmer?.nic || '-'}</small></td>
                <td>${r.serviceType || '-'}</td>
                <td>${new Date(r.requestDate).toLocaleDateString()}</td>
                <td>${r.location || '-'}</td>
                <td>${r.description || '-'}</td>
            </tr>`).join('')
            : emptyRow(5, 'No pending service requests.');

        const serviceTable = `<table><thead><tr><th>Farmer</th><th>Service Type</th><th>Date</th><th>Location</th><th>Description</th></tr></thead><tbody>${serviceRows}</tbody></table>`;

        // Table 3: ASC Inventory (Available Items)
        const inventoryRows = data.inventory.length > 0
            ? data.inventory.map(i => `<tr>
                <td>${i.name || '-'}</td>
                <td>${i.type || '-'}</td>
                <td style="text-align:center;"><strong>${i.totalCount}</strong></td>
                <td style="text-align:center;color:${i.availableCount > 0 ? '#166534' : '#991b1b'};"><strong>${i.availableCount}</strong></td>
                <td style="text-align:center;">${i.totalCount - i.availableCount}</td>
                <td><strong>${i.availableCount > 0 ? '✅ Available' : '🔴 Fully Booked'}</strong></td>
            </tr>`).join('')
            : emptyRow(6, 'No inventory items recorded.');

        const inventoryTable = `<table><thead><tr><th>Item Name</th><th>Type</th><th style="text-align:center;">Total</th><th style="text-align:center;">Available</th><th style="text-align:center;">Booked</th><th>Status</th></tr></thead><tbody>${inventoryRows}</tbody></table>`;

        // Table 4: Farmer Listings
        const farmerRows = data.farmerRentals.length > 0
            ? data.farmerRentals.map(r => `<tr>
                <td>${r.farmer?.name || '-'}<br/><small>${r.farmer?.email || ''}</small></td>
                <td>${r.machineryType || '-'}</td>
                <td>LKR ${r.rentPerDay?.toLocaleString() || '-'} / day</td>
                <td>${r.contactNumber || '-'}</td>
                <td>${r.description || '-'}</td>
            </tr>`).join('')
            : emptyRow(5, 'No farmer machinery listings in this area.');

        const farmerTable = `<table><thead><tr><th>Farmer</th><th>Machinery Type</th><th>Rent Per Day</th><th>Contact</th><th>Description</th></tr></thead><tbody>${farmerRows}</tbody></table>`;

        const html = `<!DOCTYPE html><html><head><title>Machinery & Service Report - ${ascName}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 13px; }
            .report-header { text-align: center; border-bottom: 3px solid #2e7d32; padding-bottom: 18px; margin-bottom: 24px; }
            .report-header h1 { color: #2e7d32; font-size: 22px; margin: 0 0 6px 0; }
            .report-header p { color: #64748b; margin: 4px 0; font-size: 12px; }
            .summary-row { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
            .summary-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; flex: 1; min-width: 110px; text-align: center; }
            .summary-box .num { font-size: 26px; font-weight: 800; color: #2e7d32; }
            .summary-box .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
            .section { margin-bottom: 36px; }
            .section-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 10px; padding: 8px 14px; background: #f1f5f9; border-left: 4px solid #2e7d32; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #2e7d32; color: white; padding: 9px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            tr:nth-child(even) td { background: #f8fafc; }
            small { color: #94a3b8; font-size: 9px; display: block; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print { body { margin: 15px; } .section { page-break-inside: avoid; } }
        </style></head><body>
        <div class="report-header">
            <h1>🌾 AgroLanka - Agricultural Service Center</h1>
            <p>${ascName}${district ? ' · ' + district + ' District' : ''}</p>
            <p style="font-size:15px; font-weight:700; color:#1e293b; margin-top:8px;">Machinery &amp; Service Dashboard Report</p>
            <p>Generated on: ${date} &nbsp;·&nbsp; Officer: ${user?.name || ''}</p>
        </div>
        <div class="summary-row">
            <div class="summary-box"><div class="num">${pendingMachineryRows.length}</div><div class="lbl">Pending Machinery</div></div>
            <div class="summary-box"><div class="num">${pendingServiceRows.length}</div><div class="lbl">Pending Services</div></div>
            <div class="summary-box"><div class="num">${data.inventory.length}</div><div class="lbl">Inventory Items</div></div>
            <div class="summary-box"><div class="num">${availableInventory.length}</div><div class="lbl">Available Items</div></div>
            <div class="summary-box"><div class="num">${data.farmerRentals.length}</div><div class="lbl">Farmer Listings</div></div>
        </div>
        ${section('Pending Machinery Requests', '🚜', machineryTable)}
        ${section('Pending Service Requests', '🔧', serviceTable)}
        ${section('ASC Inventory', '📦', inventoryTable)}
        ${section('Farmer Machinery Listings', '🌾', farmerTable)}
        <div class="footer">AgroLanka Agricultural Management System &mdash; Confidential Report &mdash; ${date}</div>
        </body></html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 400);
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

    const thStyle = { padding: '22px 24px', textAlign: 'left', color: 'white', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em' };
    const tdStyle = { padding: '18px 24px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };

    return (
        <div className="admin-dashboard">
            <style>{`.print-header { display: none; } .machinery-row:hover { background-color: #f0fdf4 !important; }`}</style>
            <Navbar />
            <div className="dashboard-container">
                <div className="print-header">
                    <h2 style={{ color: '#2e7d32', margin: 0 }}>AgroLanka - Agrarian Service Center</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>{user?.assignedAsc?.name} Dashboard Report | {new Date().toLocaleDateString()}</p>
                </div>

                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1e3a8a' }}>Machinery & Service 🚜</h1>
                            <span className="role-badge" style={{ backgroundColor: '#15803d', color: 'white', padding: '4px 12px' }}>
                                ASC LOGISTICS
                            </span>
                        </div>
                        <p className="welcome-text" style={{ fontSize: '1.2rem', margin: 0 }}>
                            Welcome back, <strong style={{ color: '#15803d' }}>{user?.name}</strong>! Manage equipment and field services.
                        </p>
                    </div>

                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {user?.assignedAsc ? (
                            <div style={{ padding: '16px 24px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <div style={{ color: '#166534', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 ASSIGNED CENTER</div>
                                <div style={{ color: '#14532d', fontSize: '1.1rem', fontWeight: 'bold' }}>{user.assignedAsc.name}</div>
                                <div style={{ color: '#166534', fontSize: '0.9rem' }}>{user.assignedAsc.district} District</div>
                            </div>
                        ) : (
                            <div style={{ padding: '12px 20px', backgroundColor: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                <span style={{ color: '#9a3412', fontWeight: '600' }}>⚠️ NO CENTER ALLOCATED</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={generateCSV} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📊 CSV</button>
                            <button onClick={generatePDF} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📄 PDF</button>
                        </div>
                    </div>
                </header>

                {/* Summary Stat Cards */}
                <div className="stats-grid">
                    {[
                        { label: 'Pending Machinery', value: pendingMachinery, icon: '⏳', color: '#f59e0b' },
                        { label: 'Pending Services', value: pendingService, icon: '🔧', color: '#3b82f6' },
                        { label: 'Inventory Items', value: totalInventory, icon: '📦', color: '#8b5cf6' },
                        { label: 'Available Items', value: availableItems, icon: '✅', color: '#10b981' },
                        { label: 'Farmer Listings', value: data.farmerRentals.length, icon: '🌾', color: '#f97316' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="stat-card">
                            <div className="card-icon">{icon}</div>
                            <div className="stat-label">{label}</div>
                            <div className="stat-value" style={{ color }}>{value}</div>
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
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid rgba(255, 255, 255, 0.2)', flexWrap: 'wrap' }}>
                    {tabs.map(([key, label, badge]) => (
                        <button key={key} onClick={() => setActiveTab(key)} style={{
                            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                            borderBottom: activeTab === key ? '3px solid #4ade80' : '3px solid transparent',
                            fontWeight: activeTab === key ? '700' : '400',
                            color: activeTab === key ? '#ffffff' : 'rgba(255, 255, 255, 0.7)', transition: 'all 0.15s',
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
                <div className="data-section dashboard-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>⏳ Loading data...</div>
                    ) : (
                        <>
                            {/* ── Machinery Requests ── */}
                            {activeTab === 'machinery-requests' && (
                                data.machineryRequests.length === 0
                                    ? <EmptyState icon="🚜" message="No machinery requests yet for your ASC center." />
                                    : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: '#2e7d32' }}>
                                            <tr>
                                                {['Farmer', 'Machinery', 'Date Requested', 'Duration', 'Location', 'Land Size', 'Notes', 'Status', 'Actions'].map(h => (
                                                    <th key={h} style={thStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.machineryRequests.map((req, index) => (
                                                <tr key={req._id} className="machinery-row" style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
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
                                        <thead style={{ backgroundColor: '#2e7d32' }}>
                                            <tr>
                                                {['Farmer', 'Service Type', 'Date Requested', 'Location', 'Description', 'Status', 'Actions'].map(h => (
                                                    <th key={h} style={thStyle}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.serviceRequests.map((req, index) => (
                                                <tr key={req._id} className="machinery-row" style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
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
                                    : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', padding: '32px' }}>
                                        {data.farmerRentals.map(rental => (
                                            <div key={rental._id} style={{
                                                padding: '24px',
                                                backgroundColor: 'white',
                                                borderRadius: '16px',
                                                border: '1px solid #f1f5f9',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                                transition: 'transform 0.2s',
                                            }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827', fontWeight: '800' }}>{rental.machineryType}</h4>
                                                    <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>Farmer Asset</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#064e3b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' }}>{(rental.farmer?.name || 'F')[0].toUpperCase()}</div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.9rem' }}>{rental.farmer?.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{rental.farmer?.email}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem', color: '#475569', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ marginBottom: '4px' }}>📞 <span style={{ fontWeight: '600' }}>{rental.contactNumber}</span></div>
                                                        <div>💵 <span style={{ color: '#059669', fontWeight: '800' }}>LKR {rental.rentPerDay?.toLocaleString()}</span> / day</div>
                                                    </div>
                                                    {rental.description && <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>"{rental.description}"</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                            )}

                            {/* ── ASC Inventory ── */}
                            {activeTab === 'inventory' && (
                                <div style={{ padding: '32px' }}>
                                    {/* Add form */}
                                    <form onSubmit={handleAddInventory} style={{
                                        marginBottom: '32px',
                                        padding: '24px',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        gap: '20px',
                                        alignItems: 'flex-end',
                                        flexWrap: 'wrap',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                    }}>
                                        <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '200px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Equipment Name</label>
                                            <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required placeholder="e.g. John Deere 5075E" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem' }} />
                                        </div>
                                        <div className="form-group" style={{ margin: 0, width: '200px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Category</label>
                                            <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', backgroundColor: 'white' }}>
                                                {['Tractor', 'Harvester', 'Plough', 'Seeder', 'Sprayer'].map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ margin: 0, width: '120px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Quantity</label>
                                            <input type="number" min="1" value={newItem.totalCount} onChange={e => setNewItem({ ...newItem, totalCount: e.target.value })} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem' }} />
                                        </div>
                                        <button type="submit" style={{ backgroundColor: '#064e3b', color: 'white', border: 'none', padding: '13px 28px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#043b2c'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#064e3b'}>
                                            <span>➕ Add to Registry</span>
                                        </button>
                                    </form>

                                    {data.inventory.length === 0
                                        ? <EmptyState icon="📦" message="No inventory items added yet." />
                                        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                                            {data.inventory.map(item => (
                                                <div key={item._id} style={{
                                                    padding: '24px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '16px',
                                                    border: '1px solid #f1f5f9',
                                                    borderTop: '6px solid #064e3b',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                    transition: 'all 0.2s'
                                                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.type}</div>
                                                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#111827', fontWeight: '800' }}>{item.name}</h4>
                                                        </div>
                                                        <button onClick={() => triggerDelete(item._id, item.name)}
                                                            style={{ background: '#fef2f2', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove item">🗑️</button>
                                                    </div>

                                                    <div style={{ margin: '16px 0', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span>Total Units:</span>
                                                            <strong style={{ color: '#1e293b' }}>{item.totalCount}</strong>
                                                        </div>
                                                        <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', backgroundColor: '#059669', width: `${(item.availableCount / item.totalCount) * 100}%` }}></div>
                                                        </div>
                                                    </div>

                                                    {editingId === item._id ? (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <input type="number" min="0" max={item.totalCount} value={editCount}
                                                                onChange={e => setEditCount(e.target.value)}
                                                                style={{ width: '70px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.9rem' }} />
                                                            <button onClick={() => handleUpdateAvailable(item._id)}
                                                                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>Save</button>
                                                            <button onClick={() => setEditingId(null)}
                                                                style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                backgroundColor: item.availableCount > 0 ? '#dcfce7' : '#fee2e2',
                                                                color: item.availableCount > 0 ? '#166534' : '#991b1b',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '800'
                                                            }}>
                                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                                                                {item.availableCount > 0 ? 'AVAILABLE' : 'ALL BOOKED'}
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                                                <strong style={{ color: '#1e293b' }}>{item.availableCount}</strong> available
                                                                <button onClick={() => { setEditingId(item._id); setEditCount(item.availableCount); }}
                                                                    style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'underline' }}>
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
                {/* Delete Confirmation Modal */}
                {deleteModal.isOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            transform: deleteModal.isOpen ? 'translateY(0)' : 'translateY(-20px)', 
                            transition: 'all 0.3s ease-in-out', borderTop: '6px solid #dc2626'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', marginBottom: '16px', fontSize: '1.5rem' }}>
                                ⚠️
                            </div>
                            <h3 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '1.25rem', fontWeight: 'bold' }}>Remove Equipment</h3>
                            <p style={{ margin: '0 0 24px 0', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Are you sure you want to remove <strong>{deleteModal.itemName}</strong> from the inventory? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '' })}
                                    style={{ padding: '10px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}>
                                    Cancel
                                </button>
                                <button onClick={confirmDelete}
                                    style={{ padding: '10px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#b91c1c'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#dc2626'}>
                                    Yes, Remove Item
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MachineryDashboard;
