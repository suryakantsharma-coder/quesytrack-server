import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { errorResponse } from '../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const uploadsUsersDir = path.join(__dirname, '..', '..', 'uploads', 'users');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadsUsersDir)) {
      fs.mkdirSync(uploadsUsersDir, { recursive: true });
    }
    cb(null, uploadsUsersDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user && req.user._id ? req.user._id.toString() : 'anon';
    const name = `${userId}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only jpg, jpeg, png, webp are allowed.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

export const uploadUserImage = upload.single('image');

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 400, 'File too large. Maximum size is 5MB.');
    }
    return errorResponse(res, 400, err.message || 'Upload error');
  }
  if (err) {
    return errorResponse(res, 400, err.message || 'Invalid upload');
  }
  next();
};

export default uploadUserImage;
