import mongoose from 'mongoose';
import Project from '../models/project.model.js';
import Report from '../models/report.model.js';
import Gauge from '../models/gauge.model.js';
import Calibration from '../models/calibration.model.js';
import Log from '../models/log.model.js';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { resetSequence, getSequenceInfo } from '../utils/idGenerator.js';
import { parsePaginationParams, paginateQuery, buildSearchFilter } from '../utils/pagination.js';
import { isSuperAdmin } from '../utils/companyIsolation.js';

const modelMap = {
  project: { model: Project, idField: 'projectId', prefix: 'P' },
  report: { model: Report, idField: 'reportId', prefix: 'R' },
  gauge: { model: Gauge, idField: 'gaugeId', prefix: 'G' },
  calibration: { model: Calibration, idField: 'calibrationId', prefix: 'C' },
};

const resetModelSequence = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { startFrom = 1 } = req.body;
  const modelInfo = modelMap[type?.toLowerCase()];
  if (!modelInfo) {
    return errorResponse(res, 400, 'Invalid model type. Use: project, report, gauge, or calibration');
  }
  const { model, idField, prefix } = modelInfo;
  const result = await resetSequence(model, idField, prefix, startFrom);
  return successResponse(res, 200, `Sequence reset successfully for ${type}`, result);
});

const getModelSequenceInfo = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const modelInfo = modelMap[type?.toLowerCase()];
  if (!modelInfo) {
    return errorResponse(res, 400, 'Invalid model type. Use: project, report, gauge, or calibration');
  }
  const { model, idField, prefix } = modelInfo;
  const info = await getSequenceInfo(model, idField, prefix);
  return successResponse(res, 200, `Sequence info for ${type}`, info);
});

const getAllSequenceInfo = asyncHandler(async (req, res) => {
  const allInfo = {};
  for (const [type, { model, idField, prefix }] of Object.entries(modelMap)) {
    allInfo[type] = await getSequenceInfo(model, idField, prefix);
  }
  return successResponse(res, 200, 'Sequence info for all models', allInfo);
});

const resetAllSequences = asyncHandler(async (req, res) => {
  const { startFrom = 1 } = req.body;
  const results = {};
  for (const [type, { model, idField, prefix }] of Object.entries(modelMap)) {
    results[type] = await resetSequence(model, idField, prefix, startFrom);
  }
  return successResponse(res, 200, 'All sequences reset successfully', results);
});

const getUsers = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildSearchFilter(req.query, ['name', 'email', 'designation', 'role']);
  const { data, pagination } = await paginateQuery(User, filter, paginationParams, []);
  const users = data.map((u) => u.toObject());
  users.forEach((u) => delete u.password);
  return successResponse(res, 200, 'Users retrieved successfully', { users, pagination });
});

const searchUsers = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildSearchFilter(req.query, ['name', 'email', 'designation', 'role']);
  const { data, pagination } = await paginateQuery(User, filter, paginationParams, []);
  const users = data.map((u) => u.toObject());
  users.forEach((u) => delete u.password);
  return successResponse(res, 200, 'Search successful', { data: users, pagination });
});

/** Admin list endpoints use page & limit (max 2000 per page). */
const ADMIN_MAX_LIMIT = 2000;

/**
 * GET /api/admin/users/unassigned
 * Super admin only. Returns users not assigned to any company. Supports pagination: page, limit, sortBy, sortOrder.
 */
const getUnassignedUsersForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  const filter = { $or: [{ company: null }, { company: { $exists: false } }] };
  const { data, pagination } = await paginateQuery(User, filter, paginationParams, [], { lean: true });
  const users = (data || []).map((u) => {
    const o = { ...u };
    delete o.password;
    return o;
  });
  return successResponse(res, 200, 'Unassigned users retrieved successfully', { users, pagination });
});

