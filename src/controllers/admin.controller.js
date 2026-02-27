import Project from '../models/project.model.js';
import Report from '../models/report.model.js';
import Gauge from '../models/gauge.model.js';
import Calibration from '../models/calibration.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { resetSequence, getSequenceInfo } from '../utils/idGenerator.js';

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

export {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
};
