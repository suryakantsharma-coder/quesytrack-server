const express = require('express');
const router = express.Router();
const { register, login, getMe, checkToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * Auth Routes
 * Base path: /api/auth
 */

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/check-token', checkToken);

// Protected route (requires authentication)
router.get('/me', authenticate, getMe);


module.exports = router;
