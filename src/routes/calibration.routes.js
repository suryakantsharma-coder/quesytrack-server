import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import calibrationController from '../controllers/calibration.controller.js';
import { optionalUpload } from '../middlewares/upload.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', optionalUpload('files', 10), calibrationController.createCalibration);
router.get('/', calibrationController.getCalibrations);
router.get('/:id', calibrationController.getCalibrationById);
router.put('/:id', optionalUpload('files', 10), calibrationController.updateCalibration);
router.delete('/:id', calibrationController.deleteCalibration);

export default router;
