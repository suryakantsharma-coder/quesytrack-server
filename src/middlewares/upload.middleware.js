// multer middleware for image upload
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

/**
 * Optional upload middleware
 * Only processes files if content-type is multipart/form-data
 * Allows JSON-only requests to pass through
 */
const optionalUpload = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    // Check if request is multipart/form-data
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Apply multer middleware for multipart requests
      const middleware = maxCount === 1 
        ? upload.single(fieldName)
        : upload.array(fieldName, maxCount);
      
      middleware(req, res, (err) => {
        if (err) {
          return next(err);
        }
        next();
      });
    } else {
      // Skip multer for non-multipart requests (JSON, etc.)
      next();
    }
  };
};

module.exports = upload;
module.exports.optionalUpload = optionalUpload;