const updateUserCompany = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const { company: companyId, name, email, phoneNumber, designation } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return errorResponse(res, 400, 'Invalid user ID');
  }

  const user = await User.findById(userId);
  if (!user) return errorResponse(res, 404, 'User not found');

  if (companyId !== undefined && companyId !== null) {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return errorResponse(res, 400, 'Invalid company ID');
    }
    const testCompanyId = '000000000000000000000001';
    const isTestCompany = String(companyId) === testCompanyId;
    if (isTestCompany) {
      user.company = new mongoose.Types.ObjectId(companyId);
    } else {
      const company = await Company.findById(companyId);
      if (!company) return errorResponse(res, 404, 'Company not found');
      user.company = company._id;
    }
  } else if (companyId === null) {
    user.company = undefined;
  }

  if (name !== undefined) user.name = String(name).trim();
  if (designation !== undefined) user.designation = String(designation).trim();
  if (phoneNumber !== undefined) user.phoneNumber = String(phoneNumber).trim();
  if (email !== undefined) {
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
  return successResponse(res, 200, 'User updated successfully', { user: userObj });
});

const ensureSuperAdminOr403 = (req, res) => {
  if (!isSuperAdmin(req)) {
    errorResponse(res, 403, 'You are not admin');
    return false;
  }
  return true;
};

/** Allow admin or super admin. Returns company filter for stats: {} for all, or { company: id }. Returns null if forbidden. */
function ensureAdminOrSuperAdminAndCompanyFilter(req, res) {
  const role = String((req.user?.role || '')).toLowerCase();
  const isAdmin = role === 'admin';
  const isSuper = role === 'super admin';
  if (!isAdmin && !isSuper) {
    errorResponse(res, 403, 'Admin or Super Admin access required');
    return null;
  }
  if (isSuper) {
    const companyId = req.query.companyId;
    if (companyId === undefined || companyId === '') return {};
    if (String(companyId).toLowerCase() === 'all') return {};
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      errorResponse(res, 400, 'Invalid company ID');
      return null;
    }
    return { company: new mongoose.Types.ObjectId(companyId) };
  }
  if (isAdmin) {
    if (!req.user?.company) {
      errorResponse(res, 403, 'User must be assigned to a company');
      return null;
    }
    return { company: req.user.company };
  }
  return {};
}

/** Build filter for admin list: { company: companyId } or {} when companyId === 'all'. Returns null if invalid ID. */
function companyFilterOrAll(companyId, res) {
  if (!companyId || String(companyId).toLowerCase() === 'all') return {};
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    errorResponse(res, 400, 'Invalid company ID');
    return null;
  }
  return { company: new mongoose.Types.ObjectId(companyId) };
}

/** Build date range filter on createdAt/updatedAt based on range key. Returns {} for all_time; null if invalid. */
function dateRangeFilterFromQuery(req, res) {
  const raw = (req.query.range || req.query.filter || 'all_time').toLowerCase();
  const range = raw.replace(/-/g, '_');
  if (range === 'all_time') return {};
  const now = new Date();
  let from;
  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };
  switch (range) {
    case 'yesterday':
      from = daysAgo(1);
      break;
    case 'last_7_days':
    case '7_days':
      from = daysAgo(7);
      break;
    case 'last_30_days':
    case '30_days':
      from = daysAgo(30);
      break;
    case 'last_6_days':
    case '6_days':
      from = daysAgo(6);
      break;
    case '6_month':
    case '6_months':
      from = (() => { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; })();
      break;
    case 'last_1_year':
    case '1_year':
      from = daysAgo(365);
      break;
    default:
      errorResponse(res, 400, 'Invalid date range. Use: yesterday, 7_days, 30_days, 6_months, 1_year, all_time');
      return null;
  }
  return {
    $or: [
      { createdAt: { $gte: from, $lte: now } },
      { updatedAt: { $gte: from, $lte: now } },
    ],
  };
}

