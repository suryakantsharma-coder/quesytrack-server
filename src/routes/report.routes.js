const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const reportController = require('../controllers/report.controller');

router.use(authenticate);

router.post('/', reportController.createReport);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
