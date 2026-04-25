const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryFiles: [
      {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['processing', 'ready', 'delivered', 'archived'],
      default: 'processing',
    },
    deliveryNotes: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
