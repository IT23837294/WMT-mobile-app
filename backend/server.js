/**
 * ===========================================
 * server.js - MAIN SERVER ENTRY POINT
 * ===========================================
 * 
 * PURPOSE: This is the main entry point for the backend API server.
 * It sets up Express, connects to MongoDB, configures middleware,
 * mounts API routes, and starts the server.
 * 
 * KEY CONCEPTS:
 * - Express.js web framework
 * - MongoDB connection via Mongoose
 * - CORS for cross-origin requests
 * - JWT authentication middleware
 * - RESTful API structure
 * - Error handling middleware
 * 
 * SERVER START COMMAND: npm run dev (uses nodemon)
 * DEFAULT PORT: 5000
 */

// ===========================================
// IMPORT REQUIRED PACKAGES
// ===========================================
const express = require('express');      // Web framework for Node.js
const dotenv = require('dotenv');        // Load environment variables from .env file
const cors = require('cors');            // Enable Cross-Origin Resource Sharing
const path = require('path');            // Handle file paths
const connectDB = require('./config/db'); // MongoDB connection function
const { errorHandler, notFound } = require('./middleware/errorHandler'); // Error handlers

// ===========================================
// LOAD ENVIRONMENT VARIABLES
// Loads variables from .env file into process.env
// Examples: MONGODB_URI, JWT_SECRET, PORT, NODE_ENV
// ===========================================
dotenv.config();

// ===========================================
// CONNECT TO MONGODB DATABASE
// Establishes connection to MongoDB using Mongoose
// Defined in config/db.js
// ===========================================
connectDB();

// ===========================================
// INITIALIZE EXPRESS APPLICATION
// Creates the Express app instance
// ===========================================
const app = express();

// ===========================================
// GLOBAL MIDDLEWARE CONFIGURATION
// Middleware functions that process every request
// ===========================================

// CORS - Allow frontend (localhost:3000) to communicate with backend (localhost:5000)
// Without this, browser blocks requests due to same-origin policy
app.use(cors());

// BODY PARSER - Parse JSON data in request body
// Required to access req.body in POST/PUT requests
app.use(express.json());

// URL ENCODED - Parse form data in request body
// extended: true allows parsing of nested objects
app.use(express.urlencoded({ extended: true }));

// ===========================================
// STATIC FILES CONFIGURATION
// Serve uploaded files (prescriptions, avatars) as static content
// Files in /uploads folder accessible via /uploads/filename URL
// ===========================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===========================================
// API ROUTES MOUNTING
// Each route handles specific entity/functionalities
// All routes prefixed with /api
// ===========================================

// Authentication routes: /api/auth
// Handles: register, login, get profile, update profile
app.use('/api/auth', require('./routes/authRoutes'));

// Medicine routes: /api/medicines
// Handles: CRUD operations for medicines, search, filter
app.use('/api/medicines', require('./routes/medicineRoutes'));

// Prescription routes: /api/prescriptions
// Handles: upload prescriptions, review by pharmacist
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));

// Cart routes: /api/cart
// Handles: add to cart, remove, update quantity
app.use('/api/cart', require('./routes/cartRoutes'));

// Order routes: /api/orders
// Handles: create orders, payment, delivery status
app.use('/api/orders', require('./routes/orderRoutes'));

// Review routes: /api/reviews
// Handles: customer medicine and service ratings
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Supplier routes: /api/suppliers
// Handles: supplier CRUD, supplier orders
app.use('/api/suppliers', require('./routes/supplierRoutes'));

// Supplier order routes: /api/supplier-orders
// Handles: suggested purchase orders and supplier replenishment workflow
app.use('/api/supplier-orders', require('./routes/supplierOrderRoutes'));

// Ticket routes: /api/tickets
// Handles: customer support tickets, status updates
app.use('/api/tickets', require('./routes/ticketRoutes'));

// Refund routes: /api/refunds
// Handles: customer refund processing and medicine restocking
app.use('/api/refunds', require('./routes/refundRoutes'));

// ===========================================
// HEALTH CHECK ENDPOINT
// Simple endpoint to verify server is running
// URL: GET /api/health
// Used for monitoring and testing connectivity
// ===========================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pharmacy Management System API is running'
  });
});

// ===========================================
// ERROR HANDLING MIDDLEWARE
// Must be defined AFTER all routes
// ===========================================

// 404 Not Found - Handle requests to undefined routes
app.use(notFound);

// Global Error Handler - Catches all errors and formats response
app.use(errorHandler);

// ===========================================
// SERVER STARTUP
// ===========================================

// Get port from environment variable or use default 5000
const PORT = process.env.PORT || 5000;

// Start server and keep a reference for graceful shutdown/error handling
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend process or change PORT in backend/.env.`);
    process.exit(1);
  }

  throw err;
});

// ===========================================
// UNHANDLED PROMISE REJECTIONS
// Graceful shutdown if database or other promises fail
// Prevents app from running in unstable state
// ===========================================
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
