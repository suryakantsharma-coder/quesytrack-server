const { verifyToken } = require('../config/jwt');
const User = require('../models/user.model');
const { errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to request
 * 
 * Frontend should send token in header: Authorization: Bearer <token>
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'No token provided, authorization denied');
  }

  // Extract token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Get user from database (exclude password)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired');
    }
    return errorResponse(res, 401, 'Token verification failed');
  }
});

/**
 * Admin Only Middleware
 * Checks if the authenticated user has admin role
 * Must be used after authenticate/protect middleware
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication required');
  }

  if (req.user.role !== 'admin' && req.user.role !== 'Admin') {
    return errorResponse(res, 403, 'Admin access required');
  }

  next();
};

// Alias for authenticate (commonly used name)
const protect = authenticate;

module.exports = { authenticate, protect, adminOnly };
