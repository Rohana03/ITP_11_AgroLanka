
import { useEffect, useState } from 'react'
import api from '../api/api'
import { formatLKR } from '../utils/currency'
export default function SupplierStatementPanel({ refreshToken }){
  const [suppliers,setSuppliers]=useState([])
  const [supplier,setSupplier]=useState('')
  const [from,setFrom]=useState('')
  const [to,setTo]=useState('')
  const [statement,setStatement]=useState(null)
  const loadSuppliers = async()=>{ const {data}=await api.get('/suppliers'); setSuppliers(data) }
  useEffect(()=>{ loadSuppliers() },[])
  useEffect(()=>{ loadSuppliers() },[refreshToken])
  const load=async()=>{ if(!supplier) return; const params={}; if(from) params.from=from; if(to) params.to=to; const {data}=await api.get(`/suppliers/${supplier}/statement`,{params}); setStatement(data) }
  const download=()=>{ if(!supplier) return; const p=new URLSearchParams(); if(from) p.set('from',from); if(to) p.set('to',to); p.set('format','pdf'); const url=`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/suppliers/${supplier}/statement?${p.toString()}`; window.open(url,'_blank') }
  return (
    <div className="card" style={{flex:1}}>
      <h4 className="section-title">Supplier Statement</h4>
      <div><div className="label">Supplier*</div><select className="input" value={supplier} onChange={e=>setSupplier(e.target.value)}><option value="">-- Select supplier --</option>{suppliers.map(s=> <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
      <div style={{display:'flex',gap:8}}>
        <div style={{flex:1}}><div className="label">From</div><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
        <div style={{flex:1}}><div className="label">To</div><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
      </div>
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button className="btn" onClick={load}>Load</button>
        <button className="btn btn-accent" onClick={download} disabled={!supplier}>Download PDF</button>
      </div>
      {statement && (
        <div style={{marginTop:12}}>
          <div><strong>Opening:</strong> {formatLKR(statement.openingBalance)}</div>
          <div><strong>Purchases:</strong> {formatLKR(statement.periodPurchases)}</div>
          <div><strong>Payments:</strong> {formatLKR(statement.periodPayments)}</div>
          <div><strong>Closing:</strong> {formatLKR(statement.closingBalance)}</div>
        </div>
      )}
    </div>
  )
}
