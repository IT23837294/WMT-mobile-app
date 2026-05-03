/**
 * ===========================================
 * Layout.jsx - MAIN LAYOUT COMPONENT
 * ===========================================
 * 
 * PURPOSE: Provides the common page structure including:
 * - Header with logo and user info
 * - Sidebar navigation based on user role
 * - Mobile responsive menu
 * - Logout functionality
 * 
 * KEY CONCEPTS:
 * - Outlet component renders the current page content
 * - Role-based navigation using switch statement
 * - React Router hooks: useNavigate, useLocation
 * - Tailwind CSS for responsive design
 */

import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

// ===========================================
// ICON IMPORTS - Lucide React icons for UI
// ===========================================
import { 
  Home,           // Home icon for default navigation
  Pill,           // Medicine/pill icon
  Upload,         // Upload prescription
  FileText,       // Prescriptions/orders
  ShoppingCart,   // Cart icon
  Package,        // Orders/deliveries
  User,           // User profile
  Settings,       // Settings icon
  LogOut,         // Logout button
  Menu,           // Mobile menu toggle
  X,              // Close mobile menu
  LayoutDashboard,// Dashboard icon
  Users,          // Users management
  AlertTriangle,  // Alerts/warnings
  BarChart3,      // Analytics charts
  CreditCard,     // Payments
  Truck,          // Supplier orders
  Building2,      // Supplier details
  Factory,        // Supplier portal
  ClipboardList,  // Supplier dashboard sections
  Headphones      // Support/customer service icon
} from 'lucide-react';

