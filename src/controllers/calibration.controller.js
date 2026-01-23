const Calibration = require('../models/calibration.model');
const Gauge = require('../models/gauge.model');
const Project = require('../models/project.model');
const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateNextCustomId } = require('../utils/idGenerator');
const { parsePaginationParams, paginateQuery, parseSearchParams } = require('../utils/pagination');

/**
 * @route   POST /api/calibrations
 * @desc    Create calibration
 * @access  Private
 */
const createCalibration = asyncHandler(async (req, res) => {
  const {
    calibrationId: providedCalibrationId,
    projectId,
    gaugeId,
    calibrationDate,
    calibrationDueDate,
    calibratedBy,
    calibrationType,
    traceability,
    certificateNumber,
    reportLink,
  } = req.body;

  if (!projectId || !calibrationDate || !calibrationDueDate) {
    return errorResponse(res, 400, 'Required calibration fields are missing');
  }

  // Generate custom calibrationId if not provided (Format: C-001)
  const calibrationId = providedCalibrationId || await generateNextCustomId(Calibration, 'calibrationId', 'C');

  // Convert custom projectId to MongoDB ObjectId if needed
  let finalProjectId = projectId;
  if (typeof projectId === 'string' && !mongoose.Types.ObjectId.isValid(projectId)) {
    // It's a custom projectId (e.g., P-001), find the actual MongoDB _id
    const project = await Project.findOne({ projectId: projectId.trim() });
    if (!project) {
      return errorResponse(res, 400, 'Project not found with the provided projectId');
    }
    finalProjectId = project._id;
  }

  // Handle empty string gaugeId - set to null/undefined
  const finalGaugeId = gaugeId && gaugeId.trim() !== '' ? gaugeId.trim() : null;

  const attachments =
    req.files?.map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
    })) || [];

  const calibration = await Calibration.create({
    calibrationId,
    projectId: finalProjectId,
    gaugeId: finalGaugeId,
    calibrationDate,
    calibrationDueDate,
    calibratedBy,
    calibrationType,
    traceability,
    certificateNumber,
    reportLink,
    attachments,
    createdBy: req.user?._id,
  });

  return successResponse(res, 201, 'Calibration created successfully', {
    calibration,
  });
});

/**
 * @route   GET /api/calibrations
 * @desc    Get all calibrations with pagination
 * @access  Private
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: 'asc' or 'desc' (default: desc)
 * - search: Search term for calibrationId, calibratedBy, certificateNumber
 * - status: Filter by status
 * - calibrationType: Filter by calibration type
 * - projectId: Filter by project
 * - gaugeId: Filter by gauge
 */
const getCalibrations = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  let filter = parseSearchParams(req.query, ['calibrationId', 'calibratedBy', 'certificateNumber']);

  // Handle custom projectId in filter - convert to MongoDB ObjectId if needed
  if (filter.projectId && typeof filter.projectId === 'string' && !mongoose.Types.ObjectId.isValid(filter.projectId)) {
    const project = await Project.findOne({ projectId: filter.projectId.trim() });
    if (project) {
      filter.projectId = project._id;
    } else {
      // Project not found, return empty results
      filter.projectId = new mongoose.Types.ObjectId(); // Invalid ID that won't match anything
    }
  }

  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' }
  ];

  const { data: calibrations, pagination } = await paginateQuery(
    Calibration,
    filter,
    paginationParams,
    populateOptions
  );

  // Manually populate gauge information using custom gaugeId
  const calibrationsWithGauge = await Promise.all(
    calibrations.map(async (calibration) => {
      const calibrationObj = calibration.toObject();
      if (calibrationObj.gaugeId) {
        const gauge = await Gauge.findOne({ gaugeId: calibrationObj.gaugeId })
          .select('gaugeName gaugeId');
        calibrationObj.gauge = gauge || null;
      } else {
        calibrationObj.gauge = null;
      }
      return calibrationObj;
    })
  );

  return successResponse(res, 200, 'Calibrations retrieved successfully', {
    calibrations: calibrationsWithGauge,
    pagination,
  });
});

/**
 * @route   GET /api/calibrations/:id
 * @desc    Get calibration by ID
 * @access  Private
 */
const getCalibrationById = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id)
    .populate('projectId', 'projectName projectId')
    .populate('createdBy', 'name email');

  if (!calibration) {
    return errorResponse(res, 404, 'Calibration not found');
  }

  // Manually populate gauge information using custom gaugeId
  const calibrationObj = calibration.toObject();
  if (calibrationObj.gaugeId) {
    const gauge = await Gauge.findOne({ gaugeId: calibrationObj.gaugeId })
      .select('gaugeName gaugeId');
    calibrationObj.gauge = gauge || null;
  } else {
    calibrationObj.gauge = null;
  }

  return successResponse(res, 200, 'Calibration retrieved successfully', {
    calibration: calibrationObj,
  });
});

/**
 * @route   PUT /api/calibrations/:id
 * @desc    Update calibration
 * @access  Private
 */
const updateCalibration = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id);

  if (!calibration) {
    return errorResponse(res, 404, 'Calibration not found');
  }

  // Handle empty string gaugeId - set to null/undefined
  if (req.body.gaugeId !== undefined) {
    req.body.gaugeId = req.body.gaugeId && req.body.gaugeId.trim() !== '' 
      ? req.body.gaugeId.trim() 
      : null;
  }

  // Handle custom projectId conversion if provided
  if (req.body.projectId && typeof req.body.projectId === 'string' && !mongoose.Types.ObjectId.isValid(req.body.projectId)) {
    const project = await Project.findOne({ projectId: req.body.projectId.trim() });
    if (!project) {
      return errorResponse(res, 400, 'Project not found with the provided projectId');
    }
    req.body.projectId = project._id;
  }

  Object.assign(calibration, req.body);

  if (req.files?.length) {
    const newAttachments = req.files.map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
    }));

    calibration.attachments.push(...newAttachments);
  }

  await calibration.save();

  return successResponse(res, 200, 'Calibration updated successfully', {
    calibration,
  });
});

/**
 * @route   DELETE /api/calibrations/:id
 * @desc    Delete calibration
 * @access  Private
 */
const deleteCalibration = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id);

  if (!calibration) {
    return errorResponse(res, 404, 'Calibration not found');
  }

  await calibration.deleteOne();

  return successResponse(res, 200, 'Calibration deleted successfully');
});

module.exports = {
  createCalibration,
  getCalibrations,
  getCalibrationById,
  updateCalibration,
  deleteCalibration,
};
