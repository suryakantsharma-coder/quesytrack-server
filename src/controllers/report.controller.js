const Report = require('../models/report.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateNextCustomId } = require('../utils/idGenerator');
const { parsePaginationParams, paginateQuery, parseSearchParams } = require('../utils/pagination');

/**
 * @route   POST /api/reports
 * @desc    Create report
 * @access  Private
 */
const createReport = asyncHandler(async (req, res) => {
  const {
    reportName,
    projectId,
    calibrationDate,
    calibrationDueDate,
    status,
    reportLink,
  } = req.body;

  if (!reportName || !projectId || !calibrationDate || !calibrationDueDate) {
    return errorResponse(res, 400, 'Required report fields are missing');
  }

  // Generate custom reportId (Format: R-001)
  const reportId = await generateNextCustomId(Report, 'reportId', 'R');

  const report = await Report.create({
    reportId,
    reportName,
    projectId,
    calibrationDate,
    calibrationDueDate,
    status,
    reportLink,
    createdBy: req.user?._id,
  });

  return successResponse(res, 201, 'Report created successfully', {
    report,
  });
});

/**
 * @route   GET /api/reports
 * @desc    Get all reports with pagination
 * @access  Private
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: 'asc' or 'desc' (default: desc)
 * - search: Search term for reportName
 * - status: Filter by status
 * - projectId: Filter by project
 */
const getReports = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, ['reportName', 'reportId']);

  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' }
  ];

  const { data: reports, pagination } = await paginateQuery(
    Report,
    filter,
    paginationParams,
    populateOptions
  );

  return successResponse(res, 200, 'Reports retrieved successfully', {
    reports,
    pagination,
  });
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('projectId', 'projectName')
    .populate('createdBy', 'name email');

  if (!report) {
    return errorResponse(res, 404, 'Report not found');
  }

  return successResponse(res, 200, 'Report retrieved successfully', {
    report,
  });
});

/**
 * @route   PUT /api/reports/:id
 * @desc    Update report
 * @access  Private
 */
const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return errorResponse(res, 404, 'Report not found');
  }

  Object.assign(report, req.body);
  await report.save();

  return successResponse(res, 200, 'Report updated successfully', {
    report,
  });
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete report
 * @access  Private
 */
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return errorResponse(res, 404, 'Report not found');
  }

  await report.deleteOne();

  return successResponse(res, 200, 'Report deleted successfully');
});

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
};
