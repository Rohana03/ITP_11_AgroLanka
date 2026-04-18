
import { useEffect, useState } from 'react'
import api from '../api/api'
export default function SupplierList({ refreshSignal }){
  const [items,setItems]=useState([])
  useEffect(()=>{ (async()=>{ const {data}=await api.get('/suppliers'); setItems(data) })() },[refreshSignal])
  return (
    <div className="card" style={{marginTop:8}}>
      <h4 className="section-title">Suppliers</h4>
      <ul>
        {items.map(s=> <li key={s._id}><strong>{s.name}</strong></li>)}
      </ul>
    </div>
  )}
