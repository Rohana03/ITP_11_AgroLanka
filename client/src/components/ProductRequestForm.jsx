
import { useState } from 'react'
import api from '../api/api'
export default function ProductRequestForm(){
  const [form,setForm]=useState({ name:'', description:'', category:'fertilizer', brand:'', unit:'', price:'', stockQty:'', tags:'', requestedBy:'' })
  const [image,setImage]=useState(null)
  const [preview,setPreview]=useState('')
  const change=e=> setForm(p=>({...p,[e.target.name]:e.target.value}))
  const pick=e=>{ const f=e.target.files[0]; setImage(f); if(f) setPreview(URL.createObjectURL(f)) }
  const submit=async e=>{ e.preventDefault(); const fd=new FormData(); Object.entries(form).forEach(([k,v])=>fd.append(k,v)); if(form.tags) form.tags.split(',').map(t=>t.trim()).forEach(t=>fd.append('tags',t)); if(image) fd.append('image',image); await api.post('/product-requests', fd, { headers:{'Content-Type':'multipart/form-data'} }); alert('Request submitted for approval'); setForm({ name:'', description:'', category:'fertilizer', brand:'', unit:'', price:'', stockQty:'', tags:'', requestedBy:'' }); setImage(null); setPreview('') }
  return (
    <form onSubmit={submit} className="card">
      <h4 className="section-title">Submit Product Request</h4>
      <div className="label">Requested By</div><input className="input" name="requestedBy" value={form.requestedBy} onChange={change} />
      <div className="label" style={{marginTop:8}}>Name*</div><input className="input" name="name" value={form.name} onChange={change} required />
      <div className="label" style={{marginTop:8}}>Description</div><textarea className="input" name="description" value={form.description} onChange={change} rows={3} />
      <div className="label" style={{marginTop:8}}>Category*</div><select className="input" name="category" value={form.category} onChange={change}><option value="fertilizer">Fertilizer</option><option value="seed">Seed</option><option value="equipment">Equipment</option><option value="other">Other</option></select>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:8}}>
        <div><div className="label">Brand</div><input className="input" name="brand" value={form.brand} onChange={change} /></div>
        <div><div className="label">Unit</div><input className="input" name="unit" value={form.unit} onChange={change} placeholder="kg, bag, litre" /></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:8}}>
        <div><div className="label">Price*</div><input className="input" type="number" step="0.01" name="price" value={form.price} onChange={change} required /></div>
        <div><div className="label">Stock Qty*</div><input className="input" type="number" name="stockQty" value={form.stockQty} onChange={change} required /></div>
      </div>
      <div style={{marginTop:8}}><div className="label">Tags</div><input className="input" name="tags" value={form.tags} onChange={change} /></div>
      <div style={{marginTop:8}}><div className="label">Image</div><input className="input" type="file" accept="image/*" onChange={pick} />{preview && <div><img alt="preview" src={preview} style={{ width: 160, marginTop: 8, borderRadius: 8 }}/></div>}</div>
      <button className="btn btn-primary" type="submit" style={{marginTop:12}}>Submit</button>
    </form>
  )
}
