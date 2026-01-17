const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const gaugeController = require('../controllers/gauge.controller');

// Optional: multer middleware for image upload
const upload = require('../middlewares/upload.middleware');

router.use(authenticate);

router.post('/', upload.single('image'), gaugeController.createGauge);
router.get('/', gaugeController.getGauges);
router.get('/:id', gaugeController.getGaugeById);
router.put('/:id', upload.single('image'), gaugeController.updateGauge);
router.delete('/:id', gaugeController.deleteGauge);

module.exports = router;
