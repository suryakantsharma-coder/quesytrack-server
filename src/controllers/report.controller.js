import Report from '../models/report.model.js';
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

const createReport = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const body = stripCompanyFromBody(req.body);
  const { reportName, projectId, calibrationDate, calibrationDueDate, status, reportLink } =
    body;
  if (!reportName || !projectId || !calibrationDate || !calibrationDueDate) {
    return errorResponse(res, 400, 'Required report fields are missing');
  }
  const project = await Project.findOne({ _id: projectId, company: req.user.company });
  if (!project) return errorResponse(res, 400, 'Project not found or access denied');
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
    company: req.user.company,
  });
  auditLogFromRequest(req, {
    actionType: 'CREATE',
    entityType: 'REPORT',
    entityId: report._id.toString(),
    entityName: report.reportName,
    title: 'Report Created',
    description: `${report.reportName} created by ${req.user?.name || 'User'}.`,
  });
  return successResponse(res, 201, 'Report created successfully', { report });
});

const getReports = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, ['reportName', 'reportId']);
  addCompanyFilter(filter, req);
  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' },
  ];
  const { data: reports, pagination } = await paginateQuery(
    Report,
    filter,
    paginationParams,
    populateOptions
  );
  return successResponse(res, 200, 'Reports retrieved successfully', { reports, pagination });
});

const searchReports = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildSearchFilter(req.query, ['reportName', 'reportId'], {
    dateField: 'calibrationDate',
  });
  addCompanyFilter(filter, req);
  const populateOptions = [
    { path: 'projectId', select: 'projectName projectId' },
    { path: 'createdBy', select: 'name email' },
  ];
  const { data, pagination } = await paginateQuery(
    Report,
    filter,
    paginationParams,
    populateOptions
  );
  return successResponse(res, 200, 'Search successful', { data, pagination });
});

const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('projectId', 'projectName')
    .populate('createdBy', 'name email');
  if (!report) return errorResponse(res, 404, 'Report not found');
  if (!ensureCompanyAccess(req, res, report)) return;
  return successResponse(res, 200, 'Report retrieved successfully', { report });
});

const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return errorResponse(res, 404, 'Report not found');
  if (!ensureCompanyAccess(req, res, report)) return;
  const body = stripCompanyFromBody(req.body);
  Object.assign(report, body);
  await report.save();
  auditLogFromRequest(req, {
    actionType: 'UPDATE',
    entityType: 'REPORT',
    entityId: report._id.toString(),
    entityName: report.reportName,
    title: 'Report Updated',
    description: `${report.reportName} updated by ${req.user?.name || 'User'}.`,
  });
  return successResponse(res, 200, 'Report updated successfully', { report });
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return errorResponse(res, 404, 'Report not found');
  if (!ensureCompanyAccess(req, res, report)) return;
  const entityName = report.reportName;
  const entityId = report._id.toString();
  await report.deleteOne();
  auditLogFromRequest(req, {
    actionType: 'DELETE',
    entityType: 'REPORT',
    entityId,
    entityName,
    title: 'Report Deleted',
    description: `${entityName} deleted by ${req.user?.name || 'User'}.`,
  });
  return successResponse(res, 200, 'Report deleted successfully');
});

export default {
  createReport,
  getReports,
  searchReports,
  getReportById,
  updateReport,
  deleteReport,
};
