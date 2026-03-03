import User from '../models/user.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * PUT /api/users/update
 * Update authenticated user profile (name, email, phone, image).
 * Accepts multipart/form-data. Only provided fields are updated.
 * If image uploaded: save file and set user.image to /uploads/users/filename.
 * If no image: keep existing image.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return errorResponse(res, 404, 'User not found');

  const { name, email, phone, phoneNumber } = req.body;
  const phoneValue = phone !== undefined ? phone : phoneNumber;

  if (name !== undefined && name !== null) user.name = String(name).trim();
  if (phoneValue !== undefined) user.phoneNumber = String(phoneValue).trim();

  if (req.file) {
    user.image = `/uploads/users/${req.file.filename}`;
  }

  if (email !== undefined && email !== null) {
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

export { updateProfile };
