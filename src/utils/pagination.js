/**
 * @param {Object} query - req.query
 * @param {number} [maxLimit=100] - max allowed limit (e.g. 2000 for admin)
 */
const parsePaginationParams = (query, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  return { page, limit, skip, sortBy, sortOrder };
};

const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    pages: totalPages,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * @param {Object} [options] - { lean: boolean } to return plain objects
 */
const paginateQuery = async (Model, filter, paginationParams, populateOptions = [], options = {}) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationParams;
  let query = Model.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
  if (options.lean) query = query.lean();
  populateOptions.forEach((populateConfig) => {
    query = query.populate(populateConfig);
  });
  const [data, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);
  return { data, pagination: buildPaginationMeta(total, page, limit) };
};

const parseSearchParams = (query, searchableFields = []) => {
  const filter = {};
  const { search, ...otherParams } = query;
  if (search && searchableFields.length > 0) {
    filter.$or = searchableFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));
  }
  const paginationParams = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];
  Object.keys(otherParams).forEach((key) => {
    if (!paginationParams.includes(key) && otherParams[key]) {
      filter[key] = otherParams[key];
    }
  });
  return filter;
};

/** Reserved query keys for search endpoints (pagination + date range). */
const SEARCH_RESERVED_KEYS = [
  'page',
  'limit',
  'sortBy',
  'sortOrder',
  'search',
  'dateFrom',
  'dateTo',
];

/**
 * Build filter for search: text search, status/type filters, and optional date range.
 * @param {Object} query - req.query
 * @param {string[]} searchableFields - fields for partial case-insensitive text search
 * @param {Object} options - { dateField: string (e.g. 'createdAt'), statusField: string }
 * @returns {Object} MongoDB filter
 */
const buildSearchFilter = (query, searchableFields = [], options = {}) => {
  const filter = {};
  const { search, dateFrom, dateTo, ...rest } = query;

  if (search && typeof search === 'string' && search.trim() && searchableFields.length > 0) {
    filter.$or = searchableFields.map((field) => ({
      [field]: { $regex: search.trim(), $options: 'i' },
    }));
  }

  const dateField = options.dateField || 'createdAt';
  if (dateFrom || dateTo) {
    filter[dateField] = {};
    if (dateFrom) filter[dateField].$gte = new Date(dateFrom);
    if (dateTo) filter[dateField].$lte = new Date(dateTo);
  }

  Object.keys(rest).forEach((key) => {
    if (!SEARCH_RESERVED_KEYS.includes(key) && rest[key] !== undefined && rest[key] !== '') {
      filter[key] = rest[key];
    }
  });
  return filter;
};

export {
  parsePaginationParams,
  buildPaginationMeta,
  paginateQuery,
  parseSearchParams,
  buildSearchFilter,
  SEARCH_RESERVED_KEYS,
};
