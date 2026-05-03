# PHARMACY MANAGEMENT SYSTEM - VIVA PREPARATION GUIDE

## ===========================================
## PROJECT OVERVIEW
## ===========================================

**Project Name:** Pharmacy Management System (PharmaCare)
**Type:** Full-Stack Web Application
**Purpose:** Online pharmacy management with role-based access control

**Tech Stack:**
- Frontend: React 18 + React Router + Axios + Tailwind CSS + Lucide Icons
- Backend: Node.js + Express.js + MongoDB + Mongoose
- Authentication: JWT (JSON Web Tokens) + bcryptjs
- Database: MongoDB (NoSQL)

## ===========================================
## PROJECT STRUCTURE
## ===========================================

```
pharmacy-system/
├── backend/                    # Server-side code
│   ├── server.js              # Main entry point - starts Express server
│   ├── config/
│   │   └── db.js              # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js  # Login, register, user management
│   │   └── medicineController.js # CRUD operations for medicines
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── errorHandler.js    # Global error handling
│   ├── models/
│   │   ├── User.js            # User schema (customer, admin, pharmacist)
│   │   └── Medicine.js        # Medicine schema
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   └── medicineRoutes.js  # Medicine API routes
│   └── seed.js                # Creates demo users
│
└── frontend/                   # Client-side code
    ├── index.html             # HTML entry point
    ├── src/
    │   ├── main.jsx           # React entry point
    │   ├── App.jsx            # Main routing component
    │   ├── index.css          # Tailwind + custom styles
    │   ├── context/
    │   │   └── AuthContext.jsx # Global authentication state
    │   ├── components/
    │   │   ├── Layout.jsx     # Navigation + sidebar
    │   │   └── ProtectedRoute.jsx # Route guard
    │   └── pages/
    │       ├── Login.jsx      # Authentication page
    │       ├── Register.jsx   # Registration page
    │       ├── admin/         # Admin-only pages
    │       │   ├── Dashboard.jsx
    │       │   ├── ManageMedicines.jsx
    │       │   ├── InventoryManagement.jsx  # NEW
    │       │   ├── ManagePayments.jsx
    │       │   ├── ManageDeliveries.jsx
    │       │   ├── SupplierOrders.jsx
    │       │   ├── ManageDiscounts.jsx
    │       │   ├── Alerts.jsx
    │       │   └── Analytics.jsx
    │       ├── customer/      # Customer pages
    │       └── pharmacist/    # Pharmacist pages
    └── vite.config.js         # Vite configuration + proxy
```

## ===========================================
## HOW TO EXPLAIN THE BUILD PROCESS
## ===========================================

### 1. SETUP PHASE
**"First, we set up the project structure..."**
- Created backend folder for Node.js server
- Created frontend folder for React app using Vite
- Initialized both with `npm init` and installed dependencies
- Backend: express, mongoose, cors, dotenv, bcryptjs, jsonwebtoken
- Frontend: react, react-router-dom, axios, lucide-react, tailwindcss

### 2. DATABASE DESIGN
**"We designed MongoDB schemas..."**
- User Schema: name, email, password (hashed), role, phone, address, isActive
- Medicine Schema: name, price, quantity, thresholdValue, category, manufacturer
- Used Mongoose for ODM (Object Document Mapping)
- Password hashing with bcrypt (12 salt rounds)

### 3. BACKEND DEVELOPMENT
**"Then we built the API layer..."**
- **server.js**: Created Express app, middleware (cors, json parser), route mounting
- **authController.js**: 
  - `register()`: Hash password, create user, return JWT
  - `login()`: Verify credentials, check isActive, return JWT
  - `getMe()`: Get current user from token
- **Middleware auth.js**: Verify JWT token from header, attach user to request
- **Routes**: Mounted controllers to URLs (/api/auth/login, /api/auth/register)

