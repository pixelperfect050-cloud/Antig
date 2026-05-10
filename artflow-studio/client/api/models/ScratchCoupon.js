const mongoose = require('mongoose');
const scratchCouponSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  rewardAmount: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: true },
  isScratched: { type: Boolean, default: false },
  isUsed: { type: Boolean, default: false },
  usedOnOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });
scratchCouponSchema.index({ userId: 1, isLocked: 1, isUsed: 1 });
scratchCouponSchema.index({ orderId: 1 }, { unique: true });
scratchCouponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('ScratchCoupon', scratchCouponSchema);
