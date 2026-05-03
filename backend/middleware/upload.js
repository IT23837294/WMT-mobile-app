const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const allowedMimeTypesByField = {
  image: ['image/jpeg', 'image/jpg', 'image/png'],
  prescription: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  depositReceipt: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
};

const allowedExtensionsByField = {
  image: ['.jpeg', '.jpg', '.png'],
  prescription: ['.jpeg', '.jpg', '.png', '.pdf'],
  depositReceipt: ['.jpeg', '.jpg', '.png', '.pdf']
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDirectory, { recursive: true });
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'image' ? 'medicine' : 'prescription';
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = allowedMimeTypesByField[file.fieldname] || ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const allowedExtensions = allowedExtensionsByField[file.fieldname] || ['.jpeg', '.jpg', '.png', '.pdf'];
  const extension = path.extname(file.originalname).toLowerCase();
  const isValidExtension = allowedExtensions.includes(extension);
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);

  if (isValidExtension && isValidMimeType) {
    return cb(null, true);
  }

  if (file.fieldname === 'image') {
    return cb(new Error('Only JPG and PNG medicine images are allowed'));
  }

  cb(new Error('Only JPG, PNG, and PDF files are allowed'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter: fileFilter
});

module.exports = upload;
