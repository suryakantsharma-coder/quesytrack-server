import { verifyToken } from '../config/jwt.js';
import User from '../models/user.model.js';
import { errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'No token provided, authorization denied');
  }
  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return errorResponse(res, 401, 'User not found');
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return errorResponse(res, 401, 'Invalid token');
    if (error.name === 'TokenExpiredError') return errorResponse(res, 401, 'Token expired');
    return errorResponse(res, 401, 'Token verification failed');
  }
});

const adminOnly = (req, res, next) => {
  if (!req.user) return errorResponse(res, 401, 'Authentication required');
  if (req.user.role !== 'admin' && req.user.role !== 'Admin') {
    return errorResponse(res, 403, 'Admin access required');
  }
  next();
};

const protect = authenticate;

export { authenticate, protect, adminOnly };
