
import { useEffect, useState } from 'react'
import api from '../api/api'
import InventoryCard from './InventoryCard'
import SimpleModal from './SimpleModal'
import ProductEditor from './ProductEditor'

export default function InventoryList(){
  const [items,setItems] = useState([])
  const [q,setQ] = useState('')
  const [category,setCategory] = useState('')
  const [page,setPage] = useState(1)
  const [pages,setPages] = useState(1)
  const [editing,setEditing] = useState(null)
  const load = async (p=1)=>{ const params={ page:p, limit:12 }; if(q) params.q=q; if(category) params.category=category; const {data}=await api.get('/products',{params}); setItems(data.items); setPage(data.page); setPages(data.pages) }
  useEffect(()=>{ load(1) },[q,category])

  const onDelete = async (item)=>{
    if(!confirm(`Delete product “${item.name}”? This cannot be undone.`)) return
    await api.delete(`/products/${item._id}`)
    load(page)
  }

  const onSaved = ()=>{ setEditing(null); load(page) }

  return (
    <div>
      <div className="card" style={{display:'flex',gap:8,marginBottom:12}}>
        <input className="input" placeholder="Search inventory..." value={q} onChange={e=>setQ(e.target.value)} />
        <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="fertilizer">Fertilizer</option>
          <option value="seed">Seed</option>
          <option value="equipment">Equipment</option>
          <option value="other">Other</option>
        </select>
        <button className="btn" onClick={()=>{ setQ(''); setCategory('') }}>Reset</button>
      </div>
      <div className="grid grid-cols">
        {items.map(p=> <InventoryCard key={p._id} item={p} onEdit={setEditing} onDelete={onDelete} />)}
      </div>
      <div style={{ marginTop:12, display:'flex', gap:8 }}>
        <button className="btn" disabled={page<=1} onClick={()=>load(page-1)}>Prev</button>
        <span>Page {page} / {pages}</span>
        <button className="btn" disabled={page>=pages} onClick={()=>load(page+1)}>Next</button>
      </div>

      <SimpleModal open={!!editing} title={`Edit Product` } onClose={()=>setEditing(null)}>
        {editing && <ProductEditor product={editing} onSaved={onSaved} onClose={()=>setEditing(null)} />}
      </SimpleModal>
    </div>
  )
}
