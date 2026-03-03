import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import gaugeController from '../controllers/gauge.controller.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', upload.single('image'), gaugeController.createGauge);
router.get('/', gaugeController.getGauges);
router.get('/search', gaugeController.searchGauges);
router.get('/:id', gaugeController.getGaugeById);
router.put('/:id/image', upload.single('image'), gaugeController.replaceGaugeImage);
router.put('/:id', upload.single('image'), gaugeController.updateGauge);
router.delete('/:id', gaugeController.deleteGauge);

export default router;
