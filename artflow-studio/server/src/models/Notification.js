const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'order_created', 'order_ready', 'order_delivered',
        'payment_success', 'job_status', 'review_request',
        'credits_earned', 'credits_used', 'welcome', 'admin_alert',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra data (amount, credits, etc.)
  },
  { timestamps: true }
);

// Index for fast queries per user, sorted by newest first
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
