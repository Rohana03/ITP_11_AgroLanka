
import { useEffect, useState } from 'react'
import api from '../api/api'

export default function ProductEditor({ product, onSaved, onClose }){
  const [f,setF]=useState({ name:'', description:'', category:'other', brand:'', unit:'', price:'', stockQty:'', tags:'' })
  const [image,setImage]=useState(null)
  useEffect(()=>{
    if(product){
      setF({
        name: product.name||'', description: product.description||'', category: product.category||'other',
        brand: product.brand||'', unit: product.unit||'', price: product.price??'', stockQty: product.stockQty??'',
        tags: (product.tags||[]).join(', ')
      })
    }
  },[product])
  const submit= async (e)=>{
    e.preventDefault()
    const fd = new FormData()
    Object.entries(f).forEach(([k,v])=> fd.append(k, v))
    if(f.tags) f.tags.split(',').map(t=>t.trim()).forEach(t=> fd.append('tags', t))
    if(image) fd.append('image', image)
    await api.patch(`/products/${product._id}`, fd, { headers: { 'Content-Type':'multipart/form-data' } })
    onSaved?.()
  }
  return (
    <form onSubmit={submit}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div><div className="label">Name*</div><input className="input" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required /></div>
        <div><div className="label">Category*</div>
          <select className="input" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>
            <option value="fertilizer">Fertilizer</option>
            <option value="seed">Seed</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div><div className="label">Brand</div><input className="input" value={f.brand} onChange={e=>setF({...f,brand:e.target.value})} /></div>
        <div><div className="label">Unit</div><input className="input" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})} placeholder="kg, bag, litre" /></div>
        <div><div className="label">Price (LKR)*</div><input className="input" type="number" step="0.01" value={f.price} onChange={e=>setF({...f,price:e.target.value})} required /></div>
        <div><div className="label">Stock Qty*</div><input className="input" type="number" value={f.stockQty} onChange={e=>setF({...f,stockQty:e.target.value})} required /></div>
        <div style={{gridColumn:'1/3'}}><div className="label">Description</div><textarea className="input" rows={2} value={f.description} onChange={e=>setF({...f,description:e.target.value})} /></div>
        <div style={{gridColumn:'1/2'}}><div className="label">Tags</div><input className="input" value={f.tags} onChange={e=>setF({...f,tags:e.target.value})} placeholder="comma separated" /></div>
        <div style={{gridColumn:'2/3'}}><div className="label">Image</div><input className="input" type="file" accept="image/*" onChange={e=>setImage(e.target.files[0])} /></div>
      </div>
      <div className="actions">
        <button className="btn" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  )
}
