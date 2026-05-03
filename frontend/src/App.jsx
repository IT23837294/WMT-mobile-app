/**
 * ===========================================
 * App.jsx - MAIN ROUTING COMPONENT
 * ===========================================
 * 
 * PURPOSE: This is the main application component that handles all routing
 * and defines which pages are accessible based on user roles.
 * 
 * KEY CONCEPTS:
 * - React Router DOM for client-side routing
 * - ProtectedRoute component for role-based access control
 * - Layout component for consistent page structure
 * - useAuth hook for authentication state
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// ===========================================
// SECTION 1: PUBLIC PAGE IMPORTS
// ===========================================
// These pages are accessible to everyone (no login required)
import Login from './pages/Login';           // User authentication page
import Register from './pages/Register';     // User registration page
import Home from './pages/Home';             // Homepage with general info
import SupplierApplication from './pages/SupplierApplication';

// ===========================================
// SECTION 2: CUSTOMER-SPECIFIC PAGE IMPORTS
// ===========================================
// These pages are only for customers (role = 'customer')
import CustomerDashboard from './pages/customer/Dashboard';
import UploadPrescription from './pages/customer/UploadPrescription';  // Upload prescription images
import MyPrescriptions from './pages/customer/MyPrescriptions';        // View prescription history
import Cart from './pages/customer/Cart';                              // Shopping cart
import MyOrders from './pages/customer/MyOrders';                       // Order history
import OrderDetail from './pages/customer/OrderDetail';                 // Single order details
import Profile from './pages/customer/Profile';                         // User profile management
import SupportTicket from './pages/customer/SupportTicket';               // Customer support tickets
import Settings from './pages/customer/Settings';                         // Customer settings page

// ===========================================
// SECTION 3: PHARMACIST PAGE IMPORTS
// ===========================================
// These pages are for pharmacists (role = 'pharmacist' or 'admin')
import PharmacistDashboard from './pages/pharmacist/Dashboard';
import ReviewPrescriptions from './pages/pharmacist/ReviewPrescriptions';  // Review customer prescriptions
import PrescriptionDetail from './pages/pharmacist/PrescriptionDetail';    // View prescription details
import ManageOrders from './pages/pharmacist/ManageOrders';                // Manage customer orders
import InventoryManagement from './pages/pharmacist/InventoryManagement';
import MedicineManagement from './pages/pharmacist/MedicineManagement';

// ===========================================
// SECTION 4: SUPPORT OFFICER PAGE IMPORTS
// ===========================================
// These pages are for support officers (role = 'support_officer')
import SupportDashboard from './pages/support/SupportDashboard';           // Support officer dashboard
import ManagePayments from './pages/admin/ManagePayments';

// ===========================================
// SECTION 4B: SUPPLIER PAGE IMPORTS
// ===========================================
// These pages are for suppliers (role = 'supplier')
import SupplierDashboard from './pages/supplier/Dashboard';
import SupplierDetailsPage from './pages/supplier/SupplierDetailsPage';
import SupplierCatalogPage from './pages/supplier/SupplierCatalogPage';
import SupplierOrdersPage from './pages/supplier/SupplierOrdersPage';
import SupplierInvoicesPage from './pages/supplier/SupplierInvoicesPage';
import SupplierPerformancePage from './pages/supplier/SupplierPerformancePage';

// ===========================================
// SECTION 4: ADMIN PAGE IMPORTS
// ===========================================
// These pages are ONLY for administrators (role = 'admin')
import AdminDashboard from './pages/admin/Dashboard';
import ManageMedicines from './pages/admin/ManageMedicines';      // CRUD operations for medicines
import MedicineForm from './pages/admin/MedicineForm';           // Add/Edit medicine form
import ManageSuppliers from './pages/admin/ManageSuppliers';      // Supplier management
import SupplierForm from './pages/admin/SupplierForm';           // Add/Edit supplier form
import ManageUsers from './pages/admin/ManageUsers';             // User management
import Analytics from './pages/admin/Analytics';               // Statistics and reports
import ManageDeliveries from './pages/admin/ManageDeliveries';   // Delivery management
import SupplierOrders from './pages/admin/SupplierOrders';       // Orders to suppliers
import Alerts from './pages/admin/Alerts';                       // Inventory alerts

// ===========================================
// SECTION 5: SHARED PAGE IMPORTS
// ===========================================
// These pages are accessible to both public and authenticated users
import Medicines from './pages/Medicines';        // Browse available medicines
import MedicineDetail from './pages/MedicineDetail'; // View single medicine details

// ===========================================
// SECTION 6: MAIN APP COMPONENT
// ===========================================
function App() {
  // Get loading state from auth context
  // Loading is true while checking if user is already logged in
  const { loading } = useAuth();

  // ===========================================
  // LOADING SCREEN - Show while auth state is being determined
  // ===========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Animated spinner using Tailwind CSS */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  // ===========================================
  // ROUTES CONFIGURATION
  // ===========================================
  return (
    <Routes>
      {/* ===========================================
          PUBLIC ROUTES - No authentication required
          =========================================== */}
      <Route path="/" element={<Layout />}>
        {/* Index route - shows homepage when visiting / */}
        <Route index element={<Home />} />
        {/* Public medicine browsing */}
        <Route path="medicines" element={<Medicines />} />
        {/* Medicine detail view with ID parameter */}
        <Route path="medicines/:id" element={<MedicineDetail />} />
      </Route>
      
      {/* Standalone auth pages (no Layout wrapper) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/supplier-application" element={<SupplierApplication />} />

      {/* ===========================================
          CUSTOMER ROUTES - Protected, role = 'customer'
          =========================================== */}
      <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="upload-prescription" element={<UploadPrescription />} />
          <Route path="prescriptions" element={<MyPrescriptions />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="support" element={<SupportTicket />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* ===========================================
          PHARMACIST ROUTES - Protected, role = 'pharmacist' or 'admin'
          =========================================== */}
      <Route path="/pharmacist" element={<ProtectedRoute allowedRoles={['pharmacist', 'admin']} />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<PharmacistDashboard />} />
          <Route path="prescriptions" element={<ReviewPrescriptions />} />
          <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route element={<ProtectedRoute allowedRoles={['pharmacist']} />}>
            <Route path="medicines" element={<MedicineManagement />} />
            <Route path="medicines/new" element={<MedicineForm />} />
            <Route path="medicines/edit/:id" element={<MedicineForm />} />
          </Route>
          <Route path="inventory" element={<InventoryManagement />} />
        </Route>
      </Route>

      {/* ===========================================
          SUPPORT OFFICER ROUTES - Protected, role = 'support_officer'
          =========================================== */}
      <Route path="/support-officer" element={<ProtectedRoute allowedRoles={['support_officer']} />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<SupportDashboard />} />
          <Route path="refunds" element={<ManagePayments />} />
        </Route>
      </Route>

      {/* ===========================================
          SUPPLIER ROUTES - Protected, role = 'supplier'
          =========================================== */}
      <Route path="/supplier" element={<ProtectedRoute allowedRoles={['supplier']} />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SupplierDashboard />} />
          <Route path="details" element={<SupplierDetailsPage />} />
          <Route path="catalog" element={<SupplierCatalogPage />} />
          <Route path="orders" element={<SupplierOrdersPage />} />
          <Route path="invoices" element={<SupplierInvoicesPage />} />
          <Route path="performance" element={<SupplierPerformancePage />} />
        </Route>
      </Route>

      {/* ===========================================
          ADMIN ROUTES - Protected, role = 'admin' ONLY
          =========================================== */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          {/* Main admin dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />
          
          {/* Medicine management routes */}
          <Route path="medicines" element={<ManageMedicines />} />
          <Route path="medicines/new" element={<MedicineForm />} />
          <Route path="medicines/edit/:id" element={<MedicineForm />} />
          
          {/* Supplier management routes */}
          <Route path="suppliers" element={<ManageSuppliers />} />
          <Route path="suppliers/new" element={<SupplierForm />} />
          <Route path="suppliers/edit/:id" element={<SupplierForm />} />
          
          {/* Other admin features */}
          <Route path="supplier-orders" element={<SupplierOrders />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="payments" element={<ManagePayments />} />
          <Route path="deliveries" element={<ManageDeliveries />} />
          <Route path="discounts" element={<Navigate to="/admin/medicines" replace />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="inventory" element={<Navigate to="/admin/medicines" replace />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Route>

      {/* ===========================================
          CATCH ALL - Redirect unknown routes to home
          =========================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Export the App component as default
export default App;
