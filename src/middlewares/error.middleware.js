const { errorResponse } = require('../utils/apiResponse');

/**
 * Centralized Error Handler Middleware
 * Catches all errors and returns standardized error response
 * Matches frontend expected format: { success: false, error: string }
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 400, messages.join(', '));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return errorResponse(res, 400, `${field} already exists`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 400, 'Invalid ID format');
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(res, statusCode, message);
};

module.exports = errorHandler;
