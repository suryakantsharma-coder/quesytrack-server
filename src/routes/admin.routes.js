import express from 'express';
import {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
  getUsers,
  searchUsers,
  getUnassignedUsersForSuperAdmin,
  updateUserCompany,
  getProjectsByCompanyForSuperAdmin,
  getProjectStatsForSuperAdmin,
  getGaugesByCompanyForSuperAdmin,
  getGaugeStatsForSuperAdmin,
  getCalibrationsByCompanyForSuperAdmin,
  getUpcomingCalibrationsForSuperAdmin,
  getCalibrationStatsForSuperAdmin,
  getReportsByCompanyForSuperAdmin,
  getLogsByCompanyForSuperAdmin,
  getAllCompaniesForSuperAdmin,
  getAllDataForSuperAdmin,
  getDashboardStatsForSuperAdmin,
} from '../controllers/admin.controller.js';
import { protect, adminOnly, adminOrSuperAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/projects/stats', protect, getProjectStatsForSuperAdmin);
router.get('/projects/:companyId', protect, getProjectsByCompanyForSuperAdmin);
router.get('/gauges/stats', protect, getGaugeStatsForSuperAdmin);
router.get('/gauges/:companyId', protect, getGaugesByCompanyForSuperAdmin);
router.get('/calibrations/stats', protect, getCalibrationStatsForSuperAdmin);
router.get('/calibrations/upcoming', protect, getUpcomingCalibrationsForSuperAdmin);
router.get('/calibrations/:companyId', protect, getCalibrationsByCompanyForSuperAdmin);
router.get('/reports/:companyId', protect, getReportsByCompanyForSuperAdmin);
router.get('/logs/:companyId', protect, getLogsByCompanyForSuperAdmin);
router.get('/companies/all', protect, getAllCompaniesForSuperAdmin);
router.get('/all-data', protect, getAllDataForSuperAdmin);
router.get('/dashboard/stats', protect, getDashboardStatsForSuperAdmin);
router.get('/users/unassigned', protect, getUnassignedUsersForSuperAdmin);
router.get('/users/search', protect, adminOnly, searchUsers);
router.get('/users', protect, adminOnly, getUsers);
router.patch('/users/:id', protect, adminOrSuperAdmin, updateUserCompany);
router.get('/sequence-info', protect, adminOnly, getAllSequenceInfo);
router.get('/sequence-info/:type', protect, adminOnly, getModelSequenceInfo);
router.post('/reset-sequence/:type', protect, adminOnly, resetModelSequence);
router.post('/reset-all-sequences', protect, adminOnly, resetAllSequences);

export default router;
