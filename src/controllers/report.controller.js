const Report = require('../models/report.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

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

  const report = await Report.create({
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
 * @desc    Get all reports
 * @access  Private
 */
const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('projectId', 'projectName')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Reports retrieved successfully', {
    reports,
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
