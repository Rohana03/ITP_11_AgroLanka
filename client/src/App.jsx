
import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProductsPage from './pages/ProductsPage'
import ApprovalsPage from './pages/ApprovalsPage'
import InventoryPage from './pages/InventoryPage'
import BuyingPage from './pages/BuyingPage'

export default function App(){
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/buying" element={<BuyingPage />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </div>
  )
}
