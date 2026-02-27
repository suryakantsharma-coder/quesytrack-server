import Calibration from '../models/calibration.model.js';
import Gauge from '../models/gauge.model.js';
import Project from '../models/project.model.js';
import mongoose from 'mongoose';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateNextCustomId } from '../utils/idGenerator.js';
import { parsePaginationParams, paginateQuery, parseSearchParams } from '../utils/pagination.js';

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

  const calibrationId =
    providedCalibrationId || (await generateNextCustomId(Calibration, 'calibrationId', 'C'));

  let finalProjectId = projectId;
  if (
    typeof projectId === 'string' &&
    !mongoose.Types.ObjectId.isValid(projectId)
  ) {
    const project = await Project.findOne({ projectId: projectId.trim() });
    if (!project) {
      return errorResponse(res, 400, 'Project not found with the provided projectId');
    }
    finalProjectId = project._id;
  }

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
  return successResponse(res, 201, 'Calibration created successfully', { calibration });
});

const getCalibrations = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  let filter = parseSearchParams(req.query, [
    'calibrationId',
    'calibratedBy',
    'certificateNumber',
  ]);

  if (
    filter.projectId &&
    typeof filter.projectId === 'string' &&
    !mongoose.Types.ObjectId.isValid(filter.projectId)
  ) {
    const project = await Project.findOne({ projectId: filter.projectId.trim() });
    if (project) filter.projectId = project._id;
    else filter.projectId = new mongoose.Types.ObjectId();
  }

  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' },
  ];
  const { data: calibrations, pagination } = await paginateQuery(
    Calibration,
    filter,
    paginationParams,
    populateOptions
  );

  const calibrationsWithGauge = await Promise.all(
    calibrations.map(async (calibration) => {
      const calibrationObj = calibration.toObject();
      if (calibrationObj.gaugeId) {
        calibrationObj.gauge = await Gauge.findOne({ gaugeId: calibrationObj.gaugeId }).select(
          'gaugeName gaugeId'
        );
      } else calibrationObj.gauge = null;
      return calibrationObj;
    })
  );

  return successResponse(res, 200, 'Calibrations retrieved successfully', {
    calibrations: calibrationsWithGauge,
    pagination,
  });
});

const getCalibrationById = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id)
    .populate('projectId', 'projectName projectId')
    .populate('createdBy', 'name email');
  if (!calibration) return errorResponse(res, 404, 'Calibration not found');

  const calibrationObj = calibration.toObject();
  if (calibrationObj.gaugeId) {
    calibrationObj.gauge = await Gauge.findOne({ gaugeId: calibrationObj.gaugeId }).select(
      'gaugeName gaugeId'
    );
  } else calibrationObj.gauge = null;

  return successResponse(res, 200, 'Calibration retrieved successfully', {
    calibration: calibrationObj,
  });
});

const updateCalibration = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id);
  if (!calibration) return errorResponse(res, 404, 'Calibration not found');

  if (req.body.gaugeId !== undefined) {
    req.body.gaugeId =
      req.body.gaugeId && req.body.gaugeId.trim() !== '' ? req.body.gaugeId.trim() : null;
  }
  if (
    req.body.projectId &&
    typeof req.body.projectId === 'string' &&
    !mongoose.Types.ObjectId.isValid(req.body.projectId)
  ) {
    const project = await Project.findOne({ projectId: req.body.projectId.trim() });
    if (!project) {
      return errorResponse(res, 400, 'Project not found with the provided projectId');
    }
    req.body.projectId = project._id;
  }

  Object.assign(calibration, req.body);
  if (req.files?.length) {
    calibration.attachments.push(
      ...req.files.map((file) => ({
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
      }))
    );
  }
  await calibration.save();
  return successResponse(res, 200, 'Calibration updated successfully', { calibration });
});

const deleteCalibration = asyncHandler(async (req, res) => {
  const calibration = await Calibration.findById(req.params.id);
  if (!calibration) return errorResponse(res, 404, 'Calibration not found');
  await calibration.deleteOne();
  return successResponse(res, 200, 'Calibration deleted successfully');
});

export default {
  createCalibration,
  getCalibrations,
  getCalibrationById,
  updateCalibration,
  deleteCalibration,
};
