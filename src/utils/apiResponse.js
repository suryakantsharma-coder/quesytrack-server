/**
 * Standardized API Response Utility
 * Response format: { success: boolean, message?: string, data?: T, error?: string }
 * 
 * Success responses include: { success: true, message: string, data?: T }
 * Error responses include: { success: false, error: string }
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {*} data - Response data
 */
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };

  // Only include data if it's explicitly provided (not null or undefined)
  if (data != null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} error - Error message
 */
const errorResponse = (res, statusCode, error) => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
