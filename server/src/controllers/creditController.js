const User = require('../models/User');
const { deductCredits } = require('../services/creditService');

// GET /api/credits — get current user's credit balance
exports.getCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('credits totalCreditsEarned');
    res.json({
      success: true,
      credits: user.credits,
      totalCreditsEarned: user.totalCreditsEarned,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/credits/use — deduct credits for an order discount
exports.useCredits = async (req, res) => {
  try {
    const { amount, reason, orderId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid credit amount.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.credits < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient credits.', available: user.credits });
    }

    // If orderId provided, apply discount to the order
    let order = null;
    if (orderId) {
      const Order = require('../models/Order');
      order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      if (order.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'Cannot apply credits to a paid order.' });

      // Calculate new amount (1 coin = ₹1)
      const discount = Math.min(amount, order.amount);
      order.discountAmount += discount;
      order.amount -= discount;
      if (order.amount === 0) order.paymentStatus = 'paid';
      await order.save();
    }

    const updated = await deductCredits(req.user._id, amount, reason || 'order_discount');
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Failed to deduct credits.' });
    }

    res.json({
      success: true,
      message: `${amount} credits applied successfully!`,
      credits: updated.credits,
      totalCreditsEarned: updated.totalCreditsEarned,
      order: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
