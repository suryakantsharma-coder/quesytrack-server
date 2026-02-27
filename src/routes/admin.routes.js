import express from 'express';
import {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
} from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/sequence-info', protect, adminOnly, getAllSequenceInfo);
router.get('/sequence-info/:type', protect, adminOnly, getModelSequenceInfo);
router.post('/reset-sequence/:type', protect, adminOnly, resetModelSequence);
router.post('/reset-all-sequences', protect, adminOnly, resetAllSequences);

export default router;
