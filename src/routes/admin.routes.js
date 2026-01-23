const express = require('express');
const router = express.Router();
const {
  resetModelSequence,
  getModelSequenceInfo,
  getAllSequenceInfo,
  resetAllSequences,
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

/**
 * Admin Routes
 * All routes require authentication and admin role
 */

// Get sequence info for all models
router.get('/sequence-info', protect, adminOnly, getAllSequenceInfo);

// Get sequence info for specific model type
router.get('/sequence-info/:type', protect, adminOnly, getModelSequenceInfo);

// Reset sequence for specific model type
router.post('/reset-sequence/:type', protect, adminOnly, resetModelSequence);

// Reset sequences for all models
router.post('/reset-all-sequences', protect, adminOnly, resetAllSequences);

module.exports = router;
