import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Gauge from "../models/gauge.model.js";
import Calibration from "../models/calibration.model.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateNextCustomId } from "../utils/idGenerator.js";
import { auditLogFromRequest } from "../services/logger.service.js";
import {
  parsePaginationParams,
  paginateQuery,
  parseSearchParams,
  buildSearchFilter,
} from "../utils/pagination.js";
import {
  requireCompany,
  addCompanyFilter,
  ensureCompanyAccess,
  stripCompanyFromBody,
} from "../utils/companyIsolation.js";

const createProject = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const body = stripCompanyFromBody(req.body);
  const {
    projectName,
    projectDescription,
    overdue,
    progress,
    status,
    startedAt,
  } = body;
  if (!projectName || !startedAt) {
    return errorResponse(res, 400, "Project name and start date are required");
  }
  const projectId = await generateNextCustomId(Project, "projectId", "P");
  const project = await Project.create({
    projectId,
    projectName,
    projectDescription: projectDescription || "",
    overdue: overdue || 0,
    progress: progress || "Not Started",
    status: status || "Active",
    startedAt,
    createdBy: req.user?._id,
    company: req.user.company,
  });
  auditLogFromRequest(req, {
    actionType: "CREATE",
    entityType: "PROJECT",
    entityId: project._id.toString(),
    entityName: project.projectName,
    title: "New Project Created",
    description: `${project.projectName} project created by ${req.user?.name || "User"}.`,
  });
  return successResponse(res, 201, "Project created successfully", { project });
});

const getProjects = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, [
    "projectName",
    "projectDescription",
    "projectId",
  ]);
  addCompanyFilter(filter, req);
  const populateOptions = [{ path: "createdBy", select: "name email role" }];
  const { data: projects, pagination } = await paginateQuery(
    Project,
    filter,
    paginationParams,
    populateOptions,
  );
  return successResponse(res, 200, "Projects retrieved successfully", {
    projects,
    pagination,
  });
});

const searchProjects = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildSearchFilter(
    req.query,
    ["projectName", "projectDescription", "projectId"],
    {
      dateField: "startedAt",
    },
  );
  addCompanyFilter(filter, req);
  const populateOptions = [{ path: "createdBy", select: "name email role" }];
  const { data, pagination } = await paginateQuery(
    Project,
    filter,
    paginationParams,
    populateOptions,
  );
  return successResponse(res, 200, "Search successful", { data, pagination });
});

async function resolveProject(id, req) {
  if (!id || (typeof id === "string" && !id.trim())) return null;
  if (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === String(id)
  ) {
    return Project.findById(id);
  }
  return Project.findOne({ projectId: id.trim(), company: req.user.company });
}

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate(
    "createdBy",
    "name email role",
  );
  if (!project) return errorResponse(res, 404, "Project not found");
  if (!ensureCompanyAccess(req, res, project)) return;
  return successResponse(res, 200, "Project retrieved successfully", {
    project,
  });
});

const getGaugesByProjectId = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const { id: projectIdParam } = req.params;
  const project = await resolveProject(projectIdParam, req);
  if (!project) return errorResponse(res, 404, "Project not found");
  if (!ensureCompanyAccess(req, res, project)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = { projectId: project._id };
  addCompanyFilter(filter, req);
  const populateOptions = [
    { path: "projectId", select: "projectName projectId" },
    { path: "createdBy", select: "name email" },
  ];
  const { data: gauges, pagination } = await paginateQuery(
    Gauge,
    filter,
    paginationParams,
    populateOptions,
  );
  return successResponse(res, 200, "Gauges retrieved successfully", {
    gauges,
    pagination,
  });
});

const getCalibrationsByProjectId = asyncHandler(async (req, res) => {
  if (!requireCompany(req, res)) return;
  const { id: projectIdParam } = req.params;
  const project = await resolveProject(projectIdParam, req);
  if (!project) return errorResponse(res, 404, "Project not found");
  if (!ensureCompanyAccess(req, res, project)) return;
  const paginationParams = parsePaginationParams(req.query);
  const filter = { projectId: project._id };
  addCompanyFilter(filter, req);
  const populateOptions = [
    { path: "projectId", select: "projectName projectId" },
    { path: "createdBy", select: "name email" },
  ];
  const { data: calibrations, pagination } = await paginateQuery(
    Calibration,
    filter,
    paginationParams,
    populateOptions,
  );
  return successResponse(res, 200, "Calibrations retrieved successfully", {
    calibrations,
    pagination,
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 404, "Project not found");
  if (!ensureCompanyAccess(req, res, project)) return;
  const previousData = project.toObject();
  const body = stripCompanyFromBody(req.body);
  Object.assign(project, body);
  await project.save();
  auditLogFromRequest(req, {
    actionType: "UPDATE",
    entityType: "PROJECT",
    entityId: project._id.toString(),
    entityName: project.projectName,
    title: "Project Updated",
    description: `${project.projectName} updated by ${req.user?.name || "User"}.`,
    previousData: previousData,
    newData: project.toObject(),
  });
  return successResponse(res, 200, "Project updated successfully", { project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 404, "Project not found");
  if (!ensureCompanyAccess(req, res, project)) return;
  const entityName = project.projectName;
  const entityId = project._id.toString();
  await project.deleteOne();
  auditLogFromRequest(req, {
    actionType: "DELETE",
    entityType: "PROJECT",
    entityId,
    entityName,
    title: "Project Deleted",
    description: `${entityName} deleted by ${req.user?.name || "User"}.`,
  });
  return successResponse(res, 200, "Project deleted successfully");
});

export default {
  createProject,
  getProjects,
  searchProjects,
  getProjectById,
  getGaugesByProjectId,
  getCalibrationsByProjectId,
  updateProject,
  deleteProject,
};
