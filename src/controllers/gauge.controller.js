const Gauge = require('../models/gauge.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateNextCustomId } = require('../utils/idGenerator');
const { parsePaginationParams, paginateQuery, parseSearchParams } = require('../utils/pagination');

/**
 * Gauge Controller
 * Handles gauge CRUD operations
 */

/**
 * @route   POST /api/gauges
 * @desc    Create a new gauge
 * @access  Private
 */
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

  // Generate custom gaugeId (Format: G-001)
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

  return successResponse(res, 201, 'Gauge created successfully', {
    gauge,
  });
});

/**
 * @route   GET /api/gauges
 * @desc    Get all gauges with pagination
 * @access  Private
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: 'asc' or 'desc' (default: desc)
 * - search: Search term for gaugeName, gaugeModel, manufacturer
 * - status: Filter by status
 * - gaugeType: Filter by gauge type
 * - projectId: Filter by project
 */
const getGauges = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, ['gaugeName', 'gaugeModel', 'manufacturer', 'gaugeId']);

  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' }
  ];

  const { data: gauges, pagination } = await paginateQuery(
    Gauge,
    filter,
    paginationParams,
    populateOptions
  );

  return successResponse(res, 200, 'Gauges retrieved successfully', {
    gauges,
    pagination,
  });
});

/**
 * @route   GET /api/gauges/:id
 * @desc    Get gauge by ID
 * @access  Private
 */
const getGaugeById = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id)
    .populate('projectId', 'projectName')
    .populate('createdBy', 'name email');

  if (!gauge) {
    return errorResponse(res, 404, 'Gauge not found');
  }

  return successResponse(res, 200, 'Gauge retrieved successfully', {
    gauge,
  });
});

/**
 * @route   PUT /api/gauges/:id
 * @desc    Update gauge
 * @access  Private
 */
const updateGauge = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id);

  if (!gauge) {
    return errorResponse(res, 404, 'Gauge not found');
  }

  Object.assign(gauge, req.body);

  if (req.file) {
    gauge.image = req.file.path;
  }

  await gauge.save();

  return successResponse(res, 200, 'Gauge updated successfully', {
    gauge,
  });
});

/**
 * @route   DELETE /api/gauges/:id
 * @desc    Delete gauge
 * @access  Private
 */
const deleteGauge = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id);

  if (!gauge) {
    return errorResponse(res, 404, 'Gauge not found');
  }

  await gauge.deleteOne();

  return successResponse(res, 200, 'Gauge deleted successfully');
});

module.exports = {
  createGauge,
  getGauges,
  getGaugeById,
  updateGauge,
  deleteGauge,
};
