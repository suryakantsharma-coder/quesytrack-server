import Log from '../models/log.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parsePaginationParams, paginateQuery, buildSearchFilter } from '../utils/pagination.js';
import { requireCompany, addCompanyFilter, ensureCompanyAccess } from '../utils/companyIsolation.js';

const getLogs = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildLogsFilter(req.query);
  addCompanyFilter(filter, req);
  const { data, pagination } = await paginateQuery(
    Log,
    filter,
    { ...paginationParams, sortBy: paginationParams.sortBy || 'createdAt', sortOrder: -1 },
    []
  );
  const logs = data.map((doc) => {
    const o = doc.toObject();
    o.date = doc.createdAt;
    o.time = doc.createdAt;
    return o;
  });
  return successResponse(res, 200, 'Logs retrieved successfully', { data: logs, pagination });
});

const searchLogs = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildLogsFilter(req.query);
  addCompanyFilter(filter, req);
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const { data, pagination } = await paginateQuery(
    Log,
    filter,
    { ...paginationParams, sortBy, sortOrder },
    []
  );
  const logs = data.map((doc) => {
    const o = doc.toObject();
    o.date = doc.createdAt;
    o.time = doc.createdAt;
    return o;
  });
  return successResponse(res, 200, 'Search successful', { data: logs, pagination });
});

const getLogById = asyncHandler(async (req, res) => {
  const log = await Log.findById(req.params.id);
  if (!log) return errorResponse(res, 404, 'Log not found');
  if (!ensureCompanyAccess(req, res, log)) return;
  const o = log.toObject();
  o.date = log.createdAt;
  o.time = log.createdAt;
  return successResponse(res, 200, 'Log retrieved successfully', { data: o });
});

function buildLogsFilter(query) {
  const filter = {};
  if (query.entityType) filter.entityType = query.entityType;
  if (query.actionType) filter.actionType = query.actionType;
  if (query.performedByUserId) filter.performedByUserId = query.performedByUserId;
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }
  if (query.search && query.search.trim()) {
    filter.$or = [
      { title: { $regex: query.search.trim(), $options: 'i' } },
      { description: { $regex: query.search.trim(), $options: 'i' } },
      { entityName: { $regex: query.search.trim(), $options: 'i' } },
    ];
  }
  return filter;
}

export default {
  getLogs,
  searchLogs,
  getLogById,
};
