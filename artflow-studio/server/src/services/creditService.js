const User = require('../models/User');
const { notify } = require('./notificationService');

// ─── UPDATED CREDIT RULES ───
// 1 coin = $0.01
// Signup → 50 coins ($0.50)
// Every $10 spend → 100 coins ($1.00)
// Usage: min order $10, max redeem 15% of order value
// Expiry: 180 days (rolling)

const CREDIT_RULES = {
  signup: 50,                    // 50 coins = $0.50
  per_spend_threshold: 10,       // every $10 spent
  per_spend_reward: 100,         // earns 100 coins
  coin_value: 0.01,              // 1 coin = $0.01
  min_order_to_redeem: 10,       // min $10 order to use coins
  max_redeem_percent: 15,        // max 15% of order value
  expiry_days: 180,              // coins expire in 180 days
};

/**
 * Award credits to a user.
 */
async function awardCredits(userId, amount, reason, meta = {}) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CREDIT_RULES.expiry_days);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: amount, totalCreditsEarned: amount },
        $set: { creditsExpiresAt: expiresAt }, // rolling expiry
      },
      { new: true }
    ).select('-password');

    if (!user) return null;

    await notify({
      userId,
      type: 'credits_earned',
      title: `🪙 You earned ${amount} coins!`,
      message: _creditMessage(amount, reason),
      link: '/rewards',
      meta: { amount, reason, newBalance: user.credits, ...meta },
    });

    return user;
  } catch (err) {
    console.error('❌ Credit award error:', err.message);
    return null;
  }
}

/**
 * Deduct credits from a user. Returns null if insufficient or invalid.
 */
async function deductCredits(userId, amount, reason = 'payment') {
  try {
    const user = await User.findById(userId);
    if (!user || user.credits < amount) return null;

    // Check if coins have expired
    if (user.creditsExpiresAt && new Date() > user.creditsExpiresAt) {
      user.credits = 0;
      user.creditsExpiresAt = null;
      await user.save();
      return null;
    }

    user.credits -= amount;
    await user.save();

    await notify({
      userId,
      type: 'credits_used',
      title: `🪙 ${amount} coins used`,
      message: `You used ${amount} coins for ${reason}. Remaining balance: ${user.credits} coins.`,
      link: '/rewards',
      meta: { amount, reason, newBalance: user.credits },
    });

    return user;
  } catch (err) {
    console.error('❌ Credit deduct error:', err.message);
    return null;
  }
}

/**
 * Award signup bonus — 50 coins ($0.50).
 */
async function awardSignupBonus(userId) {
  return awardCredits(userId, CREDIT_RULES.signup, 'signup');
}

/**
 * Award spend-based coins. For every $10 spent, award 100 coins.
 */
async function awardSpendCoins(userId, paymentAmount) {
  const multiplier = Math.floor(paymentAmount / CREDIT_RULES.per_spend_threshold);
  if (multiplier <= 0) return null;
  const coins = multiplier * CREDIT_RULES.per_spend_reward;
  return awardCredits(userId, coins, 'spend', { paymentAmount, multiplier });
}

/**
 * Validate a coin redemption request.
 * Returns { valid, maxRedeemable, error }
 */
function validateRedemption(userCredits, orderAmount, requestedAmount) {
  if (orderAmount < CREDIT_RULES.min_order_to_redeem) {
    return { valid: false, maxRedeemable: 0, error: `Order must be at least $${CREDIT_RULES.min_order_to_redeem} to use coins.` };
  }

  // Max redeemable: 15% of order value, converted to coins
  const maxDollarDiscount = orderAmount * (CREDIT_RULES.max_redeem_percent / 100);
  const maxCoins = Math.floor(maxDollarDiscount / CREDIT_RULES.coin_value);
  const maxRedeemable = Math.min(maxCoins, userCredits);

  if (requestedAmount > maxRedeemable) {
    return { valid: false, maxRedeemable, error: `Max redeemable: ${maxRedeemable} coins ($${(maxRedeemable * CREDIT_RULES.coin_value).toFixed(2)}).` };
  }

  if (requestedAmount > userCredits) {
    return { valid: false, maxRedeemable, error: 'Insufficient coin balance.' };
  }

  return { valid: true, maxRedeemable, error: null };
}

function _creditMessage(amount, reason) {
  switch (reason) {
    case 'signup':
      return `Welcome to ArtFlow! You received ${amount} bonus coins ($${(amount * CREDIT_RULES.coin_value).toFixed(2)}) for signing up. Use them on your next order!`;
    case 'spend':
      return `You earned ${amount} coins ($${(amount * CREDIT_RULES.coin_value).toFixed(2)}) for your recent purchase. Keep ordering to earn more!`;
    default:
      return `${amount} coins ($${(amount * CREDIT_RULES.coin_value).toFixed(2)}) have been added to your wallet.`;
  }
}

module.exports = {
  CREDIT_RULES,
  awardCredits,
  deductCredits,
  awardSignupBonus,
  awardSpendCoins,
  validateRedemption,
};
