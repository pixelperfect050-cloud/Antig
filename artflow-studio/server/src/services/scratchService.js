const ScratchCoupon = require('../models/ScratchCoupon');
const { notify } = require('./notificationService');

// Reward distribution (weighted random)
// $0.50 → 50%, $0.75 → 35%, $1.00 → 14%, $2.00 → 1%
const REWARD_TIERS = [
  { amount: 0.50, weight: 50 },
  { amount: 0.75, weight: 35 },
  { amount: 1.00, weight: 14 },
  { amount: 2.00, weight: 1 },
];

const MIN_ORDER_FOR_SCRATCH = 10; // $10 minimum order

/**
 * Pick a random reward based on weighted distribution.
 */
function _pickReward() {
  const totalWeight = REWARD_TIERS.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;
  for (const tier of REWARD_TIERS) {
    random -= tier.weight;
    if (random <= 0) return tier.amount;
  }
  return REWARD_TIERS[0].amount; // fallback
}

/**
 * Create a LOCKED scratch coupon when an order is placed.
 * Only for orders >= $10.
 */
async function createLockedCoupon(userId, orderId, orderAmount) {
  try {
    if (orderAmount < MIN_ORDER_FOR_SCRATCH) return null;

    // Check if coupon already exists for this order
    const existing = await ScratchCoupon.findOne({ orderId });
    if (existing) return existing;

    const coupon = await ScratchCoupon.create({
      userId,
      orderId,
      rewardAmount: 0, // determined on unlock
      isLocked: true,
      isScratched: false,
      isUsed: false,
    });

    // Notify user about locked reward
    await notify({
      userId,
      type: 'order_created',
      title: '🎁 Reward Locked!',
      message: 'A scratch coupon has been generated for your order. Complete your order to unlock it!',
      link: '/rewards',
      meta: { couponId: coupon._id, orderId },
    });

    return coupon;
  } catch (err) {
    console.error('❌ Scratch coupon create error:', err.message);
    return null;
  }
}

/**
 * Unlock a scratch coupon when order is completed.
 * Assigns random reward amount and sets expiry (7-14 days).
 */
async function unlockCoupon(orderId) {
  try {
    const coupon = await ScratchCoupon.findOne({ orderId, isLocked: true });
    if (!coupon) return null;

    const rewardAmount = _pickReward();
    const daysUntilExpiry = 7 + Math.floor(Math.random() * 8); // 7-14 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);

    coupon.rewardAmount = rewardAmount;
    coupon.isLocked = false;
    coupon.expiresAt = expiresAt;
    await coupon.save();

    // Notify user about unlocked reward
    await notify({
      userId: coupon.userId,
      type: 'order_delivered',
      title: '🔓 Reward Unlocked!',
      message: `Your scratch coupon is ready! Scratch it to reveal your reward. Expires in ${daysUntilExpiry} days.`,
      link: '/rewards',
      meta: { couponId: coupon._id, orderId },
    });

    return coupon;
  } catch (err) {
    console.error('❌ Scratch coupon unlock error:', err.message);
    return null;
  }
}

/**
 * Scratch (reveal) a coupon. User sees the reward amount.
 */
async function scratchCoupon(couponId, userId) {
  try {
    const coupon = await ScratchCoupon.findOne({
      _id: couponId,
      userId,
      isLocked: false,
      isScratched: false,
    });

    if (!coupon) return { error: 'Coupon not found or already scratched.' };

    // Check expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { error: 'This coupon has expired.' };
    }

    coupon.isScratched = true;
    await coupon.save();

    // Notify user about won reward
    await notify({
      userId,
      type: 'credits_earned',
      title: `🎉 You won $${coupon.rewardAmount.toFixed(2)}!`,
      message: `You revealed a $${coupon.rewardAmount.toFixed(2)} discount coupon! Apply it to your next order.`,
      link: '/rewards',
      meta: { couponId: coupon._id, amount: coupon.rewardAmount },
    });

    return { coupon };
  } catch (err) {
    console.error('❌ Scratch reveal error:', err.message);
    return { error: 'Failed to scratch coupon.' };
  }
}

/**
 * Redeem a scratch coupon on an order.
 * Global safety: total discount (coins + coupon) ≤ 15% of order value.
 */
async function redeemCoupon(couponId, userId, orderId, orderAmount, existingCoinDiscount = 0) {
  try {
    const coupon = await ScratchCoupon.findOne({
      _id: couponId,
      userId,
      isLocked: false,
      isScratched: true,
      isUsed: false,
    });

    if (!coupon) return { error: 'Coupon not found, not scratched, or already used.' };

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { error: 'This coupon has expired.' };
    }

    // Global safety rule: total discount ≤ 15% of order
    const maxTotalDiscount = orderAmount * 0.15;
    const totalDiscountWithCoupon = existingCoinDiscount + coupon.rewardAmount;
    if (totalDiscountWithCoupon > maxTotalDiscount) {
      return { error: `Total discount cannot exceed 15% of order value ($${maxTotalDiscount.toFixed(2)}). Current coin discount: $${existingCoinDiscount.toFixed(2)}.` };
    }

    coupon.isUsed = true;
    coupon.usedOnOrder = orderId;
    await coupon.save();

    return { coupon, discount: coupon.rewardAmount };
  } catch (err) {
    console.error('❌ Coupon redeem error:', err.message);
    return { error: 'Failed to redeem coupon.' };
  }
}

/**
 * Get all coupons for a user.
 */
async function getUserCoupons(userId) {
  return ScratchCoupon.find({ userId })
    .sort({ createdAt: -1 })
    .populate('orderId', 'status amount')
    .lean();
}

module.exports = {
  MIN_ORDER_FOR_SCRATCH,
  REWARD_TIERS,
  createLockedCoupon,
  unlockCoupon,
  scratchCoupon,
  redeemCoupon,
  getUserCoupons,
};
