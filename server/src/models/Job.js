const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    serviceType: {
      type: String,
      required: true,
      enum: ['vector-tracing', 'embroidery-digitizing', 'logo-design', 'image-editing', 'format-conversion', 'other'],
    },
    instructions: { type: String, default: '' },
    files: [
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
      enum: ['pending', 'in-review', 'in-progress', 'revision', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    estimatedDelivery: Date,
    adminNotes: { type: String, default: '' },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