/** Upcoming calibrations: due from start of today to end of range (today + X). Returns filter or null. */
function upcomingDueDateFilterFromQuery(req, res) {
  const raw = (req.query.range || req.query.filter || '30_days').toLowerCase();
  const range = raw.replace(/-/g, '_');
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  let endDate;
  const addDays = (days) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + days);
    return d;
  };
  switch (range) {
    case 'yesterday':
      endDate = addDays(1);
      break;
    case '7_days':
    case 'last_7_days':
      endDate = addDays(7);
      break;
    case '30_days':
    case 'last_30_days':
      endDate = addDays(30);
      break;
    case '6_days':
    case 'last_6_days':
      endDate = addDays(6);
      break;
    case '6_month':
    case '6_months':
      endDate = (() => { const d = new Date(startOfToday); d.setMonth(d.getMonth() + 6); return d; })();
      break;
    case '1_year':
    case 'last_1_year':
      endDate = addDays(365);
      break;
    case 'all_time':
      endDate = addDays(365 * 2);
      break;
    default:
      endDate = addDays(30);
  }
  return { calibrationDueDate: { $gte: startOfToday, $lte: endDate } };
}

/**
 * GET /api/admin/projects/:companyId
 * Super admin only. Pagination: page, limit, sortBy, sortOrder.
 */
const getProjectsByCompanyForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyFilter = companyFilterOrAll(req.params.companyId, res);
  if (companyFilter === null) return;
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const filter = { ...companyFilter, ...dateFilter };
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  const { data, pagination } = await paginateQuery(Project, filter, paginationParams, [], { lean: true });
  return successResponse(res, 200, 'Projects retrieved successfully', { projects: data || [], pagination });
});

/**
 * GET /api/admin/projects/stats
 * Super admin only. Returns: totalCompanies, totalProjects, completed, totalCalibrations.
 * Query: companyId (optional, "all" or MongoDB id for projects/calibrations), range (optional date range).
 */
const getProjectStatsForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyId = req.query.companyId;
  let companyFilter = {};
  if (companyId !== undefined && companyId !== '') {
    if (String(companyId).toLowerCase() === 'all') {
      companyFilter = {};
    } else if (!mongoose.Types.ObjectId.isValid(companyId)) {
      errorResponse(res, 400, 'Invalid company ID');
      return;
    } else {
      companyFilter = { company: new mongoose.Types.ObjectId(companyId) };
    }
  }
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const baseFilter = { ...companyFilter, ...dateFilter };

  const [totalCompanies, totalProjects, completed, totalCalibrations] = await Promise.all([
    Company.countDocuments(dateFilter),
    Project.countDocuments(baseFilter),
    Project.countDocuments({ ...baseFilter, status: { $in: ['completed', 'Completed'] } }),
    Calibration.countDocuments(baseFilter),
  ]);

  return successResponse(res, 200, 'Project stats retrieved successfully', {
    totalCompanies,
    totalProjects,
    completed,
    totalCalibrations,
  });
});

/**
 * GET /api/admin/gauges/:companyId
 * Super admin only. Pagination: page, limit, sortBy, sortOrder.
 */
const getGaugesByCompanyForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyFilter = companyFilterOrAll(req.params.companyId, res);
  if (companyFilter === null) return;
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const filter = { ...companyFilter, ...dateFilter };
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  const { data, pagination } = await paginateQuery(Gauge, filter, paginationParams, [], { lean: true });
  return successResponse(res, 200, 'Gauges retrieved successfully', { gauges: data || [], pagination });
});

/**
 * GET /api/admin/gauges/stats
 * Super admin only. Returns gauge counts: total, active, inactive, missing (maintenance).
 * Query: companyId (optional, "all" or MongoDB id), range (optional date range).
 */
const getGaugeStatsForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyId = req.query.companyId;
  let companyFilter = {};
  if (companyId !== undefined && companyId !== '') {
    if (String(companyId).toLowerCase() === 'all') {
      companyFilter = {};
    } else if (!mongoose.Types.ObjectId.isValid(companyId)) {
      errorResponse(res, 400, 'Invalid company ID');
      return;
    } else {
      companyFilter = { company: new mongoose.Types.ObjectId(companyId) };
    }
  }
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const baseFilter = { ...companyFilter, ...dateFilter };

  const [totalGauges, activeGauges, inactiveGauges, missingGaugesMaintenance] = await Promise.all([
    Gauge.countDocuments(baseFilter),
    Gauge.countDocuments({ ...baseFilter, status: { $in: ['active', 'Active'] } }),
    Gauge.countDocuments({ ...baseFilter, status: { $in: ['inactive', 'Inactive'] } }),
    Gauge.countDocuments({ ...baseFilter, status: { $in: ['maintenance', 'Maintenance'] } }),
  ]);

  return successResponse(res, 200, 'Gauge stats retrieved successfully', {
    totalGauges,
    activeGauges,
    inactiveGauges,
    missingGaugesMaintenance,
  });
});

/**
 * GET /api/admin/calibrations/:companyId
 * Super admin only. Pagination: page, limit, sortBy, sortOrder. Also returns upcomingCalibrations (first `limit` items).
 */
const getCalibrationsByCompanyForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyFilter = companyFilterOrAll(req.params.companyId, res);
  if (companyFilter === null) return;
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const filter = { ...companyFilter, ...dateFilter };
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  const upcomingDueFilter = upcomingDueDateFilterFromQuery(req, res);
  const [{ data: calibrationsRaw, pagination }, upcomingRaw] = await Promise.all([
    paginateQuery(
      Calibration,
      filter,
      paginationParams,
      [{ path: 'projectId', select: 'projectName' }],
      { lean: true },
    ),
    Calibration.find({ ...companyFilter, ...upcomingDueFilter })
      .limit(paginationParams.limit)
      .populate('projectId', 'projectName')
      .lean()
      .sort({ calibrationDueDate: 1 }),
  ]);
  const calibrations = (calibrationsRaw || []).map((c) => ({
    ...c,
    projectName: c.projectId?.projectName ?? '',
  }));
  const upcomingCalibrations = (upcomingRaw || []).map((c) => ({
    ...c,
    projectName: c.projectId?.projectName ?? '',
  }));
  return successResponse(res, 200, 'Calibrations retrieved successfully', {
    calibrations,
    upcomingCalibrations,
    pagination,
  });
});

/**
 * GET /api/admin/calibrations/upcoming
 * All roles. Returns calibrations due from today within the given range.
 * Super admin: companyId optional ("all" or MongoDB id). All other roles: companyId required and must be user's company.
 * Query: companyId (required for non–super admin), range or filter = yesterday, 7_days, 30_days, 6_month, 1_year (default 30_days), limit (optional, default 500).
 */
const getUpcomingCalibrationsForSuperAdmin = asyncHandler(async (req, res) => {
  const isSuperAdminUser = isSuperAdmin(req);
  const companyId = req.query.companyId;

  let companyFilter = {};
  if (isSuperAdminUser) {
    if (companyId !== undefined && companyId !== '') {
      if (String(companyId).toLowerCase() === 'all') {
        companyFilter = {};
      } else if (!mongoose.Types.ObjectId.isValid(companyId)) {
        errorResponse(res, 400, 'Invalid company ID');
        return;
      } else {
        companyFilter = { company: new mongoose.Types.ObjectId(companyId) };
      }
    }
  } else {
    if (!companyId || String(companyId).trim() === '') {
      errorResponse(res, 400, 'Company ID is required');
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      errorResponse(res, 400, 'Invalid company ID');
      return;
    }
    if (String(req.user.company) !== String(companyId)) {
      errorResponse(res, 403, 'Access denied to this company');
      return;
    }
    companyFilter = { company: new mongoose.Types.ObjectId(companyId) };
  }

  const upcomingDueFilter = upcomingDueDateFilterFromQuery(req, res);
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  if (req.query.sortBy === undefined) paginationParams.sortBy = 'calibrationDueDate';
  if (req.query.sortOrder === undefined) paginationParams.sortOrder = 1;
  const { data: upcomingRaw, pagination } = await paginateQuery(
    Calibration,
    { ...companyFilter, ...upcomingDueFilter },
    paginationParams,
    [{ path: 'projectId', select: 'projectName' }],
    { lean: true },
  );
  const upcomingCalibrations = (upcomingRaw || []).map((c) => ({
    ...c,
    projectName: c.projectId?.projectName ?? '',
  }));
  return successResponse(res, 200, 'Upcoming calibrations retrieved successfully', {
    upcomingCalibrations,
    pagination,
  });
});