// ===========================================
// MAIN LAYOUT COMPONENT
// ===========================================
const Layout = () => {
  // Get user data and logout function from auth context
  const { user, logout } = useAuth();
  
  // React Router hooks for navigation
  const navigate = useNavigate();      // Programmatic navigation
  const location = useLocation();      // Current URL path
  
  // State for mobile menu visibility
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // ===========================================
  // LOGOUT HANDLER
  // Clears auth state and redirects to login page
  // ===========================================
  const handleLogout = () => {
    logout();              // Clear token from localStorage
    navigate('/login');    // Redirect to login page
  };

  // ===========================================
  // ROLE-BASED NAVIGATION CONFIGURATION
  // Returns different menu items based on user's role
  // This is how we implement role-based access in the UI
  // ===========================================
  const getNavigation = () => {
    const basePath = user?.role || '';
    
    // Switch statement returns different nav arrays for each role
    switch (user?.role) {
      // ===========================================
      // CUSTOMER NAVIGATION
      // Customers can: browse, upload prescriptions, manage orders, view profile
      // ===========================================
      case 'customer':
        return [
          { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
          { name: 'Upload Prescription', path: '/customer/upload-prescription', icon: Upload },
          { name: 'My Prescriptions', path: '/customer/prescriptions', icon: FileText },
          { name: 'Cart', path: '/customer/cart', icon: ShoppingCart },
          { name: 'My Orders', path: '/customer/orders', icon: Package },
          { name: 'Support', path: '/customer/support', icon: Headphones },
          { name: 'Settings', path: '/customer/settings', icon: Settings },
          { name: 'Profile', path: '/customer/profile', icon: User },
        ];
      
      // ===========================================
      // PHARMACIST NAVIGATION
      // Pharmacists can: review prescriptions, manage orders
      // ===========================================
      case 'pharmacist':
        return [
          { name: 'Dashboard', path: '/pharmacist/dashboard', icon: LayoutDashboard },
          { name: 'Review Prescriptions', path: '/pharmacist/prescriptions', icon: FileText },
          { name: 'Manage Orders', path: '/pharmacist/orders', icon: Package },
          { name: 'Medicines', path: '/pharmacist/medicines', icon: Pill },
          { name: 'Inventory', path: '/pharmacist/inventory', icon: Package },
        ];

      // ===========================================
      // SUPPORT OFFICER NAVIGATION
      // Support officers can manage customer tickets and view customer profiles
      // ===========================================
      case 'support_officer':
        return [
          { name: 'Dashboard', path: '/support-officer/dashboard', icon: LayoutDashboard },
          { name: 'Refunds', path: '/support-officer/refunds', icon: CreditCard },
        ];

      // ===========================================
      // SUPPLIER NAVIGATION
      // Suppliers can review the dashboard and jump to key sections
      // ===========================================
      case 'supplier':
        return [
          { name: 'Dashboard', path: '/supplier/dashboard', icon: Factory },
          { name: 'Supplier Details', path: '/supplier/details', icon: Building2 },
          { name: 'Catalog', path: '/supplier/catalog', icon: ClipboardList },
          { name: 'Orders', path: '/supplier/orders', icon: Truck },
          { name: 'Invoices', path: '/supplier/invoices', icon: FileText },
          { name: 'Performance', path: '/supplier/performance', icon: BarChart3 },
        ];
      
      // ===========================================
      // ADMIN NAVIGATION
      // Admins have full access to all management features
      // ===========================================
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Suppliers', path: '/admin/suppliers', icon: Users },
          { name: 'Supplier Orders', path: '/admin/supplier-orders', icon: Truck },
          { name: 'Users', path: '/admin/users', icon: User },
          { name: 'Payments', path: '/admin/payments', icon: CreditCard },
          { name: 'Deliveries', path: '/admin/deliveries', icon: Package },
          { name: 'Alerts', path: '/admin/alerts', icon: AlertTriangle },
          { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        ];
      
      // ===========================================
      // DEFAULT NAVIGATION (Not logged in)
      // ===========================================
      default:
        return [
          { name: 'Home', path: '/', icon: Home },
          { name: 'Medicines', path: '/medicines', icon: Pill },
        ];
    }
  };

  // Get navigation items based on user role
  const navigation = getNavigation();
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
  const isPharmacist = user?.role === 'pharmacist';
  const isSupplier = user?.role === 'supplier';
  const isSupportOfficer = user?.role === 'support_officer';
  const hasBrandedSidebar = isAdmin || isCustomer || isPharmacist || isSupplier || isSupportOfficer;
  
  // Helper function to check if a nav item is active
  // Compares current URL path with the nav item path
  const isActive = (path) => {
    return location.pathname === path;
  };

  // ===========================================
  // RENDER - Main layout structure
  // ===========================================
  return (
    <div className={`min-h-screen ${hasBrandedSidebar ? 'bg-[linear-gradient(180deg,#f8fafc_0%,#eef6f7_100%)]' : 'bg-gray-50'}`}>
      
      {/* ===========================================
          HEADER SECTION
          - Logo and brand name
          - User info and role badge (when logged in)
          - Login/Register links (when not logged in)
          - Mobile menu toggle button
          =========================================== */}
      <header className={`sticky top-0 z-50 ${hasBrandedSidebar ? 'border-b border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.06)]' : 'bg-white shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <BrandLogo compact />
              </Link>
            </div>

            {/* ===========================================
                DESKTOP NAVIGATION - Header right side
                =========================================== */}
            <div className="hidden md:flex items-center space-x-4">
              {!user ? (
                // Not logged in - show public links
                <>
                  <Link to="/medicines" className="text-gray-600 hover:text-gray-900">
                    Medicines
                  </Link>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Register
                  </Link>
                </>
              ) : (
                // Logged in - show user info and logout
                <div className="flex items-center space-x-4">
                  {/* Welcome message with user name */}
                  <span className="text-sm text-gray-600">
                    Welcome, {user.name}
                  </span>
                  {/* Role badge - shows 'Admin', 'Pharmacist', or 'Customer' */}
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${hasBrandedSidebar ? 'bg-slate-900 text-white' : 'bg-medical-100 text-medical-800'}`}>
                    {user.role}
                  </span>
                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* ===========================================
                MOBILE MENU BUTTON
                Only visible on small screens (md:hidden)
                =========================================== */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {/* Toggle between Menu and X icons */}
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* ===========================================
            MOBILE NAVIGATION DROPDOWN
            Shows when mobileMenuOpen is true
            Only visible on small screens
            =========================================== */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                // Mobile nav for logged-in users - map through navigation array
                navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.path)
                        ? 'bg-medical-50 text-medical-700'    // Active state
                        : 'text-gray-600 hover:bg-gray-50'      // Inactive state
                    }`}
                    onClick={() => setMobileMenuOpen(false)}  // Close menu on click
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))
              ) : (
                // Mobile nav for guests
                <>
                  <Link
                    to="/medicines"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Pill className="h-5 w-5" />
                    <span>Medicines</span>
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ===========================================
          MAIN CONTENT AREA
          Flex container holds sidebar and main content
          =========================================== */}
      <div className="flex">
        
        {/* ===========================================
            SIDEBAR - Desktop Only
            - Only visible when user is logged in
            - Hidden on mobile (md:block means medium screens and up)
            - Shows role-based navigation links
            =========================================== */}
        {user && (
          <aside className={`hidden md:block w-72 min-h-screen ${hasBrandedSidebar ? 'px-4 py-6' : 'bg-white shadow-sm'}`}>
            <div className={hasBrandedSidebar ? 'sticky top-24 rounded-[2rem] border border-slate-200/70 bg-slate-950 px-4 py-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]' : ''}>
            <nav className={hasBrandedSidebar ? 'mt-1' : 'mt-5 px-2'}>
              {hasBrandedSidebar ? (
                <div className="mb-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="mb-3">
                    <BrandLogo theme="dark" compact />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-teal-200/80">
                    {isAdmin ? 'Admin Control' : isPharmacist ? 'Pharmacist Hub' : isSupportOfficer ? 'Support Desk' : 'Customer Portal'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {isAdmin
                      ? 'Manage medicines, payments, deliveries, suppliers, users, and analytics from one workspace.'
                      : isPharmacist
                        ? 'Review prescriptions, process orders, and monitor pharmacy operations from one workspace.'
                        : isSupportOfficer
                          ? 'Track support queues, review customer cases, and process refund follow-ups from one workspace.'
                          : 'Track prescriptions, manage orders, review cart activity, and keep your pharmacy details in one workspace.'}
                  </p>
                </div>
              ) : null}
              <div className="space-y-1">
                {/* Map through navigation items and render links */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? (hasBrandedSidebar ? 'bg-white text-slate-950 shadow-sm' : 'bg-medical-50 text-medical-700')
                        : (hasBrandedSidebar ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                    }`}
                  >
                    {/* Icon component dynamically rendered */}
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
            </div>
          </aside>
        )}

        {/* ===========================================
            MAIN CONTENT AREA
            - Outlet renders the current page component
            - Flex-1 makes it fill remaining space
            - Padding only when user is logged in
            =========================================== */}
        <main className={`flex-1 ${user ? 'p-6' : ''} ${hasBrandedSidebar ? 'lg:p-8' : ''}`}>
          <div className={user ? 'max-w-7xl mx-auto' : ''}>
            {/* Outlet is a placeholder for child routes */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Export Layout component for use in App.jsx
export default Layout;
