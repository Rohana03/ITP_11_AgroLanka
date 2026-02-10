import { Routes, Route } from "react-router-dom";
import AdminLayout from "../components/admin/layout/AdminLayout";
import Dashboard from "../components/admin/dashboard/Dashboard";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
