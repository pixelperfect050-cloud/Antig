const { connectDB } = require('../../db');
const User = require('../../models/User');

const CREDIT_RULES = { signup: 50, per_spend_threshold: 10, per_spend_reward: 100, coin_value: 0.01, min_order_to_redeem: 10, max_redeem_percent: 15, expiry_days: 180 };

module.exports = async function handler(req, res) {
  await connectDB();
  const { method, url } = req;
  const authModule = await import('../../middleware/auth.js');

  const wrapAuth = (mw, fn) => new Promise((resolve) => { mw(req, res, () => { fn().then(resolve).catch((e) => { res.status(500).json({ success: false, message: e.message }); resolve(); }); }); });

  if (method === 'GET') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const user = await User.findById(req.user._id).select('credits totalCreditsEarned creditsExpiresAt');
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      if (user.creditsExpiresAt && new Date() > user.creditsExpiresAt) {
        user.credits = 0; user.creditsExpiresAt = null; await user.save();
      }
      return res.json({ success: true, credits: user.credits, totalCreditsEarned: user.totalCreditsEarned, creditsExpiresAt: user.creditsExpiresAt, coinValue: CREDIT_RULES.coin_value, rules: { minOrderToRedeem: CREDIT_RULES.min_order_to_redeem, maxRedeemPercent: CREDIT_RULES.max_redeem_percent, expiryDays: CREDIT_RULES.expiry_days, signupBonus: CREDIT_RULES.signup } });
    });
  }

  if (method === 'POST') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const { coins, orderAmount } = req.body;
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      if (user.creditsExpiresAt && new Date() > user.creditsExpiresAt) { user.credits = 0; user.creditsExpiresAt = null; await user.save(); return res.status(400).json({ success: false, message: 'Your coins have expired.' }); }
      if (orderAmount < CREDIT_RULES.min_order_to_redeem) return res.status(400).json({ success: false, message: `Order must be at least $${CREDIT_RULES.min_order_to_redeem}.` });
      const maxDollarDiscount = orderAmount * (CREDIT_RULES.max_redeem_percent / 100);
      const maxCoins = Math.floor(maxDollarDiscount / CREDIT_RULES.coin_value);
      const maxRedeemable = Math.min(maxCoins, user.credits);
      if (coins > maxRedeemable) return res.status(400).json({ success: false, message: `Max redeemable: ${maxRedeemable} coins.`, maxRedeemable });
      if (coins > user.credits) return res.status(400).json({ success: false, message: 'Insufficient coin balance.' });
      user.credits -= coins;
      await user.save();
      return res.json({ success: true, coinsUsed: coins, dollarDiscount: coins * CREDIT_RULES.coin_value, newBalance: user.credits });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
