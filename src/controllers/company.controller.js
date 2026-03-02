import mongoose from 'mongoose';
import Company, { generateCompanyId } from '../models/company.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Validate MongoDB ObjectId and optionally ensure it matches user's company.
 */
function isValidObjectId(id) {
  return id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

function ensureUserCompany(req, res) {
  if (!req.user || !req.user.company) {
    errorResponse(res, 403, 'User must be assigned to a company');
    return false;
  }
  return true;
}

function ensureCompanyAccess(req, res, companyId) {
  if (!ensureUserCompany(req, res)) return false;
  if (String(req.user.company) !== String(companyId)) {
    errorResponse(res, 403, 'Access denied to this company');
    return false;
  }
  return true;
}

const createCompany = asyncHandler(async (req, res) => {
  const { name, address, website, phoneNumber, email } = req.body;
  if (!name || !address || !phoneNumber || !email) {
    return errorResponse(res, 400, 'Name, address, phone number and email are required');
  }
  const payload = {
    name: name.trim(),
    address: address.trim(),
    website: (website || '').trim(),
    phoneNumber: phoneNumber.trim(),
    email: email.trim().toLowerCase(),
  };
  const companyID = await generateCompanyId();
  const company = await Company.create({ ...payload, companyID });
  return successResponse(res, 201, 'Company created successfully', { company });
});

const getCompanies = asyncHandler(async (req, res) => {
  if (!ensureUserCompany(req, res)) return;
  const filter = { _id: req.user.company };
  const companies = await Company.find(filter);
  return successResponse(res, 200, 'Companies retrieved successfully', { companies });
});

const getCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return errorResponse(res, 400, 'Invalid company ID');
  }
  if (!ensureCompanyAccess(req, res, id)) return;
  const company = await Company.findById(id);
  if (!company) return errorResponse(res, 404, 'Company not found');
  return successResponse(res, 200, 'Company retrieved successfully', { company });
});

const updateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return errorResponse(res, 400, 'Invalid company ID');
  }
  if (!ensureCompanyAccess(req, res, id)) return;
  const company = await Company.findById(id);
  if (!company) return errorResponse(res, 404, 'Company not found');
  const { name, address, website, phoneNumber, email } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (address !== undefined) updates.address = address.trim();
  if (website !== undefined) updates.website = website.trim();
  if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  Object.assign(company, updates);
  await company.save();
  return successResponse(res, 200, 'Company updated successfully', { company });
});

const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return errorResponse(res, 400, 'Invalid company ID');
  }
  if (!ensureCompanyAccess(req, res, id)) return;
  const company = await Company.findById(id);
  if (!company) return errorResponse(res, 404, 'Company not found');
  await company.deleteOne();
  return successResponse(res, 200, 'Company deleted successfully');
});

export default {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
