
import ProductRequestForm from '../components/ProductRequestForm'
export default function ProductsPage(){
  return (
    <div className="container">
      <h2 style={{color:'var(--primary)'}}>Products</h2>
      <p className="label">This page only allows submitting product requests for approval. Approved items will appear in inventory automatically.</p>
      <ProductRequestForm />
    </div>
  )
}
