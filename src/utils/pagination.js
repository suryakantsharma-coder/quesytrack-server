/**
 * Pagination Utility
 * Provides helper functions for API pagination
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} - Parsed pagination parameters
 */
const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

/**
 * Build pagination response metadata
 * @param {number} total - Total number of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Execute paginated query
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} paginationParams - Pagination parameters
 * @param {Array} populateOptions - Array of populate configurations
 * @returns {Promise<Object>} - Paginated results with metadata
 */
const paginateQuery = async (Model, filter, paginationParams, populateOptions = []) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationParams;

  // Build the query
  let query = Model.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  // Apply populate options
  populateOptions.forEach((populateConfig) => {
    query = query.populate(populateConfig);
  });

  // Execute query and count in parallel
  const [data, total] = await Promise.all([
    query.exec(),
    Model.countDocuments(filter),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);

  return {
    data,
    pagination,
  };
};

/**
 * Parse search/filter parameters from request query
 * @param {Object} query - Request query object
 * @param {Array} searchableFields - Fields that can be searched
 * @returns {Object} - MongoDB filter object
 */
const parseSearchParams = (query, searchableFields = []) => {
  const filter = {};
  const { search, ...otherParams } = query;

  // Handle text search across multiple fields
  if (search && searchableFields.length > 0) {
    filter.$or = searchableFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));
  }

  // Handle specific field filters (excluding pagination params)
  const paginationParams = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];
  
  Object.keys(otherParams).forEach((key) => {
    if (!paginationParams.includes(key) && otherParams[key]) {
      filter[key] = otherParams[key];
    }
  });

  return filter;
};

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
  paginateQuery,
  parseSearchParams,
};
