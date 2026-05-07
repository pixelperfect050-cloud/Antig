const {
  scratchCoupon,
  redeemCoupon,
  getUserCoupons,
} = require('../services/scratchService');

// GET /api/scratch — Get all scratch coupons for the user
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await getUserCoupons(req.user._id);
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/scratch/:id/scratch — Reveal a scratch coupon
exports.scratch = async (req, res) => {
  try {
    const result = await scratchCoupon(req.params.id, req.user._id);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, coupon: result.coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/scratch/:id/redeem — Redeem a scratch coupon on an order
exports.redeem = async (req, res) => {
  try {
    const { orderId, orderAmount, existingCoinDiscount } = req.body;
    const result = await redeemCoupon(
      req.params.id,
      req.user._id,
      orderId,
      orderAmount,
      existingCoinDiscount || 0
    );
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      coupon: result.coupon,
      discount: result.discount,
      message: `Applied $${result.discount.toFixed(2)} coupon discount.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
