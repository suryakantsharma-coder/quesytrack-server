const Calibration = require('../models/calibration.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   POST /api/calibrations
 * @desc    Create calibration
 * @access  Private
 */
const createCalibration = asyncHandler(async (req, res) => {
  const {
    calibrationId,
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

  if (!calibrationId || !projectId || !calibrationDate || !calibrationDueDate) {
    return errorResponse(res, 400, 'Required calibration fields are missing');
  }

  const attachments =
    req.files?.map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
    })) || [];

  const calibration = await Calibration.create({
    calibrationId,
    projectId,
    gaugeId,
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
 * @desc    Get all calibrations
 * @access  Private
 */
const getCalibrations = asyncHandler(async (req, res) => {
  const calibrations = await Calibration.find()
    .populate('projectId', 'projectName')
    .populate('gaugeId', 'gaugeName')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Calibrations retrieved successfully', {
    calibrations,
  });
});

/**
 * @route   GET /api/calibrations/:id
 * @desc    Get calibration by ID
 * @access  Private
 */
const getCalibrationById = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id)
    .populate('projectId', 'projectName')
    .populate('gaugeId', 'gaugeName')
    .populate('createdBy', 'name email');

  if (!calibration) {
    return errorResponse(res, 404, 'Calibration not found');
  }

  return successResponse(res, 200, 'Calibration retrieved successfully', {
    calibration,
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
