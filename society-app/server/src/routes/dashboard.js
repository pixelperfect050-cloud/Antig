const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Flat = require('../models/Flat');
const Block = require('../models/Block');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Admin dashboard stats
router.get('/stats/:societyId', auth, async (req, res) => {
  try {
    const societyId = req.params.societyId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Total collection (all time)
    const allPayments = await Payment.find({ societyId });
    const totalCollection = allPayments.reduce((sum, p) => sum + p.paidAmount, 0);

    // This month collection
    const monthPayments = await Payment.find({ societyId, month: currentMonth, year: currentYear });
    const monthCollection = monthPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const monthDue = monthPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    // Total expenses
    const allExpenses = await Expense.find({ societyId });
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    // This month expenses
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    const monthExpenses = await Expense.find({
      societyId,
      date: { $gte: monthStart, $lte: monthEnd }
    });
    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Balance
    const currentBalance = totalCollection - totalExpenses;

    // Flat stats
    const totalFlats = await Flat.countDocuments({ societyId });
    const paidFlats = await Flat.countDocuments({ societyId, currentMonthStatus: 'paid' });
    const pendingFlats = await Flat.countDocuments({ societyId, currentMonthStatus: 'pending' });
    const partialFlats = await Flat.countDocuments({ societyId, currentMonthStatus: 'partial' });

    // Members count
    const totalMembers = await User.countDocuments({ societyId, status: 'approved' });
    const pendingMembersCount = await User.countDocuments({ societyId, status: 'pending' });

    // Block count
    const totalBlocks = await Block.countDocuments({ societyId });

    // Monthly collection trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const payments = await Payment.find({ societyId, month: m, year: y });
      const collected = payments.reduce((sum, p) => sum + p.paidAmount, 0);
      const due = payments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
      monthlyTrend.push({
        month: m,
        year: y,
        label: d.toLocaleString('default', { month: 'short' }),
        collected,
        due
      });
    }

    // Expense breakdown by category (current month)
    const expenseBreakdown = await Expense.aggregate([
      {
        $match: {
          societyId: require('mongoose').Types.ObjectId.createFromHexString(societyId),
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      totalCollection,
      totalExpenses,
      currentBalance,
      monthCollection,
      monthDue,
      monthExpenseTotal,
      totalFlats,
      paidFlats,
      pendingFlats,
      partialFlats,
      totalMembers,
      pendingMembersCount,
      totalBlocks,
      monthlyTrend,
      expenseBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Member dashboard stats
router.get('/member-stats', auth, async (req, res) => {
  try {
    if (!req.user.flatId) {
      return res.json({ message: 'No flat assigned', payments: [] });
    }

    const payments = await Payment.find({ flatId: req.user.flatId })
      .sort({ year: -1, month: -1 })
      .limit(12);

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = payments.reduce((sum, p) => sum + Math.max(0, p.amount + p.lateFee - p.paidAmount), 0);

    res.json({ payments, totalPaid, totalDue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
