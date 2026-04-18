
import { useState } from 'react'
import api from '../api/api'
export default function SupplierForm({ onCreated }){
  const [f,setF]=useState({ name:'', email:'', address:'' })
  const [contactPhone,setContactPhone]=useState('')
  const submit=async e=>{
    e.preventDefault();
    let contactName = '', phone = ''
    const v = (contactPhone||'').trim()
    if(v){
      const m = v.match(/^(.*?)[\|\-,]*\s*(\+?\d[\d\s-]{6,})$/)
      if(m){ contactName=(m[1]||'').trim(); phone=(m[2]||'').replace(/\s+/g,'') } else { contactName=v }
    }
    await api.post('/suppliers', { ...f, contactName, phone });
    onCreated?.(); setF({ name:'', email:'', address:'' }); setContactPhone('')
  }
  return (
    <form onSubmit={submit} className="card">
      <h4 className="section-title">Add Supplier</h4>
      <div style={{display:'grid',gap:8,gridTemplateColumns:'1fr 1fr'}}>
        <div><div className="label">Supplier Name*</div><input className="input" required value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></div>
        <div><div className="label">Contact & Phone</div><input className="input" placeholder="Kasun Perera - 0771234567" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} /></div>
        <div><div className="label">Email</div><input className="input" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} /></div>
        <div><div className="label">Address</div><input className="input" value={f.address} onChange={e=>setF({...f,address:e.target.value})} /></div>
      </div>
      <button className="btn btn-primary" type="submit" style={{marginTop:8}}>Save</button>
    </form>
  )
}
