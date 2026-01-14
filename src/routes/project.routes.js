const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const projectController = require('../controllers/project.controller');

router.use(authenticate);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
