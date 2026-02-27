import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

export const optionalUpload = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      const middleware = maxCount === 1 ? upload.single(fieldName) : upload.array(fieldName, maxCount);
      middleware(req, res, (err) => {
        if (err) return next(err);
        next();
      });
    } else {
      next();
    }
  };
};

export default upload;
