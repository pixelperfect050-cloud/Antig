const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const dirs = {
  uploads: path.join(__dirname, '../../uploads'),
  delivery: path.join(__dirname, '../../uploads/delivery'),
  quotes: path.join(__dirname, '../../uploads/quotes'),
};
Object.values(dirs).forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dirs.uploads),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const deliveryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dirs.delivery),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const quoteStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dirs.quotes),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const limits = { fileSize: 50 * 1024 * 1024 }; // 50 MB
const quoteLimits = { fileSize: 20 * 1024 * 1024 }; // 20 MB per file for quotes

const upload = multer({ storage, limits });
const deliveryUpload = multer({ storage: deliveryStorage, limits });
const quoteUpload = multer({ storage: quoteStorage, limits: quoteLimits });

module.exports = { upload, deliveryUpload, quoteUpload };
