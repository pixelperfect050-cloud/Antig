const express = require('express');
const router = express.Router();
const Fund = require('../models/Fund');
const FundPayment = require('../models/FundPayment');
const Flat = require('../models/Flat');
const Block = require('../models/Block');
const { auth, adminOnly } = require('../middleware/auth');
const { notifyAllUsers, notifyFlatOwner, notifyAdmins } = require('../utils/notificationHelper');
const { emitToSociety } = require('../services/socketService');

// Create a new fund (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, category, amountPerFlat, dueDate, applicableTo, applicableBlocks } = req.body;
    const societyId = req.user.societyId?._id || req.user.societyId;

    // Calculate total target
    let flatsQuery = { societyId };
    if (applicableTo === 'specific_blocks' && applicableBlocks?.length > 0) {
      flatsQuery.blockId = { $in: applicableBlocks };
    }
    const applicableFlats = await Flat.find(flatsQuery);
    const totalTarget = applicableFlats.length * amountPerFlat;

    const fund = new Fund({
      societyId,
      name, description,
      category: category || 'other',
      amountPerFlat: parseFloat(amountPerFlat),
      totalTarget,
      dueDate,
      applicableTo: applicableTo || 'all',
      applicableBlocks: applicableBlocks || [],
      createdBy: req.user._id
    });

    await fund.save();

    // Create individual fund payment entries for each applicable flat
    const fundPayments = applicableFlats.map(flat => ({
      fundId: fund._id,
      flatId: flat._id,
      societyId,
      amount: amountPerFlat,
      paidAmount: 0,
      status: 'pending'
    }));

    if (fundPayments.length > 0) {
      await FundPayment.insertMany(fundPayments);
    }

    // Notify everyone
    await notifyAllUsers({
      societyId,
      title: '📢 New Fund Created',
      message: `"${name}" fund of ₹${amountPerFlat}/flat has been created. Due by ${new Date(dueDate).toLocaleDateString('en-IN')}.`,
      type: 'info'
    });

    emitToSociety(societyId.toString(), 'fund_created', {
      fund,
      message: `New fund: ${name}`
    });

    res.status(201).json(fund);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all funds for a society
