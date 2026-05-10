const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Flat = require('../models/Flat');
const Block = require('../models/Block');
const User = require('../models/User');
const Fund = require('../models/Fund');
const FundPayment = require('../models/FundPayment');
const PaymentRequest = require('../models/PaymentRequest');
const { auth } = require('../middleware/auth');

// Admin dashboard stats
router.get('/stats/:societyId', auth, async (req, res) => {
  try {
    const societyId = req.params.societyId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Total collection (all time) - Maintenance + Funds
    const allPayments = await Payment.find({ societyId });
    const allFundPayments = await FundPayment.find({ societyId, status: 'paid' });
    
    const maintenanceCollection = allPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const fundCollection = allFundPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalCollection = maintenanceCollection + fundCollection;

    // This month collection (Maintenance + Funds)
    const monthPayments = await Payment.find({ societyId, month: currentMonth, year: currentYear });
    
    // Monthly Fund Collections
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    const monthFundPayments = await FundPayment.find({
      societyId,
      status: 'paid',
      updatedAt: { $gte: monthStart, $lte: monthEnd }
    });

    const maintMonthColl = monthPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const fundMonthColl = monthFundPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    
    const monthCollection = maintMonthColl + fundMonthColl;
    const monthDue = monthPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    // Total expenses
    const allExpenses = await Expense.find({ societyId });
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    // This month expenses
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
      
      // Monthly Fund Collections for trend
      const trendMonthStart = new Date(y, m - 1, 1);
      const trendMonthEnd = new Date(y, m, 0);
      const fundPayments = await FundPayment.find({
        societyId,
        status: 'paid',
        updatedAt: { $gte: trendMonthStart, $lte: trendMonthEnd }
      });

      const collected = payments.reduce((sum, p) => sum + p.paidAmount, 0) + 
                        fundPayments.reduce((sum, p) => sum + p.paidAmount, 0);
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

    // Fund stats
    const activeFunds = await Fund.find({ societyId, status: 'active' });
    const totalFundTarget = activeFunds.reduce((s, f) => s + f.totalTarget, 0);
    const totalFundCollected = activeFunds.reduce((s, f) => s + f.totalCollected, 0);

    // Pending payment requests
    const pendingPaymentRequests = await PaymentRequest.countDocuments({
      societyId,
      status: 'pending_verification'
    });

    // Pending fund verifications
    const pendingFundVerifications = await FundPayment.countDocuments({
      societyId,
      status: 'pending_verification'
    });

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
      expenseBreakdown,
      totalFundTarget,
      totalFundCollected,
      totalFundPending: totalFundTarget - totalFundCollected,
      activeFundsCount: activeFunds.length,
      pendingPaymentRequests,
      pendingFundVerifications
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
      .sort({ createdAt: -1 })
      .limit(12);

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = payments.reduce((sum, p) => sum + Math.max(0, p.amount + p.lateFee - p.paidAmount), 0);

    // Fund payments for this member
    const fundPayments = await FundPayment.find({ flatId: req.user.flatId })
      .populate('fundId', 'name category dueDate amountPerFlat status')
      .sort({ createdAt: -1 });

    const totalFundPaid = fundPayments.reduce((s, p) => s + p.paidAmount, 0);
    const totalFundDue = fundPayments.reduce((s, p) => s + Math.max(0, p.amount - p.paidAmount), 0);

    // Pending payment requests
    const pendingRequests = await PaymentRequest.countDocuments({
      submittedBy: req.user._id,
      status: 'pending_verification'
    });

    res.json({ payments, totalPaid, totalDue, fundPayments, totalFundPaid, totalFundDue, pendingRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
