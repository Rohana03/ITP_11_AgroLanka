import { NavLink } from "react-router-dom";
import "./AdminLayout.css";

const Sidebar = () => {
  return (
    <aside className="admin-sidebar">
      <h2 className="logo">AgroLanka</h2>

      <nav>
        <NavLink to="/admin/dashboard">Dashboard</NavLink>
        <NavLink to="/admin/asc">ASC Centers</NavLink>
        <NavLink to="/admin/staff">Staff</NavLink>
        <NavLink to="/admin/assignment">Assignments</NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
