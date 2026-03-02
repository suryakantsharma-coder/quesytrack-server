import mongoose from 'mongoose';
import Gauge from '../models/gauge.model.js';
import Project from '../models/project.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateNextCustomId } from '../utils/idGenerator.js';
import {
  parsePaginationParams,
  paginateQuery,
  parseSearchParams,
  buildSearchFilter,
} from '../utils/pagination.js';
import { auditLogFromRequest } from '../services/logger.service.js';
import { requireCompany, addCompanyFilter, ensureCompanyAccess, stripCompanyFromBody } from '../utils/companyIsolation.js';

const createGauge = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const body = stripCompanyFromBody(req.body);
  const {
    gaugeName,
    gaugeType,
    gaugeModel,
    manufacturer,
    location,
    traceability,
    nominalSize,
    status,
    projectId: rawProjectId,
  } = body;
  if (!gaugeName || !gaugeType) {
    return errorResponse(res, 400, 'Gauge name and type are required');
  }
  if (!rawProjectId || (typeof rawProjectId === 'string' && !rawProjectId.trim())) {
    return errorResponse(res, 400, 'Project is required when creating a gauge');
  }
  const projectId = mongoose.Types.ObjectId.isValid(rawProjectId)
    ? new mongoose.Types.ObjectId(rawProjectId)
    : null;
  if (!projectId) {
    return errorResponse(res, 400, 'Invalid project ID');
  }
  const project = await Project.findOne({ _id: projectId, company: req.user.company });
  if (!project) {
    return errorResponse(res, 400, 'Project not found or access denied');
  }
  const gaugeId = await generateNextCustomId(Gauge, 'gaugeId', 'G');
  const imagePath = req.file?.path || '';
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
    image: imagePath,
    createdBy: req.user?._id,
    company: req.user.company,
  });
  if (imagePath) {
    auditLogFromRequest(req, {
      actionType: 'UPLOAD',
      entityType: 'GAUGE',
      entityId: gauge._id.toString(),
      entityName: `${gauge.gaugeName} #${gauge.gaugeId}`,
      title: 'Gauge Image Added',
      description: `New image uploaded for ${gauge.gaugeName} #${gauge.gaugeId} by ${req.user?.name || 'User'}.`,
    });
  }
  return successResponse(res, 201, 'Gauge created successfully', { gauge });
});

const getGauges = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, ['gaugeName', 'gaugeModel', 'manufacturer', 'gaugeId']);
  addCompanyFilter(filter, req);
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

const searchGauges = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildSearchFilter(req.query, [
    'gaugeName',
    'gaugeModel',
    'manufacturer',
    'gaugeId',
    'location',
  ]);
  addCompanyFilter(filter, req);
  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' },
  ];
  const { data, pagination } = await paginateQuery(
    Gauge,
    filter,
    paginationParams,
    populateOptions
  );
  return successResponse(res, 200, 'Search successful', { data, pagination });
});

const getGaugeById = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id)
    .populate('projectId', 'projectName')
    .populate('createdBy', 'name email');
  if (!gauge) return errorResponse(res, 404, 'Gauge not found');
  if (!ensureCompanyAccess(req, res, gauge)) return;
  return successResponse(res, 200, 'Gauge retrieved successfully', { gauge });
});

const updateGauge = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id);
  if (!gauge || !ensureCompanyAccess(req, res, gauge)) return;
  const body = stripCompanyFromBody(req.body);
  Object.assign(gauge, body);
  if (req.file) gauge.image = req.file.path;
  await gauge.save();
  if (req.file) {
    auditLogFromRequest(req, {
      actionType: 'UPLOAD',
      entityType: 'GAUGE',
      entityId: gauge._id.toString(),
      entityName: `${gauge.gaugeName} #${gauge.gaugeId}`,
      title: 'Gauge Image Added',
      description: `New image uploaded for ${gauge.gaugeName} #${gauge.gaugeId} by ${req.user?.name || 'User'}.`,
    });
  } else {
    auditLogFromRequest(req, {
      actionType: 'UPDATE',
      entityType: 'GAUGE',
      entityId: gauge._id.toString(),
      entityName: `${gauge.gaugeName} #${gauge.gaugeId}`,
      title: 'Gauge Updated',
      description: `${gauge.gaugeName} #${gauge.gaugeId} updated by ${req.user?.name || 'User'}.`,
    });
  }
  return successResponse(res, 200, 'Gauge updated successfully', { gauge });
});

const deleteGauge = asyncHandler(async (req, res) => {
  const gauge = await Gauge.findById(req.params.id);
  if (!gauge || !ensureCompanyAccess(req, res, gauge)) return;
  const entityName = `${gauge.gaugeName} #${gauge.gaugeId}`;
  const entityId = gauge._id.toString();
  await gauge.deleteOne();
  auditLogFromRequest(req, {
    actionType: 'DELETE',
    entityType: 'GAUGE',
    entityId,
    entityName,
    title: 'Gauge Deleted',
    description: `${entityName} deleted by ${req.user?.name || 'User'}.`,
  });
  return successResponse(res, 200, 'Gauge deleted successfully');
});

export default {
  createGauge,
  getGauges,
  searchGauges,
  getGaugeById,
  updateGauge,
  deleteGauge,
};
