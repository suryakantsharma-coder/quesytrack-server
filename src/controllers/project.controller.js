const Project = require('../models/project.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Project Controller
 * Handles project CRUD operations
 *
 * Response format:
 * { success: boolean, message?: string, data?: any, error?: string }
 */

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 *
 * Expected request body:
 * {
 *   projectName: string,
 *   projectDescription?: string,
 *   overdue?: number,
 *   progress?: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold',
 *   status?: 'Active' | 'Inactive' | 'Completed',
 *   startedAt: Date
 * }
 */
const createProject = asyncHandler(async (req, res) => {
  const {
    projectName,
    projectDescription,
    overdue,
    progress,
    status,
    startedAt,
  } = req.body;

  // Validation
  if (!projectName || !startedAt) {
    return errorResponse(res, 400, 'Project name and start date are required');
  }

  const project = await Project.create({
    projectName,
    projectDescription: projectDescription || '',
    overdue: overdue || 0,
    progress: progress || 'Not Started',
    status: status || 'Active',
    startedAt,
    createdBy: req.user?._id,
  });

  return successResponse(res, 201, 'Project created successfully', {
    project,
  });
});

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email role');

  return successResponse(res, 200, 'Projects retrieved successfully', {
    projects,
  });
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Private
 */
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate(
    'createdBy',
    'name email role'
  );

  if (!project) {
    return errorResponse(res, 404, 'Project not found');
  }

  return successResponse(res, 200, 'Project retrieved successfully', {
    project,
  });
});

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return errorResponse(res, 404, 'Project not found');
  }

  Object.assign(project, req.body);
  await project.save();

  return successResponse(res, 200, 'Project updated successfully', {
    project,
  });
});

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Admin recommended)
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return errorResponse(res, 404, 'Project not found');
  }

  await project.deleteOne();

  return successResponse(res, 200, 'Project deleted successfully');
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
