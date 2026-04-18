
import { formatLKR } from '../utils/currency'
export default function InventoryCard({ item, onEdit, onDelete }){
  return (
    <div className="card">
      <div className="card-actions">
        <button className="btn" onClick={()=>onEdit(item)}>Edit</button>
        <button className="btn btn-danger" onClick={()=>onDelete(item)}>Delete</button>
      </div>
      {item.imageUrl && (<img src={`${import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000'}${item.imageUrl}`} alt={item.name} style={{ width:'100%', height:160, objectFit:'cover', borderRadius:6 }}/>) }
      <h4 style={{margin:'8px 0'}}>{item.name}</h4>
      <p style={{ margin:'4px 0', color:'var(--muted)' }}>{item.brand} {item.unit?`• ${item.unit}`:''}</p>
      <strong>{formatLKR(item.price)}</strong>
      <p style={{ margin:'4px 0' }}>Stock: <span className="badge">{item.stockQty}</span></p>
      <span className="label" style={{textTransform:'capitalize'}}>{item.category}</span>
      {item.tags && item.tags.length>0 && (
        <div style={{marginTop:6}}>
          {item.tags.map((t,i)=> <span key={i} className="tag">{t}</span>)}
        </div>
      )}
    </div>
  )
}
