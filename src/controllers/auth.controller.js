const User = require('../models/user.model');
const { generateToken, verifyToken } = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Auth Controller
 * Handles authentication endpoints: register, login, getMe
 * 
 * Response format matches frontend expectations:
 * { success: boolean, message?: string, data?: { user, token }, error?: string }
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * 
 * Expected request body:
 * {
 *   name: string,
 *   email: string,
 *   password: string,
 *   designation?: string,
 *   role?: 'Admin' | 'Viewer' | 'Editor'
 * }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, designation, role } = req.body;

  // Validation
  if (!name || !email || !password) {
    return errorResponse(res, 400, 'Please provide name, email, and password');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 400, 'User with this email already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    designation: designation || '',
    role: role || 'Viewer',
  });

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  // Return response matching frontend format
  return successResponse(
    res,
    201,
    'Registration successful',
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    }
  );
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * 
 * Expected request body:
 * {
 *   email: string,
 *   password: string
 * }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return errorResponse(res, 400, 'Please provide email and password');
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return errorResponse(res, 401, 'Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return errorResponse(res, 401, 'Invalid email or password');
  }

  // Generate token
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  // Return response matching frontend format
  return successResponse(
    res,
    200,
    'Login successful',
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    }
  );
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private (requires authentication middleware)
 * 
 * User is attached to req.user by authenticate middleware
 */
const getMe = asyncHandler(async (req, res) => {
  // User is already attached to req.user by authenticate middleware
  const user = req.user;

  return successResponse(
    res,
    200,
    'User retrieved successfully',
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  );
});


// check if token is valid
const checkToken = asyncHandler(async (req, res) => {
  // get token from body  
  const token = req.body.token;
  if (!token) {
    return errorResponse(res, 400, 'Token is required');
  }
  try {
    console.log({token});
    const decoded = verifyToken(token);
    console.log({decoded});
    return successResponse(res, 200, 'Token is valid', { token: decoded });
  } catch (error) {
    return errorResponse(res, 401, 'Invalid token');
  }
});


module.exports = {
  register,
  login,
  getMe,
  checkToken,
};