/**
 * GET /api/admin/calibrations/stats
 * Super admin only. Returns: totalProjects, totalCalibrations, completed, overdueTotal.
 * Query: companyId (optional, "all" or MongoDB id), range (optional date range).
 */
const getCalibrationStatsForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyId = req.query.companyId;
  let companyFilter = {};
  if (companyId !== undefined && companyId !== '') {
    if (String(companyId).toLowerCase() === 'all') {
      companyFilter = {};
    } else if (!mongoose.Types.ObjectId.isValid(companyId)) {
      errorResponse(res, 400, 'Invalid company ID');
      return;
    } else {
      companyFilter = { company: new mongoose.Types.ObjectId(companyId) };
    }
  }
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const baseFilter = { ...companyFilter, ...dateFilter };

  const [totalProjects, totalCalibrations, completed, overdueTotal] = await Promise.all([
    Project.countDocuments(baseFilter),
    Calibration.countDocuments(baseFilter),
    Calibration.countDocuments({ ...baseFilter, status: { $in: ['completed', 'Completed'] } }),
    Calibration.countDocuments({ ...baseFilter, status: { $in: ['overdue', 'Overdue'] } }),
  ]);

  return successResponse(res, 200, 'Calibration stats retrieved successfully', {
    totalProjects,
    totalCalibrations,
    completed,
    overdueTotal,
  });
});

/**
 * GET /api/admin/reports/:companyId
 * Super admin only. Pagination: page, limit, sortBy, sortOrder.
 */
const getReportsByCompanyForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyFilter = companyFilterOrAll(req.params.companyId, res);
  if (companyFilter === null) return;
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const filter = { ...companyFilter, ...dateFilter };
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  const { data, pagination } = await paginateQuery(Report, filter, paginationParams, [], { lean: true });
  return successResponse(res, 200, 'Reports retrieved successfully', { reports: data || [], pagination });
});

/**
 * GET /api/admin/logs/:companyId
 * Super admin only. Pagination: page, limit, sortBy, sortOrder.
 */
const getLogsByCompanyForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const companyFilter = companyFilterOrAll(req.params.companyId, res);
  if (companyFilter === null) return;
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const filter = { ...companyFilter, ...dateFilter };
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  const { data, pagination } = await paginateQuery(Log, filter, paginationParams, [], { lean: true });
  return successResponse(res, 200, 'Logs retrieved successfully', { logs: data || [], pagination });
});

/**
 * GET /api/admin/companies/all
 * Super admin only. Pagination: page, limit, sortBy, sortOrder.
 */
const getAllCompaniesForSuperAdmin = asyncHandler(async (req, res) => {
  if (!ensureSuperAdminOr403(req, res)) return;
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);
  const { data, pagination } = await paginateQuery(Company, dateFilter, paginationParams, [], { lean: true });
  return successResponse(res, 200, 'Companies retrieved successfully', { companies: data || [], pagination });
});

/**
 * GET /api/admin/all-data
 * Returns projects, gauges, calibrations, reports, and logs from all companies. Pagination per collection: page, limit, sortBy, sortOrder.
 */
