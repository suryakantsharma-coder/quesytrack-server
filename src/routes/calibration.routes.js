const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const calibrationController = require('../controllers/calibration.controller');
const { optionalUpload } = require('../middlewares/upload.middleware'); // multer config

router.use(authenticate);

router.post(
  '/',
  optionalUpload('files', 10), // up to 10 files, optional - allows JSON-only requests
  calibrationController.createCalibration
);

router.get('/', calibrationController.getCalibrations);
router.get('/:id', calibrationController.getCalibrationById);

router.put(
  '/:id',
  optionalUpload('files', 10), // up to 10 files, optional - allows JSON-only requests
  calibrationController.updateCalibration
);

router.delete('/:id', calibrationController.deleteCalibration);

module.exports = router;
