
import ProductRequestAdminList from '../components/ProductRequestAdminList'
export default function ApprovalsPage(){
  return (
    <div className="container">
      <h2 style={{color:'var(--primary)'}}>Approvals</h2>
      <p className="label">Review pending product requests. Approving will add the product to inventory automatically.</p>
      <ProductRequestAdminList />
    </div>
  )
}
