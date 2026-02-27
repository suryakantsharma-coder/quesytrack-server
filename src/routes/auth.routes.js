import express from 'express';
import { register, login, getMe, checkToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/check-token', checkToken);
router.get('/me', authenticate, getMe);

export default router;
