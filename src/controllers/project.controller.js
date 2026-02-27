import Project from '../models/project.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateNextCustomId } from '../utils/idGenerator.js';
import { parsePaginationParams, paginateQuery, parseSearchParams } from '../utils/pagination.js';

const createProject = asyncHandler(async (req, res) => {
  const { projectName, projectDescription, overdue, progress, status, startedAt } = req.body;
  if (!projectName || !startedAt) {
    return errorResponse(res, 400, 'Project name and start date are required');
  }
  const projectId = await generateNextCustomId(Project, 'projectId', 'P');
  const project = await Project.create({
    projectId,
    projectName,
    projectDescription: projectDescription || '',
    overdue: overdue || 0,
    progress: progress || 'Not Started',
    status: status || 'Active',
    startedAt,
    createdBy: req.user?._id,
  });
  return successResponse(res, 201, 'Project created successfully', { project });
});

const getProjects = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = parseSearchParams(req.query, ['projectName', 'projectDescription', 'projectId']);
  const populateOptions = [{ path: 'createdBy', select: 'name email role' }];
  const { data: projects, pagination } = await paginateQuery(
    Project,
    filter,
    paginationParams,
    populateOptions
  );
  return successResponse(res, 200, 'Projects retrieved successfully', { projects, pagination });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('createdBy', 'name email role');
  if (!project) return errorResponse(res, 404, 'Project not found');
  return successResponse(res, 200, 'Project retrieved successfully', { project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 404, 'Project not found');
  Object.assign(project, req.body);
  await project.save();
  return successResponse(res, 200, 'Project updated successfully', { project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return errorResponse(res, 404, 'Project not found');
  await project.deleteOne();
  return successResponse(res, 200, 'Project deleted successfully');
});

export default {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
