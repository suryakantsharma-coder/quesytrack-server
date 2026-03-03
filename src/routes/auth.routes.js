import express from 'express';
import { register, login, getMe, updateMe, checkToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { optionalUpload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/register', optionalUpload('image', 1), register);
router.post('/login', login);
router.post('/check-token', checkToken);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, optionalUpload('image', 1), updateMe);

export default router;
