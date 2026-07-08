const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const limits = { fileSize: 50 * 1024 * 1024 }; // 50 MB
const quoteLimits = { fileSize: 20 * 1024 * 1024 }; // 20 MB per file

let upload, deliveryUpload, quoteUpload;

// Check if Cloudinary is configured
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  console.log('☁️ Using Cloudinary for file uploads');
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const getCloudinaryParams = (folder) => ({
    folder: folder,
    resource_type: 'auto',
    public_id: (req, file) => `${uuidv4()}`,
  });

  upload = multer({ storage: new CloudinaryStorage({ cloudinary, params: getCloudinaryParams('artflow/jobs') }), limits });
  deliveryUpload = multer({ storage: new CloudinaryStorage({ cloudinary, params: getCloudinaryParams('artflow/delivery') }), limits });
  quoteUpload = multer({ storage: new CloudinaryStorage({ cloudinary, params: getCloudinaryParams('artflow/quotes') }), limits: quoteLimits });
} else {
  console.log('⚠️ Cloudinary keys missing. Falling back to local disk storage (Files may be lost on Render restart)');
  
  const dirs = {
    uploads: path.join(__dirname, '../../uploads'),
    delivery: path.join(__dirname, '../../uploads/delivery'),
    quotes: path.join(__dirname, '../../uploads/quotes'),
  };
  Object.values(dirs).forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

  const getDiskStorage = (dest) => multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  });

  upload = multer({ storage: getDiskStorage(dirs.uploads), limits });
  deliveryUpload = multer({ storage: getDiskStorage(dirs.delivery), limits });
  quoteUpload = multer({ storage: getDiskStorage(dirs.quotes), limits: quoteLimits });
}

module.exports = { upload, deliveryUpload, quoteUpload };
