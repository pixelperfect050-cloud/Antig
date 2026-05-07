const User = require('../models/User');
const { CREDIT_RULES, validateRedemption, deductCredits } = require('../services/creditService');

// GET /api/credits — Get user's credit balance, rules, and expiry
exports.getCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('credits totalCreditsEarned creditsExpiresAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Check if coins have expired
    if (user.creditsExpiresAt && new Date() > user.creditsExpiresAt) {
      user.credits = 0;
      user.creditsExpiresAt = null;
      await user.save();
    }

    res.json({
      success: true,
      credits: user.credits,
      totalCreditsEarned: user.totalCreditsEarned,
      creditsExpiresAt: user.creditsExpiresAt,
      coinValue: CREDIT_RULES.coin_value,
      rules: {
        minOrderToRedeem: CREDIT_RULES.min_order_to_redeem,
        maxRedeemPercent: CREDIT_RULES.max_redeem_percent,
        expiryDays: CREDIT_RULES.expiry_days,
        signupBonus: CREDIT_RULES.signup,
        perSpendThreshold: CREDIT_RULES.per_spend_threshold,
        perSpendReward: CREDIT_RULES.per_spend_reward,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/credits/redeem — Redeem coins on an order
exports.redeemCredits = async (req, res) => {
  try {
    const { coins, orderAmount } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Check expiry
    if (user.creditsExpiresAt && new Date() > user.creditsExpiresAt) {
      user.credits = 0;
      user.creditsExpiresAt = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'Your coins have expired.' });
    }

    const validation = validateRedemption(user.credits, orderAmount, coins);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
        maxRedeemable: validation.maxRedeemable,
      });
    }

    const dollarDiscount = coins * CREDIT_RULES.coin_value;
    const updatedUser = await deductCredits(user._id, coins, 'order_discount');

    if (!updatedUser) {
      return res.status(400).json({ success: false, message: 'Failed to redeem coins.' });
    }

    res.json({
      success: true,
      coinsUsed: coins,
      dollarDiscount,
      newBalance: updatedUser.credits,
      message: `Applied ${coins} coins for $${dollarDiscount.toFixed(2)} discount.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
