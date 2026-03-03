import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { uploadUserImage, handleMulterError } from '../middlewares/uploadUserImage.js';
import { updateProfile } from '../controllers/user.controller.js';

const router = express.Router();

router.put(
  '/update',
  authenticate,
  (req, res, next) => {
    uploadUserImage(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  updateProfile
);

export default router;