### 4. FRONTEND ARCHITECTURE
**"For the frontend, we used component-based architecture..."**
- **main.jsx**: Entry point, wraps App with BrowserRouter and AuthProvider
- **AuthContext.jsx**: React Context for global auth state (login, logout, user data)
- **App.jsx**: Central routing using react-router-dom
  - Public routes: Home, Login, Register
  - Protected routes wrapped in ProtectedRoute component
  - Role-based routing: /admin/*, /pharmacist/*, /customer/*
- **Layout.jsx**: Common layout with sidebar navigation based on user role

### 5. ROLE-BASED ACCESS CONTROL
**"We implemented 3 user roles with different permissions..."**
1. **Admin**: Full access - medicines, inventory, suppliers, users, payments, deliveries, analytics
2. **Pharmacist**: Review prescriptions, manage orders
3. **Customer**: Upload prescriptions, cart, orders, profile

**How it works:**
- JWT token contains user ID
- ProtectedRoute component checks token and role
- If unauthorized → redirect to login
- Navigation items rendered based on user.role

### 6. KEY FEATURES IMPLEMENTED

#### Authentication Flow:
```
Login Form → API Call (/api/auth/login) → JWT Token Stored 
→ AuthContext Updated → Redirect Based on Role
```

#### Inventory Management:
- Add medicine with initial quantity + threshold value
- Update stock (refill after purchase, reduce after sale)
- Low stock alerts (quantity ≤ threshold)
- Mark discontinued/unavailable medicines
- Cart connection logic (validate stock before checkout)

#### Pages Created:
1. **ManageMedicines.jsx** - Basic CRUD for medicines
2. **InventoryManagement.jsx** - Advanced inventory with thresholds
3. **ManagePayments.jsx** - Payment tracking
4. **ManageDeliveries.jsx** - Delivery status management
5. **SupplierOrders.jsx** - Order from suppliers
6. **ManageDiscounts.jsx** - Discount code management
7. **Alerts.jsx** - Inventory alerts display

### 7. STATE MANAGEMENT
**"We managed state using React Context..."**
- AuthContext: user, isAuthenticated, loading
- Local storage: JWT token persistence
- Axios interceptors: Attach token to every request automatically

### 8. STYLING
**"We used Tailwind CSS for styling..."**
- Utility-first CSS framework
- Custom color theme (medical-50 to medical-900)
- Responsive design with flexbox and grid
- Lucide React for consistent icons

## ===========================================
## KEY CODE PATTERNS TO EXPLAIN
## ===========================================

### JWT Authentication Pattern:
```javascript
// 1. Generate token on login
token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' })

// 2. Store in localStorage
localStorage.setItem('token', token)

// 3. Attach to axios headers
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

// 4. Middleware verifies token on protected routes
const decoded = jwt.verify(token, JWT_SECRET)
req.user = await User.findById(decoded.id)
```

### Protected Route Pattern:
```javascript
// Check auth and role before rendering
if (!isAuthenticated) → redirect to login
if (!allowedRoles.includes(user.role)) → redirect to home
else → render children (the actual page)
```

### CRUD Operations Pattern:
```javascript
// Frontend: API call
const response = await axios.get('/api/medicines')
setMedicines(response.data.medicines)

// Backend: Controller
exports.getMedicines = async (req, res) => {
  const medicines = await Medicine.find()
  res.json({ success: true, medicines })
}
```

## ===========================================
## COMMON VIVA QUESTIONS & ANSWERS
## ===========================================

**Q: How do users stay logged in after refresh?**
A: JWT token stored in localStorage. On page load, main.jsx checks token and fetches user data.

**Q: How is security handled?**
A: Passwords hashed with bcrypt, JWT for session management, protected routes check authentication, CORS enabled.

**Q: How do you handle different user roles?**
A: Role stored in User model. ProtectedRoute component checks role before rendering. Layout shows different navigation based on role.

**Q: What is the database structure?**
A: MongoDB with collections: users, medicines, prescriptions, orders, suppliers. Used Mongoose for schema validation.

**Q: How does inventory tracking work?**
A: Each medicine has quantity and thresholdValue. When quantity ≤ threshold, low stock alert shown. Stock updates after sales/refills.

**Q: What is React Context used for?**
A: Global state management for authentication. Avoids prop drilling. Any component can access auth state via useAuth() hook.

## ===========================================
## QUICK DEMO SCRIPT
## ===========================================

**Opening:** "I built a Pharmacy Management System with role-based access control..."

1. **Show Login Page**: "Users can log in as admin, pharmacist, or customer"
2. **Login as Admin**: "Admin has full access to all features"
3. **Navigate Inventory**: "Here we can add medicines with quantity and threshold values"
4. **Show Low Stock Alert**: "When quantity drops below threshold, we get alerts"
5. **Show Cart Connection**: "Inventory connects to cart for stock validation"
6. **Show Navigation**: "Different users see different menus based on their role"

## ===========================================
## COMMANDS TO REMEMBER
## ===========================================

```bash
# Start backend
cd backend
npm run dev          # Uses nodemon, runs on port 5000

# Start frontend  
cd frontend
npm run dev          # Uses Vite, runs on port 3000

# Seed demo users
cd backend
node seed.js

# Check if backend is running
curl http://localhost:5000/api/health
```

## ===========================================
## CREDENTIALS FOR DEMO
## ===========================================

| Role       | Email                | Password    |
|------------|---------------------|-------------|
| Admin      | admin@example.com   | admin123    |
| Pharmacist | pharma@example.com  | pharma123   |
| Customer   | customer@example.com| customer123 |

## ===========================================
## FILE LOCATION QUICK REFERENCE
## ===========================================

**Main Files for Viva:**
- Entry: `frontend/src/main.jsx`
- Routes: `frontend/src/App.jsx`
- Auth: `frontend/src/context/AuthContext.jsx`
- Layout: `frontend/src/components/Layout.jsx`
- Login: `frontend/src/pages/Login.jsx`
- Backend: `backend/server.js`
- Auth API: `backend/controllers/authController.js`
- Inventory: `frontend/src/pages/admin/InventoryManagement.jsx`

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---
**END OF VIVA PREPARATION GUIDE**