router.get('/society/:societyId', auth, async (req, res) => {
  try {
    const funds = await Fund.find({ societyId: req.params.societyId })
      .sort({ createdAt: -1 });

    // Add collection stats for each fund
    const fundsWithStats = await Promise.all(funds.map(async (fund) => {
      const payments = await FundPayment.find({ fundId: fund._id });
      const collected = payments.reduce((s, p) => s + p.paidAmount, 0);
      const paidCount = payments.filter(p => p.status === 'paid').length;
      const pendingCount = payments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length;

      return {
        ...fund.toJSON(),
        totalCollected: collected,
        paidCount,
        pendingCount,
        totalFlats: payments.length
      };
    }));

    res.json(fundsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get member's fund payments
router.get('/my-payments', auth, async (req, res) => {
  try {
    if (!req.user.flatId) {
      return res.json([]);
    }
    const payments = await FundPayment.find({ flatId: req.user.flatId })
      .populate('fundId', 'name category dueDate amountPerFlat status')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dashboard stats for funds
router.get('/stats/:societyId', auth, async (req, res) => {
  try {
    const funds = await Fund.find({ societyId: req.params.societyId, status: 'active' });
    const totalFundTarget = funds.reduce((s, f) => s + f.totalTarget, 0);
    const totalFundCollected = funds.reduce((s, f) => s + f.totalCollected, 0);
    const activeFunds = funds.length;

    const pendingVerification = await FundPayment.countDocuments({
      societyId: req.params.societyId,
      status: 'pending_verification'
    });

    res.json({
      totalFundTarget,
      totalFundCollected,
      totalFundPending: totalFundTarget - totalFundCollected,
      activeFunds,
      pendingVerification
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get fund detail with all flat payments
router.get('/:id', auth, async (req, res) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) return res.status(404).json({ message: 'Fund not found' });

    const payments = await FundPayment.find({ fundId: fund._id })
      .populate('flatId', 'number ownerName blockId')
      .populate('submittedBy', 'name')
      .sort({ status: 1 });

    const collected = payments.reduce((s, p) => s + p.paidAmount, 0);

    res.json({ fund, payments, totalCollected: collected });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Member submits fund payment
router.post('/:fundId/pay', auth, async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, screenshotUrl, notes } = req.body;

    if (!req.user.flatId) {
      return res.status(400).json({ message: 'No flat assigned' });
    }

    const fundPayment = await FundPayment.findOne({
      fundId: req.params.fundId,
      flatId: req.user.flatId
    });

    if (!fundPayment) {
      return res.status(404).json({ message: 'Fund payment record not found for your flat' });
    }

    if (fundPayment.status === 'paid') {
      return res.status(400).json({ message: 'Fund already fully paid' });
    }

    if (fundPayment.status === 'pending_verification') {
      return res.status(400).json({ message: 'Previous payment is pending verification' });
    }

    fundPayment.paidAmount = parseFloat(amount);
    fundPayment.paymentMethod = paymentMethod;
    fundPayment.transactionId = transactionId || '';
    fundPayment.screenshotUrl = screenshotUrl || '';
    fundPayment.notes = notes || '';
    fundPayment.submittedBy = req.user._id;
    fundPayment.status = 'pending_verification';

    await fundPayment.save();

    const fund = await Fund.findById(req.params.fundId);
    const flat = await Flat.findById(req.user.flatId);
    const societyId = (req.user.societyId?._id || req.user.societyId).toString();

    await notifyAdmins({
      societyId,
      title: '📢 Fund Payment Submitted',
      message: `${req.user.name} (Flat ${flat?.number}) submitted ₹${amount} for "${fund?.name}" fund. Please verify.`,
      type: 'payment_reminder'
    });

    emitToSociety(societyId, 'fund_payment_submitted', {
      fundPayment,
      message: `Fund payment submitted by Flat ${flat?.number}`
    });

    res.json(fundPayment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin approve/reject fund payment
router.put('/payment/:id/review', auth, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['paid', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use paid or rejected' });
    }

    const fp = await FundPayment.findById(req.params.id);
    if (!fp) return res.status(404).json({ message: 'Fund payment not found' });

    const societyId = fp.societyId.toString();

    if (status === 'paid') {
      fp.status = 'paid';
      fp.paidDate = new Date();
      fp.reviewedBy = req.user._id;
      fp.adminNotes = adminNotes || '';
      await fp.save();

      // Update fund total collected
      const allPaid = await FundPayment.find({ fundId: fp.fundId, status: 'paid' });
      const totalCollected = allPaid.reduce((s, p) => s + p.paidAmount, 0);
      await Fund.findByIdAndUpdate(fp.fundId, { totalCollected });

      const fund = await Fund.findById(fp.fundId);
      await notifyFlatOwner({
        flatId: fp.flatId,
        societyId: fp.societyId,
        title: '✅ Fund Payment Approved',
        message: `Your payment of ₹${fp.paidAmount} for "${fund?.name}" fund has been approved.`,
        type: 'success'
      });

      emitToSociety(societyId, 'fund_payment_approved', { fundPaymentId: fp._id });
    } else {
      fp.status = 'pending';
      fp.paidAmount = 0;
      fp.adminNotes = adminNotes || '';
      fp.reviewedBy = req.user._id;
      await fp.save();

      const fund = await Fund.findById(fp.fundId);
      await notifyFlatOwner({
        flatId: fp.flatId,
        societyId: fp.societyId,
        title: '❌ Fund Payment Rejected',
        message: `Your payment for "${fund?.name}" fund was rejected. ${adminNotes || 'Please re-submit.'}`,
        type: 'payment_reminder'
      });

      emitToSociety(societyId, 'fund_payment_rejected', { fundPaymentId: fp._id });
    }

    res.json(fp);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin manually record fund payment
router.put('/payment/:id/manual', auth, adminOnly, async (req, res) => {
  try {
    const { paidAmount, paymentMethod, notes } = req.body;
    const fp = await FundPayment.findById(req.params.id);
    if (!fp) return res.status(404).json({ message: 'Fund payment not found' });

    fp.paidAmount = parseFloat(paidAmount);
    fp.paymentMethod = paymentMethod || 'cash';
    fp.notes = notes || '';
    fp.status = fp.paidAmount >= fp.amount ? 'paid' : 'partial';
    fp.paidDate = new Date();
    fp.recordedBy = req.user._id;
    await fp.save();

    // Update fund total
    const allPaid = await FundPayment.find({ fundId: fp.fundId, status: 'paid' });
    const totalCollected = allPaid.reduce((s, p) => s + p.paidAmount, 0);
    await Fund.findByIdAndUpdate(fp.fundId, { totalCollected });

    const societyId = fp.societyId.toString();
    emitToSociety(societyId, 'fund_payment_recorded', { fundPaymentId: fp._id });

    res.json(fp);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
