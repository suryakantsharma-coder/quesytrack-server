import Gauge from '../models/gauge.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateNextCustomId } from '../utils/idGenerator.js';
import { parsePaginationParams, paginateQuery, parseSearchParams } from '../utils/pagination.js';

const createGauge = asyncHandler(async (req, res) => {
  const {
    gaugeName,
    gaugeType,
    gaugeModel,
    manufacturer,
    location,
    traceability,
    nominalSize,
    status,
    projectId,
  } = req.body;
  if (!gaugeName || !gaugeType) {
    return errorResponse(res, 400, 'Gauge name and type are required');
  }
  const gaugeId = await generateNextCustomId(Gauge, 'gaugeId', 'G');
  const gauge = await Gauge.create({
    gaugeId,
    gaugeName,
    gaugeType,
    gaugeModel,
    manufacturer,
    location,
    traceability,
    nominalSize,
    status,
    projectId,
    image: req.file?.path || '',
    createdBy: req.user?._id,
  });
  return successResponse(res, 201, 'Gauge created successfully', { gauge });
});

const getGauges = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, ['gaugeName', 'gaugeModel', 'manufacturer', 'gaugeId']);
  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' },
  ];
  const { data: gauges, pagination } = await paginateQuery(
    Gauge,
    filter,
    paginationParams,
    populateOptions
  );
  return successResponse(res, 200, 'Gauges retrieved successfully', { gauges, pagination });
});

const getGaugeById = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id)
    .populate('projectId', 'projectName')
    .populate('createdBy', 'name email');
  if (!gauge) return errorResponse(res, 404, 'Gauge not found');
  return successResponse(res, 200, 'Gauge retrieved successfully', { gauge });
});

const updateGauge = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id);
  if (!gauge) return errorResponse(res, 404, 'Gauge not found');
  Object.assign(gauge, req.body);
  if (req.file) gauge.image = req.file.path;
  await gauge.save();
  return successResponse(res, 200, 'Gauge updated successfully', { gauge });
});

const deleteGauge = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id);
  if (!gauge) return errorResponse(res, 404, 'Gauge not found');
  await gauge.deleteOne();
  return successResponse(res, 200, 'Gauge deleted successfully');
});

export default {
  createGauge,
  getGauges,
  getGaugeById,
  updateGauge,
  deleteGauge,
};
