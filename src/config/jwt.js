const jwt = require('jsonwebtoken');

/**
 * JWT Configuration and Helpers
 * Generates and verifies JWT tokens for authentication
 */

/**
 * Generate JWT token
 * @param {Object} payload - User data to encode in token (userId, email)
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
