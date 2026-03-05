import mongoose from 'mongoose';
import Gauge from '../models/gauge.model.js';
import Calibration from '../models/calibration.model.js';
import Project from '../models/project.model.js';
import Report from '../models/report.model.js';
import Log from '../models/log.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getDateRange, validateFilter, monthLabel } from '../utils/dateFilter.js';
import { isSuperAdmin } from '../utils/companyIsolation.js';

/**
 * Resolves company filter for graph APIs.
 * Super admin: optional companyId (omit or "all" = all companies; specific id = that company).
 * Other roles: companyId required and must match user's company.
 * Returns { companyFilter } or sends error and returns null.
 */
function getCompanyFilterForGraph(req, res) {
  const isSuperAdminUser = isSuperAdmin(req);
  const companyId = req.query.companyId;

  if (isSuperAdminUser) {
    if (companyId !== undefined && companyId !== '' && String(companyId).toLowerCase() !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        errorResponse(res, 400, 'Invalid company ID');
        return null;
      }
      return { company: new mongoose.Types.ObjectId(companyId) };
    }
    return {};
  }

  if (!companyId || String(companyId).trim() === '') {
    errorResponse(res, 400, 'Company ID is required');
    return null;
  }
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    errorResponse(res, 400, 'Invalid company ID');
    return null;
  }
  if (String(req.user.company) !== String(companyId)) {
    errorResponse(res, 403, 'Access denied to this company');
    return null;
  }
  return { company: new mongoose.Types.ObjectId(companyId) };
}

/**
 * GET /api/dashboard/gauges?filter=30days
 * Super admin: all companies (or ?companyId=id for one). Other roles: companyId required.
 */
