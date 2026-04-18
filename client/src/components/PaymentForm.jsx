
import { useEffect, useState } from 'react'
import api from '../api/api'
export default function PaymentForm({ refreshToken, onCreated }){
  const [suppliers,setSuppliers]=useState([])
  const [supplier,setSupplier]=useState('')
  const [amount,setAmount]=useState('')
  const [date,setDate]=useState('')
  const [reference,setReference]=useState('')
  const loadSuppliers = async()=>{ const {data}=await api.get('/suppliers'); setSuppliers(data) }
  useEffect(()=>{ loadSuppliers() },[])
  useEffect(()=>{ loadSuppliers() },[refreshToken])
  const submit=async e=>{ e.preventDefault(); if(!supplier) return alert('Select supplier'); await api.post(`/suppliers/${supplier}/payments`, { amount, date, reference }); setAmount(''); setDate(''); setReference(''); onCreated?.() }
  return (
    <form onSubmit={submit} className="card" style={{flex:1}}>
      <h4 className="section-title">Record Payment</h4>
      <div><div className="label">Supplier*</div><select className="input" value={supplier} onChange={e=>setSupplier(e.target.value)} required><option value="">-- Select --</option>{suppliers.map(s=> <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
      <div><div className="label">Amount*</div><input className="input" type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required /></div>
      <div><div className="label">Date</div><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
      <div><div className="label">Reference</div><input className="input" value={reference} onChange={e=>setReference(e.target.value)} /></div>
      <button className="btn btn-primary" type="submit" style={{marginTop:8}}>Save Payment</button>
    </form>
  )
}
