import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ManageASC from './pages/admin/ManageASC';
import ManageOfficers from './pages/admin/ManageOfficers';
import FarmerDashboard from './pages/FarmerDashboard';
import RegisterCrop from './pages/RegisterCrop';
import FinancialAssistance from './pages/FinancialAssistance';
import MachineryService from './pages/MachineryService';
import AgriculturalProducts from './pages/AgriculturalProducts';
<<<<<<< HEAD
import FinancialDashboard from './pages/FinancialDashboard';
import CropDashboard from './pages/CropDashboard';
import ProductDashboard from './pages/ProductDashboard';
import MachineryDashboard from './pages/MachineryDashboard';
import ASCDashboard from './pages/ASCDashboard';
import MyCrops from './pages/MyCrops';
=======
>>>>>>> 9b47020 (solved)
import './App.css';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            {/* Public routes - redirect to dashboard if logged in */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected routes - require authentication */}
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/ascs" element={<ProtectedRoute><ManageASC /></ProtectedRoute>} />
            <Route path="/admin/officers" element={<ProtectedRoute><ManageOfficers /></ProtectedRoute>} />

            {/* Farmer routes */}
            <Route path="/farmer-dashboard" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/farmer/register-crop" element={<ProtectedRoute><RegisterCrop /></ProtectedRoute>} />
<<<<<<< HEAD
            <Route path="/farmer/my-crops" element={<ProtectedRoute><MyCrops /></ProtectedRoute>} />
            <Route path="/farmer/financial-aid" element={<ProtectedRoute><FinancialAssistance /></ProtectedRoute>} />
            <Route path="/farmer/machinery" element={<ProtectedRoute><MachineryService /></ProtectedRoute>} />
            <Route path="/farmer/products" element={<ProtectedRoute><AgriculturalProducts /></ProtectedRoute>} />

            {/* Officer routes */}
            <Route path="/financial-dashboard" element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />
            <Route path="/crop-dashboard" element={<ProtectedRoute><CropDashboard /></ProtectedRoute>} />
            <Route path="/product-dashboard" element={<ProtectedRoute><ProductDashboard /></ProtectedRoute>} />
            <Route path="/machinery-dashboard" element={<ProtectedRoute><MachineryDashboard /></ProtectedRoute>} />
            <Route path="/asc-dashboard" element={<ProtectedRoute><ASCDashboard /></ProtectedRoute>} />
=======
            <Route path="/farmer/financial-aid" element={<ProtectedRoute><FinancialAssistance /></ProtectedRoute>} />
            <Route path="/farmer/machinery" element={<ProtectedRoute><MachineryService /></ProtectedRoute>} />
            <Route path="/farmer/products" element={<ProtectedRoute><AgriculturalProducts /></ProtectedRoute>} />
>>>>>>> 9b47020 (solved)
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;


