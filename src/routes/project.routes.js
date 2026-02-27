import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import projectController from '../controllers/project.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
