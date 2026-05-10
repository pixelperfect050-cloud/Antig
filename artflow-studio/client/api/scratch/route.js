const { connectDB } = require('../../db');
const ScratchCoupon = require('../../models/ScratchCoupon');

module.exports = async function handler(req, res) {
  await connectDB();
  const { method, url } = req;
  const authModule = await import('../../middleware/auth.js');

  const wrapAuth = (mw, fn) => new Promise((resolve) => { mw(req, res, () => { fn().then(resolve).catch((e) => { res.status(500).json({ success: false, message: e.message }); resolve(); }); }); });

  if (method === 'GET') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const coupons = await ScratchCoupon.find({ userId: req.user._id }).sort({ createdAt: -1 }).populate('orderId', 'status amount').lean();
      return res.json({ success: true, coupons });
    });
  }

  if (method === 'POST' && url?.match(/\/\w+\/scratch$/)) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const coupon = await ScratchCoupon.findOne({ _id: id, userId: req.user._id, isLocked: false, isScratched: false });
      if (!coupon) return res.status(400).json({ success: false, message: 'Coupon not found or already scratched.' });
      if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ success: false, message: 'This coupon has expired.' });
      coupon.isScratched = true;
      await coupon.save();
      return res.json({ success: true, coupon });
    });
  }

  if (method === 'POST' && url?.match(/\/\w+\/redeem$/)) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const { orderId, orderAmount, existingCoinDiscount } = req.body;
      const coupon = await ScratchCoupon.findOne({ _id: id, userId: req.user._id, isLocked: false, isScratched: true, isUsed: false });
      if (!coupon) return res.status(400).json({ success: false, message: 'Coupon not found, not scratched, or already used.' });
      if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ success: false, message: 'This coupon has expired.' });
      const maxTotalDiscount = orderAmount * 0.15;
      if ((existingCoinDiscount || 0) + coupon.rewardAmount > maxTotalDiscount) return res.status(400).json({ success: false, message: 'Total discount cannot exceed 15% of order value.' });
      coupon.isUsed = true;
      coupon.usedOnOrder = orderId;
      await coupon.save();
      return res.json({ success: true, coupon, discount: coupon.rewardAmount });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
