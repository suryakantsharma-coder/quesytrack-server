import express from 'express';
import {
  gaugesGraph,
  calibrationsGraph,
  projectsGraph,
  systemGraph,
} from '../controllers/dashboard.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/gauges', protect, gaugesGraph);
router.get('/calibrations', protect, calibrationsGraph);
router.get('/projects', protect, projectsGraph);
router.get('/system', protect, systemGraph);

export default router;
