const Project = require('../models/project.model');
const Report = require('../models/report.model');
const Gauge = require('../models/gauge.model');
const Calibration = require('../models/calibration.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { resetSequence, getSequenceInfo } = require('../utils/idGenerator');

/**
 * Admin Controller
 * Handles admin operations like sequence reset
 */

// Model mapping for convenience
const modelMap = {
  project: { model: Project, idField: 'projectId', prefix: 'P' },
  report: { model: Report, idField: 'reportId', prefix: 'R' },
  gauge: { model: Gauge, idField: 'gaugeId', prefix: 'G' },
  calibration: { model: Calibration, idField: 'calibrationId', prefix: 'C' },
};

/**
 * @route   POST /api/admin/reset-sequence/:type
 * @desc    Reset sequence for a specific model type
 * @access  Private (Admin only)
 * 
 * @param   {string} type - Model type (project, report, gauge, calibration)
 * @body    {number} startFrom - Optional starting sequence number (default: 1)
 * 
 * Example: POST /api/admin/reset-sequence/project
 * Body: { "startFrom": 1 }
 */
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

/**
 * @route   GET /api/admin/sequence-info/:type
 * @desc    Get current sequence info for a specific model type
 * @access  Private (Admin only)
 * 
 * @param   {string} type - Model type (project, report, gauge, calibration)
 * 
 * Example: GET /api/admin/sequence-info/project
 */
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

/**
 * @route   GET /api/admin/sequence-info
 * @desc    Get current sequence info for all model types
 * @access  Private (Admin only)
 */
const getAllSequenceInfo = asyncHandler(async (req, res) => {
  const allInfo = {};

  for (const [type, { model, idField, prefix }] of Object.entries(modelMap)) {
    allInfo[type] = await getSequenceInfo(model, idField, prefix);
  }

  return successResponse(res, 200, 'Sequence info for all models', allInfo);
});

/**
 * @route   POST /api/admin/reset-all-sequences
 * @desc    Reset sequences for all model types
 * @access  Private (Admin only)
 * 
 * @body    {number} startFrom - Optional starting sequence number (default: 1)
 */
const resetAllSequences = asyncHandler(async (req, res) => {
  const { startFrom = 1 } = req.body;

  const results = {};

  for (const [type, { model, idField, prefix }] of Object.entries(modelMap)) {
    results[type] = await resetSequence(model, idField, prefix, startFrom);
  }

  return successResponse(res, 200, 'All sequences reset successfully', results);
});

module.exports = {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
};
