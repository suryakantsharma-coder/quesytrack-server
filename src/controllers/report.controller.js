import Report from '../models/report.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateNextCustomId } from '../utils/idGenerator.js';
import { parsePaginationParams, paginateQuery, parseSearchParams } from '../utils/pagination.js';

const createReport = asyncHandler(async (req, res) => {
  const { reportName, projectId, calibrationDate, calibrationDueDate, status, reportLink } =
    req.body;
  if (!reportName || !projectId || !calibrationDate || !calibrationDueDate) {
    return errorResponse(res, 400, 'Required report fields are missing');
  }
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
  });
  return successResponse(res, 201, 'Report created successfully', { report });
});

const getReports = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, ['reportName', 'reportId']);
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

const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('projectId', 'projectName')
    .populate('createdBy', 'name email');
  if (!report) return errorResponse(res, 404, 'Report not found');
  return successResponse(res, 200, 'Report retrieved successfully', { report });
});

const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return errorResponse(res, 404, 'Report not found');
  Object.assign(report, req.body);
  await report.save();
  return successResponse(res, 200, 'Report updated successfully', { report });
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return errorResponse(res, 404, 'Report not found');
  await report.deleteOne();
  return successResponse(res, 200, 'Report deleted successfully');
});

export default {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
};