const getAllDataForSuperAdmin = asyncHandler(async (req, res) => {
  if (!isSuperAdmin(req)) {
    return errorResponse(res, 403, 'You are not admin');
  }
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;
  const paginationParams = parsePaginationParams(req.query, ADMIN_MAX_LIMIT);

  const [
    { data: projects, pagination: projectsPagination },
    { data: gauges, pagination: gaugesPagination },
    { data: calibrations, pagination: calibrationsPagination },
    { data: reports, pagination: reportsPagination },
    { data: logs, pagination: logsPagination },
  ] = await Promise.all([
    paginateQuery(Project, dateFilter, paginationParams, [], { lean: true }),
    paginateQuery(Gauge, dateFilter, paginationParams, [], { lean: true }),
    paginateQuery(Calibration, dateFilter, paginationParams, [], { lean: true }),
    paginateQuery(Report, dateFilter, paginationParams, [], { lean: true }),
    paginateQuery(Log, dateFilter, paginationParams, [], { lean: true }),
  ]);

  return successResponse(res, 200, 'All data retrieved successfully', {
    projects: projects || [],
    gauges: gauges || [],
    calibrations: calibrations || [],
    reports: reports || [],
    logs: logs || [],
    pagination: {
      projects: projectsPagination,
      gauges: gaugesPagination,
      calibrations: calibrationsPagination,
      reports: reportsPagination,
      logs: logsPagination,
    },
  });
});

/**
 * GET /api/admin/dashboard/stats
 * Admin and Super Admin only. Returns: totalGauges, dueThisMonth, completed, overdueCalibration.
 * Query: filter | range = yesterday | 7_days | 30_days | 6_months | 1_year | all_time (default 30_days).
 * Query: companyId = "all" or MongoDB company id (Super Admin only); Admin always sees their company.
 */
const getDashboardStatsForSuperAdmin = asyncHandler(async (req, res) => {
  const companyFilter = ensureAdminOrSuperAdminAndCompanyFilter(req, res);
  if (companyFilter === null) return;
  if (req.query.filter === undefined && req.query.range === undefined) {
    req.query.range = '30_days';
  }
  const dateFilter = dateRangeFilterFromQuery(req, res);
  if (dateFilter === null) return;

  const baseFilter = { ...companyFilter, ...dateFilter };
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [totalGauges, dueThisMonth, completed, overdueCalibration] = await Promise.all([
    Gauge.countDocuments(baseFilter),
    Calibration.countDocuments({
      ...companyFilter,
      calibrationDueDate: { $gte: startOfMonth, $lte: endOfMonth },
    }),
    Calibration.countDocuments({
      ...baseFilter,
      status: { $in: ['completed', 'Completed'] },
    }),
    Calibration.countDocuments({
      ...companyFilter,
      calibrationDueDate: { $lt: startOfToday },
      status: { $nin: ['completed', 'Completed'] },
    }),
  ]);

  const filter = (req.query.filter || req.query.range || '30_days').toString().toLowerCase().replace(/-/g, '_');
  const validFilter = ['yesterday', '7_days', '30_days', '6_months', '1_year', 'all_time'].includes(filter)
    ? filter
    : '30_days';

  return successResponse(res, 200, 'Dashboard stats retrieved successfully', {
    filter: validFilter,
    totalGauges,
    dueThisMonth,
    completed,
    overdueCalibration,
  });
});

export {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
  getUsers,
  searchUsers,
  getUnassignedUsersForSuperAdmin,
  updateUserCompany,
  getProjectsByCompanyForSuperAdmin,
  getProjectStatsForSuperAdmin,
  getGaugesByCompanyForSuperAdmin,
  getGaugeStatsForSuperAdmin,
  getCalibrationsByCompanyForSuperAdmin,
  getUpcomingCalibrationsForSuperAdmin,
  getCalibrationStatsForSuperAdmin,
  getReportsByCompanyForSuperAdmin,
  getLogsByCompanyForSuperAdmin,
  getAllCompaniesForSuperAdmin,
  getAllDataForSuperAdmin,
  getDashboardStatsForSuperAdmin,
};
