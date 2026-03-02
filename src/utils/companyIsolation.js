import mongoose from 'mongoose';
import { errorResponse } from './apiResponse.js';

/**
 * Ensure the authenticated user has a company assigned. Use before GET/list operations.
 * Returns true if ok, or sends 403 and returns false.
 */
export function requireCompany(req, res) {
  if (!req.user || !req.user.company) {
    errorResponse(res, 403, 'User must be assigned to a company');
    return false;
  }
  return true;
}

/**
 * Add company filter to a filter object so only current user's company data is returned.
 * Call after requireCompany(req, res) === true.
 */
export function addCompanyFilter(filter, req) {
  const companyId = req.user?.company;
  if (companyId) {
    filter.company = companyId;
  }
  return filter;
}

/**
 * Validate MongoDB ObjectId format.
 */
export function isValidObjectId(id) {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

/**
 * Ensure the document belongs to the user's company. Use for getById, update, delete.
 * Returns true if access allowed, or sends 403/404 and returns false.
 * Backward compatibility: if both doc and user have no company, access is allowed.
 */
export function ensureCompanyAccess(req, res, doc) {
  if (!doc) return false;
  const docCompany = doc.company ? doc.company.toString() : null;
  const userCompany = req.user?.company ? req.user.company.toString() : null;
  if (userCompany && docCompany !== userCompany) {
    errorResponse(res, 404, 'Resource not found');
    return false;
  }
  if (userCompany) return true;
  if (!docCompany) return true;
  errorResponse(res, 403, 'User must be assigned to a company');
  return false;
}

/**
 * Strip company from body so clients cannot set or override it.
 */
export function stripCompanyFromBody(body) {
  const { company, companyID, ...rest } = body || {};
  return rest;
}
