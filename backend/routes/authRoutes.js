const express = require('express');
const router = express.Router();
const { protect, authorize, isSupportOfficer } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  toggleUserStatus,
  getUserById,
  updateUserBySupportOfficer
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Admin only routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);

// Support officer only routes
router.get('/users/:id', protect, isSupportOfficer, getUserById);
router.patch('/users/:id', protect, isSupportOfficer, updateUserBySupportOfficer);

module.exports = router;
