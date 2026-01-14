const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const calibrationController = require('../controllers/calibration.controller');
const upload = require('../middlewares/upload.middleware'); // multer config

router.use(authenticate);

router.post(
  '/',
  upload.array('files', 10), // up to 10 files, 100MB handled in multer
  calibrationController.createCalibration
);

router.get('/', calibrationController.getCalibrations);
router.get('/:id', calibrationController.getCalibrationById);

router.put(
  '/:id',
  upload.array('files', 10),
  calibrationController.updateCalibration
);

router.delete('/:id', calibrationController.deleteCalibration);

module.exports = router;
