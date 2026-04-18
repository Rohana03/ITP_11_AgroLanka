
import { NavLink } from 'react-router-dom'
export default function NavBar(){
  return (
    <nav className="nav">
      <div className="nav-inner container">
        <div style={{fontWeight:800,color:'var(--primary)'}}>Agro Lanka</div>
        <NavLink to="/products" className={({isActive})=> isActive?'active':''}>Products</NavLink>
        <NavLink to="/approvals" className={({isActive})=> isActive?'active':''}>Approvals</NavLink>
        <NavLink to="/inventory" className={({isActive})=> isActive?'active':''}>Inventory</NavLink>
        <NavLink to="/buying" className={({isActive})=> isActive?'active':''}>Buying</NavLink>
      </div>
    </nav>
  )
}
