import User from '../models/user.model.js';
import { generateToken, verifyToken } from '../config/jwt.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const register = asyncHandler(async (req, res) => {
  const { name, email, password, designation, role } = req.body;
  if (!name || !email || !password) {
    return errorResponse(res, 400, 'Please provide name, email, and password');
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 400, 'User with this email already exists');
  }
  const user = await User.create({
    name,
    email,
    password,
    designation: designation || '',
    role: role || 'Viewer',
  });
  const token = generateToken({ userId: user._id.toString(), email: user.email });
  return successResponse(res, 201, 'Registration successful', {
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
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return errorResponse(res, 400, 'Please provide email and password');
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) return errorResponse(res, 401, 'Invalid email or password');
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) return errorResponse(res, 401, 'Invalid email or password');
  const token = generateToken({ userId: user._id.toString(), email: user.email });
  return successResponse(res, 200, 'Login successful', {
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
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  return successResponse(res, 200, 'User retrieved successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      designation: user.designation,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

const checkToken = asyncHandler(async (req, res) => {
  const token = req.body.token;
  if (!token) return errorResponse(res, 400, 'Token is required');
  try {
    const decoded = verifyToken(token);
    return successResponse(res, 200, 'Token is valid', { token: decoded });
  } catch (error) {
    return errorResponse(res, 401, 'Invalid token');
  }
});

export { register, login, getMe, checkToken };
