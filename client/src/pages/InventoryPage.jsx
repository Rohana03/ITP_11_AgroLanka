
import InventoryList from '../components/InventoryList'
export default function InventoryPage(){
  return (
    <div className="container">
      <h2 style={{color:'var(--primary)'}}>Inventory</h2>
      <p className="label">View, <strong>edit</strong> or <strong>delete</strong> inventory items. Use the search and filters to find items quickly.</p>
      <InventoryList />
    </div>
  )
}
