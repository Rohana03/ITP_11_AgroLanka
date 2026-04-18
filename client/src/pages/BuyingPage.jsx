
import { useState } from 'react'
import SupplierForm from '../components/SupplierForm'
import SupplierList from '../components/SupplierList'
import PaymentForm from '../components/PaymentForm'
import SupplierStatementPanel from '../components/SupplierStatementPanel'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import PurchaseOrderList from '../components/PurchaseOrderList'

export default function BuyingPage(){
  const [refreshSuppliers,setRefreshSuppliers]=useState(0)
  const [refreshPOs,setRefreshPOs]=useState(0)
  return (
    <div className="container">
      <h2 style={{color:'var(--primary)'}}>Buying</h2>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <SupplierForm onCreated={()=>setRefreshSuppliers(s=>s+1)} />
        <SupplierList refreshSignal={refreshSuppliers} />
      </div>
      <div style={{display:'flex', gap:12, marginTop:12}}>
        <PaymentForm refreshToken={refreshSuppliers} onCreated={()=>setRefreshSuppliers(s=>s+1)} />
        <SupplierStatementPanel refreshToken={refreshSuppliers} />
      </div>
      <h3 className="section-title">Purchase Orders, GRN & Receipts</h3>
      <PurchaseOrderForm supplierRefreshToken={refreshSuppliers} onCreated={()=>{ setRefreshPOs(s=>s+1) }} />
      <div style={{margin:'12px 0'}} />
      <PurchaseOrderList refreshSignal={refreshPOs} onChanged={()=>setRefreshPOs(s=>s+1)} />
    </div>
  )
}
