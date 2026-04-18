
import { useEffect, useState } from 'react'
import api from '../api/api'
import { formatLKR } from '../utils/currency'
export default function PurchaseOrderForm({ supplierRefreshToken, onCreated }){
  const [suppliers,setSuppliers]=useState([])
  const [products,setProducts]=useState([])
  const [supplier,setSupplier]=useState('')
  const [items,setItems]=useState([])
  const loadRefs = async()=>{ const [sRes,pRes]=await Promise.all([api.get('/suppliers'), api.get('/products',{params:{limit:999}})]); setSuppliers(sRes.data); setProducts(pRes.data.items) }
  useEffect(()=>{ loadRefs() },[])
  useEffect(()=>{ loadRefs() },[supplierRefreshToken])
  const add=()=> setItems([...items,{product:'',qty:1,unitCost:0}])
  const update=(i,patch)=> setItems(items.map((it,idx)=> idx===i?{...it,...patch}:it))
  const remove=i=> setItems(items.filter((_,idx)=> idx!==i))
  const total = items.reduce((s,it)=> s + Number(it.qty||0)*Number(it.unitCost||0), 0)
  const submit=async e=>{ e.preventDefault(); if(!supplier) return alert('Select a supplier'); if(!items.length) return alert('Add at least one item'); await api.post('/purchase-orders',{ supplier, items }); onCreated?.(); setSupplier(''); setItems([]) }
  return (
    <form onSubmit={submit} className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h4 className="section-title">Create Purchase Order</h4>
        <span className="status draft" title="PO is created as Draft and changes after GRN">DRAFT</span>
      </div>
      <p className="label">Note: This purchase order will be saved as <strong>Draft</strong> until items are received (GRN).</p>
      <div><div className="label">Supplier*</div><select className="input" value={supplier} onChange={e=>setSupplier(e.target.value)} required><option value="">-- Select supplier --</option>{suppliers.map(s=> <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
      <div style={{marginTop:8}}><button className="btn" type="button" onClick={add}>+ Add Item</button></div>
      {items.map((it,i)=> (
        <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:8,alignItems:'end',marginTop:8}}>
          <div><div className="label">Product</div><select className="input" value={it.product} onChange={e=>update(i,{product:e.target.value})}><option value="">-- select --</option>{products.map(p=> <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
          <div><div className="label"><strong>Qty</strong></div><input className="input" type="number" min="1" placeholder="Enter quantity" value={it.qty} onChange={e=>update(i,{qty:e.target.value})} /></div>
          <div><div className="label"><strong>Unit Cost (LKR)</strong></div><input className="input" type="number" step="0.01" placeholder="0.00" value={it.unitCost} onChange={e=>update(i,{unitCost:e.target.value})} /></div>
          <div><button className="btn" type="button" onClick={()=>remove(i)} style={{background:'#eee'}}>Remove</button></div>
        </div>
      ))}
      <div style={{marginTop:8}}><strong>Total: {formatLKR(total)}</strong></div>
      <button className="btn btn-primary" type="submit" style={{marginTop:8}}>Save</button>
    </form>
  )
}
