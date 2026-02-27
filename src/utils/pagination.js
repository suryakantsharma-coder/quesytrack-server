const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  return { page, limit, skip, sortBy, sortOrder };
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

const paginateQuery = async (Model, filter, paginationParams, populateOptions = []) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationParams;
  let query = Model.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
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

export {
  parsePaginationParams,
  buildPaginationMeta,
  paginateQuery,
  parseSearchParams,
};
