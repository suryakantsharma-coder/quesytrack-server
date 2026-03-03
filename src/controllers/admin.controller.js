import mongoose from 'mongoose';
import Project from '../models/project.model.js';
import Report from '../models/report.model.js';
import Gauge from '../models/gauge.model.js';
import Calibration from '../models/calibration.model.js';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { resetSequence, getSequenceInfo } from '../utils/idGenerator.js';
import { parsePaginationParams, paginateQuery, buildSearchFilter } from '../utils/pagination.js';

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

const getUsers = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildSearchFilter(req.query, ['name', 'email', 'designation', 'role']);
  const { data, pagination } = await paginateQuery(User, filter, paginationParams, []);
  const users = data.map((u) => u.toObject());
  users.forEach((u) => delete u.password);
  return successResponse(res, 200, 'Users retrieved successfully', { users, pagination });
});

const searchUsers = asyncHandler(async (req, res) => {
  const paginationParams = parsePaginationParams(req.query);
  const filter = buildSearchFilter(req.query, ['name', 'email', 'designation', 'role']);
  const { data, pagination } = await paginateQuery(User, filter, paginationParams, []);
  const users = data.map((u) => u.toObject());
  users.forEach((u) => delete u.password);
  return successResponse(res, 200, 'Search successful', { data: users, pagination });
});

const updateUserCompany = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const { company: companyId, name, email, phoneNumber, designation } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return errorResponse(res, 400, 'Invalid user ID');
  }

  const user = await User.findById(userId);
  if (!user) return errorResponse(res, 404, 'User not found');

  if (companyId !== undefined && companyId !== null) {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return errorResponse(res, 400, 'Invalid company ID');
    }
    const company = await Company.findById(companyId);
    if (!company) return errorResponse(res, 404, 'Company not found');
    user.company = company._id;
  } else if (companyId === null) {
    user.company = undefined;
  }

  if (name !== undefined) user.name = String(name).trim();
  if (designation !== undefined) user.designation = String(designation).trim();
  if (phoneNumber !== undefined) user.phoneNumber = String(phoneNumber).trim();
  if (email !== undefined) {
    const newEmail = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
      return errorResponse(res, 400, 'Please provide a valid email');
    }
    if (newEmail !== user.email) {
      const existing = await User.findOne({ email: newEmail });
      if (existing) return errorResponse(res, 400, 'User with this email already exists');
      user.email = newEmail;
    }
  }

  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  return successResponse(res, 200, 'User updated successfully', { user: userObj });
});

export {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
  getUsers,
  searchUsers,
  updateUserCompany,
};
