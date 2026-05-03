/**
 * ===========================================
 * authController.js - AUTHENTICATION CONTROLLER
 * ===========================================
 * 
 * PURPOSE: Handles all authentication-related API endpoints including:
 * - User registration (sign up)
 * - User login (sign in)
 * - Get current user profile
 * - Update profile
 * - Change password
 * - Admin: Get all users, toggle user status
 * 
 * KEY CONCEPTS:
 * - JWT (JSON Web Token) for session management
 * - bcrypt for password hashing (done in User model)
 * - MongoDB/Mongoose for database operations
 * - REST API with JSON responses
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const { ensureDemoSupplierData } = require('../utils/demoSupplierData');
const {
  DEMO_SUPPORT_EMAIL,
  DEMO_SUPPORT_PASSWORD,
  DEMO_SUPPORT_PASSWORD_ALIASES,
  ensureDemoSupportData
} = require('../utils/demoSupportData');
const { waitForDatabaseReady } = require('../config/db');

const normalizeAddressBook = (addressBook = [], fallbackAddress = {}) => {
  const normalized = Array.isArray(addressBook)
    ? addressBook
        .map((entry) => ({
          label: ['Home', 'Work', 'Other'].includes(entry?.label) ? entry.label : 'Home',
          street: entry?.street?.trim() || '',
          city: entry?.city?.trim() || '',
          state: entry?.state?.trim() || '',
          zipCode: entry?.zipCode?.trim() || '',
          country: entry?.country?.trim() || 'Sri Lanka',
          deliveryInstructions: entry?.deliveryInstructions?.trim() || '',
          isDefault: Boolean(entry?.isDefault)
        }))
        .filter((entry) => entry.street || entry.city || entry.state || entry.zipCode)
    : [];

  if (normalized.length === 0 && (fallbackAddress?.street || fallbackAddress?.city || fallbackAddress?.state || fallbackAddress?.zipCode)) {
    return [{
      label: 'Home',
      street: fallbackAddress.street?.trim() || '',
      city: fallbackAddress.city?.trim() || '',
      state: fallbackAddress.state?.trim() || '',
      zipCode: fallbackAddress.zipCode?.trim() || '',
      country: fallbackAddress.country?.trim() || 'Sri Lanka',
      deliveryInstructions: '',
      isDefault: true
    }];
  }

  const hasDefault = normalized.some((entry) => entry.isDefault);
  return normalized.map((entry, index) => ({
    ...entry,
    isDefault: hasDefault ? entry.isDefault : index === 0
  }));
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  addressBook: user.addressBook || [],
  avatar: user.avatar
});

// ===========================================
// GENERATE JWT TOKEN
// Creates a signed token containing user ID
// Token expires in 30 days
// ===========================================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const isDemoSupplierCredentials = (email = '', password = '') => (
  String(email).trim().toLowerCase() === 'supplier@example.com' &&
  String(password) === 'supplier123'
);

const isDemoSupportCredentials = (email = '', password = '') => (
  String(email).trim().toLowerCase() === DEMO_SUPPORT_EMAIL &&
  DEMO_SUPPORT_PASSWORD_ALIASES.includes(String(password))
);

const DEMO_USERS = {
  'admin@example.com': {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    phone: '1234567890',
    role: 'admin',
    address: {
      street: '123 Admin Street',
      city: 'Admin City',
      state: 'AC',
      zipCode: '12345',
      country: 'Sri Lanka'
    }
  },
  'pharma@example.com': {
    name: 'Pharmacist User',
    email: 'pharma@example.com',
    password: 'pharma123',
    phone: '0987654321',
    role: 'pharmacist',
    address: {
      street: '456 Pharmacy Ave',
      city: 'Pharma City',
      state: 'PC',
      zipCode: '54321',
      country: 'Sri Lanka'
    }
  },
  'customer@example.com': {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'customer123',
    phone: '5555555555',
    role: 'customer',
    address: {
      street: '789 Customer Rd',
      city: 'Customer City',
      state: 'CC',
      zipCode: '11111',
      country: 'Sri Lanka'
    }
  }
};

const getDemoUserConfig = (email = '', password = '') => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const demoUser = DEMO_USERS[normalizedEmail];

  if (!demoUser || String(password) !== demoUser.password) {
    return null;
  }

  return demoUser;
};

const ensureDemoUser = async (demoUserConfig) => {
  let user = await User.findOne({ email: demoUserConfig.email }).select('+password');

  if (!user) {
    user = await User.create({
      ...demoUserConfig,
      isActive: true
    });

    return User.findById(user._id).select('+password');
  }

  user.name = demoUserConfig.name;
  user.phone = demoUserConfig.phone;
  user.role = demoUserConfig.role;
  user.address = demoUserConfig.address;
  user.isActive = true;
  user.password = demoUserConfig.password;
  await user.save();

  return user;
};

const respondIfDatabaseUnavailable = async (res) => {
  if (await waitForDatabaseReady()) {
    return false;
  }

  res.status(503).json({
    success: false,
    message: 'Database is unavailable. Please start MongoDB or update backend/.env with a reachable MONGODB_URI.'
  });

  return true;
};

const findLinkedSupplierProfile = async (user) => {
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();
  const normalizedName = String(user?.name || '').trim();

  return Supplier.findOne({
    $or: [
      normalizedEmail ? { 'contact.email': normalizedEmail } : null,
      normalizedName ? { name: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : null,
      normalizedName ? { companyName: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : null
    ].filter(Boolean)
  });
};

const createLinkedSupplierProfile = async (user, companyName = '') => {
  const supplierProfile = await Supplier.findOneAndUpdate(
    { 'contact.email': user.email },
    {
      companyName: companyName?.trim() || user.name,
      name: user.name,
      contact: {
        email: user.email,
        phone: user.phone || ''
      },
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || 'Sri Lanka'
      },
      paymentStatus: 'pending',
      supplyStatus: 'active',
      products: [],
      deliveryPricePerItem: null,
      suppliedItems: [],
      returnPolicy: {
        acceptsDamagedReturns: false,
        acceptsExpiredExchanges: false
      },
      deliveryCommitment: {
        deliversOnTime: false
      },
      preferredSupplier: false,
      performance: {
        onTimeDeliveryRate: 0,
        orderAccuracyRate: 0,
        qualityIssueCount: 0,
        returnCount: 0
      },
      invoices: [],
      notes: 'Supplier account created during registration.'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  return supplierProfile;
};

// ===========================================
// REGISTER - Create new user account
// POST /api/auth/register
// ===========================================
exports.register = async (req, res) => {
  try {
    if (await respondIfDatabaseUnavailable(res)) return;

    // Destructure user data from request body
    const { name, email, password, phone, role, companyName, address, addressBook } = req.body;
    const requestedRole = String(role || 'customer').trim().toLowerCase();
    const allowedPublicRoles = ['customer', 'supplier'];

    // Check if user already exists with this email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Prepare user data object
    const userData = {
      name,
      email,
      password,
      phone,
      address,
      addressBook: normalizeAddressBook(addressBook, address)
    };

    if (!allowedPublicRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type'
      });
    }

    userData.role = requestedRole;

    // Create user in database
    // Password is automatically hashed by User model pre-save hook
    const user = await User.create(userData);

    if (user.role === 'supplier') {
      try {
        await createLinkedSupplierProfile(user, companyName);
      } catch (supplierError) {
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({
          success: false,
          message: supplierError.message
        });
      }
    }

    // Generate JWT token for the new user
    const token = generateToken(user._id);

    // Return success response with token and user data
    res.status(201).json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// LOGIN - Authenticate existing user
// POST /api/auth/login
// ===========================================
exports.login = async (req, res) => {
  try {
    if (await respondIfDatabaseUnavailable(res)) return;

    const { email, password, preferredRole } = req.body;

    // Validation: Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    if (isDemoSupplierCredentials(email, password)) {
      let user = await User.findOne({ email: 'supplier@example.com' }).select('+password');

      if (!user) {
        user = await User.create({
          name: 'Supplier User',
          email: 'supplier@example.com',
          password: 'supplier123',
          phone: '0771234567',
          role: 'supplier',
          isActive: true,
          address: {
            street: '12 Supplier Lane',
            city: 'Colombo',
            state: 'Western',
            zipCode: '10100',
            country: 'Sri Lanka'
          }
        });
      } else {
        user.name = user.name || 'Supplier User';
        user.role = 'supplier';
        user.isActive = true;
        user.password = 'supplier123';
        await user.save();
      }

      await ensureDemoSupplierData(user);

      return res.json({
        success: true,
        token: generateToken(user._id),
        user: serializeUser(user)
      });
    }

    if (isDemoSupportCredentials(email, password)) {
      const user = await ensureDemoSupportData();

      user.password = DEMO_SUPPORT_PASSWORD;
      await user.save();

      return res.json({
        success: true,
        token: generateToken(user._id),
        user: serializeUser(user)
      });
    }

    const demoUserConfig = getDemoUserConfig(email, password);
    if (demoUserConfig) {
      const user = await ensureDemoUser(demoUserConfig);

      return res.json({
        success: true,
        token: generateToken(user._id),
        user: serializeUser(user)
      });
    }

    // Find user by email and include password field (normally excluded)
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active (not deactivated by admin)
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare provided password with stored hash
    // comparePassword method is defined in User model
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const requestedRole = String(preferredRole || '').trim().toLowerCase();

    if (requestedRole === 'supplier' && user.role !== 'supplier') {
      const linkedSupplier = await findLinkedSupplierProfile(user);

      if (!linkedSupplier) {
        return res.status(403).json({
          success: false,
          message: 'This account is not linked to a supplier profile'
        });
      }

      user.role = 'supplier';
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success response
    res.json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// GET ME - Get current logged-in user data
// GET /api/auth/me
// Protected route - requires valid JWT token
// ===========================================
exports.getMe = async (req, res) => {
  try {
    if (await respondIfDatabaseUnavailable(res)) return;

    // req.user.id comes from auth middleware (verify JWT)
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// UPDATE PROFILE - Update user details
// PUT /api/auth/profile
// Protected route
// ===========================================
exports.updateProfile = async (req, res) => {
  try {
    if (await respondIfDatabaseUnavailable(res)) return;

    const { name, phone, address, addressBook } = req.body;
    const normalizedAddressBook = normalizeAddressBook(addressBook, address);
    const defaultAddress = normalizedAddressBook.find((entry) => entry.isDefault) || normalizedAddressBook[0];

    // Find user by ID and update fields
    // new: true returns updated document
    // runValidators: true runs schema validations
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        address: defaultAddress
          ? {
              street: defaultAddress.street,
              city: defaultAddress.city,
              state: defaultAddress.state,
              zipCode: defaultAddress.zipCode,
              country: defaultAddress.country
            }
          : address,
        addressBook: normalizedAddressBook
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// CHANGE PASSWORD - Update user password
// PUT /api/auth/change-password
// Protected route
// ===========================================
exports.changePassword = async (req, res) => {
  try {
    if (await respondIfDatabaseUnavailable(res)) return;

    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// GET ALL USERS - Admin only
// GET /api/auth/users
// Protected + Admin only
// ===========================================
exports.getAllUsers = async (req, res) => {
  try {
    // Find all users but exclude password field
    const users = await User.find().select('-password');

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// TOGGLE USER STATUS - Activate/Deactivate user
// PUT /api/auth/users/:id/toggle-status
// Protected + Admin only
// ===========================================
exports.toggleUserStatus = async (req, res) => {
  try {
    // Find user by ID from URL parameter
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle isActive boolean
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// GET USER BY ID - Support Officer only
// GET /api/auth/users/:id
// Protected + Support Officer only
// ===========================================
exports.getUserById = async (req, res) => {
  try {
    if (await respondIfDatabaseUnavailable(res)) return;

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get order count for the user (you may need to import Order model)
    let totalOrders = 0;
    try {
      const Order = require('../models/Order');
      totalOrders = await Order.countDocuments({ customerId: user._id });
    } catch (orderError) {
      // If Order model doesn't exist, continue with 0 orders
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        totalOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===========================================
// UPDATE USER PROFILE - Support Officer only
// PATCH /api/auth/users/:id
// Protected + Support Officer only
// Only allows updating basic profile fields
// ===========================================
exports.updateUserBySupportOfficer = async (req, res) => {
  try {
    if (await respondIfDatabaseUnavailable(res)) return;

    const { firstName, lastName, email, phone, address } = req.body;
    
    // Only allow updating specific fields
    const allowedFields = {};
    if (firstName !== undefined) allowedFields.name = firstName;
    if (lastName !== undefined) allowedFields.name = allowedFields.name ? `${allowedFields.name} ${lastName}` : lastName;
    if (email !== undefined) allowedFields.email = email;
    if (phone !== undefined) allowedFields.phone = phone;
    if (address !== undefined) allowedFields.address = address;

    // Don't allow updating role, password, or sensitive fields
    const user = await User.findByIdAndUpdate(
      req.params.id,
      allowedFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export all controller functions
