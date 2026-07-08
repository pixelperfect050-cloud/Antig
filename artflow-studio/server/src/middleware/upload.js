const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getCloudinaryParams = (folder) => ({
  folder: folder,
  resource_type: 'auto', // Important for non-image files like PDFs, zips
  public_id: (req, file) => {
    const ext = path.extname(file.originalname);
    return `${uuidv4()}`; // Cloudinary adds the extension for images usually, or we can leave it to auto
  },
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: getCloudinaryParams('artflow/jobs'),
});

const deliveryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: getCloudinaryParams('artflow/delivery'),
});

const quoteStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: getCloudinaryParams('artflow/quotes'),
});

const limits = { fileSize: 50 * 1024 * 1024 }; // 50 MB
const quoteLimits = { fileSize: 20 * 1024 * 1024 }; // 20 MB per file for quotes

const upload = multer({ storage, limits });
const deliveryUpload = multer({ storage: deliveryStorage, limits });
const quoteUpload = multer({ storage: quoteStorage, limits: quoteLimits });

module.exports = { upload, deliveryUpload, quoteUpload };
