const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Flat = require('../models/Flat');
const { auth, adminOnly } = require('../middleware/auth');

// Monthly report
router.get('/monthly/:societyId', auth, async (req, res) => {
  try {
    // Auto-run monthly status reset check
    try {
      const { checkAndResetMonthlyStatuses } = require('../services/monthlyResetService');
      await checkAndResetMonthlyStatuses();
    } catch (resetErr) {
      console.error('[Report] Monthly reset check failed:', resetErr.message);
    }

    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const payments = await Payment.find({
      societyId: req.params.societyId,
      month: m,
      year: y
    }).populate('flatId', 'number ownerName blockId');

    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0);
    const expenses = await Expense.find({
      societyId: req.params.societyId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = payments.reduce((sum, p) => sum + Math.max(0, p.amount - p.paidAmount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      month: m,
      year: y,
      payments,
      expenses,
      summary: {
        totalCollected,
        totalDue,
        totalExpenses,
        netBalance: totalCollected - totalExpenses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Flat-wise report
router.get('/flat-wise/:societyId', auth, async (req, res) => {
  try {
    const flats = await Flat.find({ societyId: req.params.societyId }).populate('blockId', 'name');

    const flatReports = await Promise.all(
      flats.map(async (flat) => {
        const payments = await Payment.find({ flatId: flat._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
        const totalDue = payments.reduce((sum, p) => sum + Math.max(0, p.amount + p.lateFee - p.paidAmount), 0);

        return {
          flatNumber: flat.number,
          blockName: flat.blockId?.name || '',
          ownerName: flat.ownerName,
          phone: flat.ownerPhone,
          totalPaid,
          totalDue,
          currentStatus: flat.currentMonthStatus
        };
      })
    );

    res.json(flatReports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
