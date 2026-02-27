import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import reportController from '../controllers/report.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/', reportController.createReport);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

export default router;
