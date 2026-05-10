const mongoose = require('mongoose');
const quoteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  service: { type: String, required: true },
  description: { type: String, required: true },
  files: [{ filename: String, originalName: String, size: Number, mimetype: String }],
  fileLink: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'quoted', 'accepted', 'rejected'], default: 'pending' },
  adminReply: { type: String, default: '' },
  quotedPrice: { type: Number, default: 0 },
  quotedTurnaround: { type: String, default: '' },
}, { timestamps: true });
module.exports = mongoose.model('Quote', quoteSchema);
