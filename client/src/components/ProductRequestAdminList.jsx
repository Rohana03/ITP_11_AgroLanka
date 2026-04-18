
import { useEffect, useState } from 'react'
import api from '../api/api'
import { formatLKR } from '../utils/currency'
function Row({ r, onChanged }){
  const [reason,setReason] = useState('')
  const [busy,setBusy] = useState(false)
  const approve = async ()=>{ setBusy(true); try{ await api.patch(`/product-requests/${r._id}/approve`, { reviewedBy: 'admin' }); onChanged?.() } finally{ setBusy(false) } }
  const reject = async ()=>{ if(!reason) return alert('Please enter a rejection reason'); setBusy(true); try{ await api.patch(`/product-requests/${r._id}/reject`, { reviewedBy: 'admin', reason }); setReason(''); onChanged?.() } finally{ setBusy(false) } }
  return (
    <div className="card" style={{display:'grid',gridTemplateColumns:'120px 1fr auto',gap:12,alignItems:'start'}}>
      <div>{r.imageUrl ? <img src={`${import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000'}${r.imageUrl}`} alt={r.name} style={{ width:120, height:90, objectFit:'cover', borderRadius:8 }} /> : <div style={{width:120,height:90,background:'#f1f5f9',borderRadius:8}}/>}</div>
      <div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><strong>{r.name}</strong><span className={`status ${r.status}`}>{r.status}</span></div>
        <div className="label">{r.category} • {r.brand} {r.unit?`• ${r.unit}`:''}</div>
        <div style={{marginTop:4}}>Price: <strong>{formatLKR(r.price)}</strong> • Stock: <strong>{r.stockQty}</strong></div>
        {r.tags && r.tags.length>0 && <div style={{marginTop:4}}>{r.tags.map((t,i)=><span key={i} className="tag">{t}</span>)}</div>}
        {r.requestedBy && <div style={{marginTop:4}} className="label">Requested by: {r.requestedBy}</div>}
        {r.rejectionReason && <div style={{marginTop:4,color:'#991b1b'}}>Reason: {r.rejectionReason}</div>}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {r.status==='pending' ? (
          <>
            <button className="btn btn-primary" disabled={busy} onClick={approve}>Approve → Add to Products</button>
            <input className="input" placeholder="Reject reason" value={reason} onChange={e=>setReason(e.target.value)} />
            <button className="btn btn-danger" disabled={busy} onClick={reject}>Reject</button>
          </>
        ) : (
          <div className={`status ${r.status}`} style={{textAlign:'center'}}>{r.status.toUpperCase()}</div>
        )}
      </div>
    </div>
  )
}
export default function ProductRequestAdminList(){
  const [items,setItems]=useState([])
  const [status,setStatus]=useState('pending')
  const [q,setQ]=useState('')
  const [page,setPage]=useState(1)
  const [pages,setPages]=useState(1)
  const load= async(p=1)=>{ const params={ status, page:p, limit:10 }; const {data}=await api.get('/product-requests',{ params }); let filtered=data.items; if(q) filtered=filtered.filter(x=> x.name.toLowerCase().includes(q.toLowerCase())); setItems(filtered); setPage(data.page); setPages(data.pages) }
  useEffect(()=>{ load(1) },[status,q])
  return (
    <div>
      <div className="card" style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
        <input className="input" placeholder="Search by name" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:300}} />
        <select className="input" value={status} onChange={e=>setStatus(e.target.value)} style={{maxWidth:240}}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>
      <div style={{display:'grid',gap:8}}>
        {items.map(r=> <Row key={r._id} r={r} onChanged={()=>load(page)} />)}
      </div>
      <div style={{ marginTop:12, display:'flex', gap:8 }}>
        <button className="btn" disabled={page<=1} onClick={()=>load(page-1)}>Prev</button>
        <span>Page {page} / {pages}</span>
        <button className="btn" disabled={page>=pages} onClick={()=>load(page+1)}>Next</button>
      </div>
    </div>
  )
}
