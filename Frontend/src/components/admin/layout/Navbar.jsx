import { NavLink } from "react-router-dom";
import "./AdminLayout.css";

const Navbar = () => {
  return (
    <header className="admin-navbar">
      <div className="nav-left">
        <h2 className="logo">AgroLanka</h2>
      </div>

      <nav className="nav-links">
        <NavLink to="/admin/dashboard">Dashboard</NavLink>
        <NavLink to="/admin/asc">ASC Centers</NavLink>
        <NavLink to="/admin/staff">Staff</NavLink>
        <NavLink to="/admin/assignment">Assignments</NavLink>
      </nav>
    </header>
  );
};

export default Navbar;
