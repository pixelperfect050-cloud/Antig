const mongoose = require('mongoose');

const scratchCouponSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    rewardAmount: { type: Number, default: 0 }, // dollar value (e.g. 0.50, 0.75, 1.00, 2.00)
    isLocked: { type: Boolean, default: true }, // locked until order complete
    isScratched: { type: Boolean, default: false }, // user has revealed the reward
    isUsed: { type: Boolean, default: false }, // coupon applied to an order
    usedOnOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    expiresAt: { type: Date, default: null }, // set when unlocked (7-14 days)
  },
  { timestamps: true }
);

// Indexes for fast queries
scratchCouponSchema.index({ userId: 1, isLocked: 1, isUsed: 1 });
scratchCouponSchema.index({ orderId: 1 }, { unique: true });
scratchCouponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL - auto-delete expired

module.exports = mongoose.model('ScratchCoupon', scratchCouponSchema);
