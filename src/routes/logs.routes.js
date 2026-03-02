import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import logsController from '../controllers/logs.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', logsController.getLogs);
router.get('/search', logsController.searchLogs);
router.get('/:id', logsController.getLogById);

export default router;
