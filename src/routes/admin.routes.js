import express from 'express';
import {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
  getUsers,
  searchUsers,
  updateUserCompany,
} from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/users/search', protect, adminOnly, searchUsers);
router.get('/users', protect, adminOnly, getUsers);
router.patch('/users/:id', protect, adminOnly, updateUserCompany);
router.get('/sequence-info', protect, adminOnly, getAllSequenceInfo);
router.get('/sequence-info/:type', protect, adminOnly, getModelSequenceInfo);
router.post('/reset-sequence/:type', protect, adminOnly, resetModelSequence);
router.post('/reset-all-sequences', protect, adminOnly, resetAllSequences);

export default router;
