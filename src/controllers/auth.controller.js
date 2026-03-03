import User from '../models/user.model.js';
import { generateToken, verifyToken } from '../config/jwt.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { auditLogFromRequest } from '../services/logger.service.js';

const register = asyncHandler(async (req, res) => {
  const { name, email, password, designation, phoneNumber, role } = req.body;
  if (!name || !email || !password) {
    return errorResponse(res, 400, 'Please provide name, email, and password');
  }
  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    return errorResponse(res, 400, 'User with this email already exists');
  }
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    designation: designation || '',
    phoneNumber: phoneNumber || '',
    role: role || 'Viewer',
    imageUrl,
  });
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    company: user.company ? user.company.toString() : null,
  });
  auditLogFromRequest(req, {
    actionType: 'USER_CREATED',
    entityType: 'USER',
    entityId: user._id.toString(),
    entityName: user.name,
    title: 'User Created',
    description: `User ${user.name} (${user.email}) registered.`,
  });
  return successResponse(res, 201, 'Registration successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      designation: user.designation,
      phoneNumber: user.phoneNumber,
      imageUrl: user.imageUrl,
      image: user.image,
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
  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    company: user.company ? user.company.toString() : null,
  });
  return successResponse(res, 200, 'Login successful', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      designation: user.designation,
      phoneNumber: user.phoneNumber,
      imageUrl: user.imageUrl,
      image: user.image,
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
      company: user.company,
      designation: user.designation,
      phoneNumber: user.phoneNumber,
      imageUrl: user.imageUrl,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * PATCH /api/auth/me - Update current user's profile (name, email, phoneNumber, designation).
 * All fields optional; only provided fields are updated.
 */
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return errorResponse(res, 404, 'User not found');
  const { name, email, phoneNumber, designation, imageUrl: imageUrlBody } = req.body;
  if (name !== undefined) user.name = String(name).trim();
  if (designation !== undefined) user.designation = String(designation).trim();
  if (phoneNumber !== undefined) user.phoneNumber = String(phoneNumber).trim();
  if (req.file) user.imageUrl = `/uploads/${req.file.filename}`;
  else if (imageUrlBody !== undefined) user.imageUrl = String(imageUrlBody).trim();
  if (email !== undefined) {
    const newEmail = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
      return errorResponse(res, 400, 'Please provide a valid email');
    }
    if (newEmail !== user.email) {
      const existing = await User.findOne({ email: newEmail });
      if (existing) return errorResponse(res, 400, 'User with this email already exists');
      user.email = newEmail;
    }
  }
  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  return successResponse(res, 200, 'Profile updated successfully', { user: userObj });
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

export { register, login, getMe, updateMe, checkToken };