export const gaugesGraph = asyncHandler(async (req, res) => {
  const companyFilter = getCompanyFilterForGraph(req, res);
  if (companyFilter === null) return;
  const filter = validateFilter(req.query.filter);
  const { startDate, endDate } = getDateRange(filter);
  const dateMatch = { createdAt: { $gte: startDate, $lte: endDate }, ...companyFilter };

  const [summaryResult, trendResult] = await Promise.all([
    Promise.all([
      Gauge.countDocuments(dateMatch),
      Gauge.countDocuments({ ...dateMatch, status: { $in: ['active', 'Active'] } }),
      Gauge.countDocuments({ ...dateMatch, status: { $in: ['inactive', 'Inactive'] } }),
      Gauge.countDocuments({ ...dateMatch, status: { $in: ['maintenance', 'Maintenance'] } }),
    ]),
    Gauge.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          active: { $sum: { $cond: [{ $in: ['$status', ['active', 'Active']] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $in: ['$status', ['inactive', 'Inactive']] }, 1, 0] } },
          missing: { $sum: { $cond: [{ $in: ['$status', ['maintenance', 'Maintenance']] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const [total, active, inactive, missing] = summaryResult;
  const trend = (trendResult || []).map((t) => ({
    label: monthLabel(t._id),
    active: t.active || 0,
    inactive: t.inactive || 0,
    missing: t.missing || 0,
  }));

  return successResponse(res, 200, 'Gauges graph retrieved successfully', {
    filter,
    dateRange: { startDate, endDate },
    summary: { total, active, inactive, missing },
    trend: trend || [],
  });
});

/**
 * GET /api/dashboard/calibrations?filter=30days
 * overdue = calibrationDueDate < today AND status not completed
 * dueSoon = calibrationDueDate within next 7 days
 * Super admin: all companies (or ?companyId=id). Other roles: companyId required.
 */
export const calibrationsGraph = asyncHandler(async (req, res) => {
  const companyFilter = getCompanyFilterForGraph(req, res);
  if (companyFilter === null) return;
  const filter = validateFilter(req.query.filter);
  const { startDate, endDate } = getDateRange(filter);
  const dateMatch = { createdAt: { $gte: startDate, $lte: endDate }, ...companyFilter };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const [total, completedCount, overdueCount, dueSoonCount, trendResult] = await Promise.all([
    Calibration.countDocuments(dateMatch),
    Calibration.countDocuments({ ...dateMatch, status: { $in: ['completed', 'Completed'] } }),
    Calibration.countDocuments({
      ...dateMatch,
      calibrationDueDate: { $lt: today },
      status: { $nin: ['completed', 'Completed'] },
    }),
    Calibration.countDocuments({
      ...dateMatch,
      calibrationDueDate: { $gte: today, $lte: in7Days },
    }),
    Calibration.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          completed: { $sum: { $cond: [{ $in: ['$status', ['completed', 'Completed']] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$calibrationDueDate', today] },
                    { $not: { $in: ['$status', ['completed', 'Completed']] } },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const trend = (trendResult || []).map((t) => ({
    label: monthLabel(t._id),
    completed: t.completed || 0,
    overdue: t.overdue || 0,
  }));

  return successResponse(res, 200, 'Calibrations graph retrieved successfully', {
    filter,
    dateRange: { startDate, endDate },
    summary: {
      total,
      completed: completedCount,
      overdue: overdueCount,
      dueSoon: dueSoonCount,
    },
    trend: trend || [],
  });
});

/**
 * GET /api/dashboard/projects?filter=30days
 * Super admin: all companies (or ?companyId=id). Other roles: companyId required.
 */
export const projectsGraph = asyncHandler(async (req, res) => {
  const companyFilter = getCompanyFilterForGraph(req, res);
  if (companyFilter === null) return;
  const filter = validateFilter(req.query.filter);
  const { startDate, endDate } = getDateRange(filter);
  const dateMatch = { createdAt: { $gte: startDate, $lte: endDate }, ...companyFilter };

  const [total, activeCount, completedCount, trendResult] = await Promise.all([
    Project.countDocuments(dateMatch),
    Project.countDocuments({ ...dateMatch, status: { $in: ['active', 'Active'] } }),
    Project.countDocuments({ ...dateMatch, status: { $in: ['completed', 'Completed'] } }),
    Project.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          active: { $sum: { $cond: [{ $in: ['$status', ['active', 'Active']] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $in: ['$status', ['completed', 'Completed']] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const trend = (trendResult || []).map((t) => ({
    label: monthLabel(t._id),
    active: t.active || 0,
    completed: t.completed || 0,
  }));

  return successResponse(res, 200, 'Projects graph retrieved successfully', {
    filter,
    dateRange: { startDate, endDate },
    summary: { total, active: activeCount, completed: completedCount },
    trend: trend || [],
  });
});

/**
 * GET /api/dashboard/system?filter=30days
 * Reports + Logs combined graph.
 * Super admin: all companies (or ?companyId=id). Other roles: companyId required.
 */
export const systemGraph = asyncHandler(async (req, res) => {
  const companyFilter = getCompanyFilterForGraph(req, res);
  if (companyFilter === null) return;
  const filter = validateFilter(req.query.filter);
  const { startDate, endDate } = getDateRange(filter);
  const dateMatch = { createdAt: { $gte: startDate, $lte: endDate }, ...companyFilter };

  const [reportsTotal, logsTotal, reportsTrend, logsTrend] = await Promise.all([
    Report.countDocuments(dateMatch),
    Log.countDocuments(dateMatch),
    Report.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Log.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const monthMap = new Map();
  (reportsTrend || []).forEach((t) => {
    const key = `${t._id.year}-${String(t._id.month).padStart(2, '0')}`;
    if (!monthMap.has(key)) monthMap.set(key, { _id: t._id, reports: 0, logs: 0 });
    monthMap.get(key).reports = t.count || 0;
  });
  (logsTrend || []).forEach((t) => {
    const key = `${t._id.year}-${String(t._id.month).padStart(2, '0')}`;
    if (!monthMap.has(key)) monthMap.set(key, { _id: t._id, reports: 0, logs: 0 });
    monthMap.get(key).logs = t.count || 0;
  });
  const sortedKeys = Array.from(monthMap.keys()).sort();
  const trend = sortedKeys.map((k) => {
    const row = monthMap.get(k);
    return { label: monthLabel(row._id), reports: row.reports, logs: row.logs };
  });

  return successResponse(res, 200, 'System graph retrieved successfully', {
    filter,
    dateRange: { startDate, endDate },
    reports: { total: reportsTotal },
    logs: { total: logsTotal },
    trend: trend || [],
  });
});
