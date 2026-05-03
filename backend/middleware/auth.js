const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { waitForDatabaseReady } = require('../config/db');

exports.protect = async (req, res, next) => {
  try {
    if (!(await waitForDatabaseReady())) {
      return res.status(503).json({
        success: false,
        message: 'Database is unavailable. Please start MongoDB or update backend/.env with a reachable MONGODB_URI.'
      });
    }

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

exports.authorize = authorizeRoles;
exports.authorizeRoles = authorizeRoles;

exports.isSupportOfficer = (req, res, next) => {
  if (req.user.role !== 'support_officer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Support officer role required.'
    });
  }
  next();
};
