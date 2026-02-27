import { errorResponse } from '../utils/apiResponse.js';

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 400, messages.join(', '));
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return errorResponse(res, 400, `${field} already exists`);
  }
  if (err.name === 'CastError') {
    return errorResponse(res, 400, 'Invalid ID format');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return errorResponse(res, 400, `Unexpected file field: ${err.field}`);
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 400, 'File too large');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return errorResponse(res, 400, 'Too many files');
  }
  if (err.code === 'LIMIT_PART_COUNT') {
    return errorResponse(res, 400, 'Too many parts');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return errorResponse(res, statusCode, message);
};

export default errorHandler;
