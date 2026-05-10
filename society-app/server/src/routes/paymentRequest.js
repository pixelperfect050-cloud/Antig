const express = require('express');
const router = express.Router();
const PaymentRequest = require('../models/PaymentRequest');
const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const { notifyFlatOwner, notifyAllUsers, notifyAdmins } = require('../utils/notificationHelper');
const { emitToSociety } = require('../services/socketService');

// Member submits a payment request
router.post('/', auth, async (req, res) => {
  try {
    const { paymentId, amount, month, year, paymentMethod, transactionId, screenshotUrl, notes } = req.body;

    if (!req.user.flatId) {
      return res.status(400).json({ message: 'No flat assigned to your account' });
    }

    if (!amount || !month || !year) {
      return res.status(400).json({ message: 'Amount, month and year are required' });
    }

    const societyId = req.user.societyId?._id || req.user.societyId;

    // Check for existing pending request for same month
    const existing = await PaymentRequest.findOne({
      flatId: req.user.flatId,
      month, year,
      status: { $in: ['pending_verification'] }
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending payment request for this month' });
    }

    const request = new PaymentRequest({
      flatId: req.user.flatId,
      societyId,
      submittedBy: req.user._id,
      paymentId: paymentId || null,
      amount: parseFloat(amount),
      month, year,
      paymentMethod: paymentMethod || 'upi',
      transactionId: transactionId || '',
      screenshotUrl: screenshotUrl || '',
      notes: notes || ''
    });

    await request.save();

    // Populate for response
    const populated = await PaymentRequest.findById(request._id)
      .populate('flatId', 'number ownerName')
      .populate('submittedBy', 'name phone');

    // Notify admins
    const flat = await Flat.findById(req.user.flatId);
    await notifyAdmins({
      societyId,
      title: '💰 Payment Verification Request',
      message: `${req.user.name} (Flat ${flat?.number}) submitted ₹${amount} payment for ${getMonthName(month)} ${year}. Please verify.`,
      type: 'payment_reminder'
    });

    // Real-time update
    emitToSociety(societyId.toString(), 'payment_request_submitted', {
      request: populated,
      message: `New payment request from Flat ${flat?.number}`
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payment requests for a society (admin)
router.get('/society/:societyId', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { societyId: req.params.societyId };
    if (status) filter.status = status;

    const requests = await PaymentRequest.find(filter)
      .populate('flatId', 'number ownerName blockId')
      .populate('submittedBy', 'name phone email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get member's own payment requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await PaymentRequest.find({ submittedBy: req.user._id })
      .populate('flatId', 'number')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin approve/reject/correction payment request
router.put('/:id/review', auth, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected', 'correction_needed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await PaymentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    request.adminNotes = adminNotes || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    const societyId = request.societyId.toString();

    // If approved, update or create the actual payment record
    if (status === 'approved') {
      let payment = await Payment.findOne({
        flatId: request.flatId,
        month: request.month,
        year: request.year,
        societyId: request.societyId
      });

      if (payment) {
        // Existing bill — update it
        payment.paidAmount += request.amount;
        payment.paymentMethod = request.paymentMethod;
        payment.transactionId = request.transactionId || payment.transactionId;
        payment.notes = request.notes || payment.notes;
        payment.paidDate = new Date();
        payment.recordedBy = req.user._id;

        const totalAmount = payment.amount + payment.lateFee;
        if (payment.paidAmount >= totalAmount) payment.status = 'paid';
        else if (payment.paidAmount > 0) payment.status = 'partial';

        await payment.save();
      } else {
        // No existing bill — create new payment record
        payment = new Payment({
          flatId: request.flatId,
          societyId: request.societyId,
          amount: request.amount,
          paidAmount: request.amount,
          month: request.month,
          year: request.year,
          status: 'paid',
          paymentMethod: request.paymentMethod,
          transactionId: request.transactionId || '',
          notes: request.notes || '',
          paidDate: new Date(),
          dueDate: new Date(request.year, request.month - 1, 15),
          recordedBy: req.user._id
        });
        await payment.save();
      }

      // Update flat current month status
      try {
        const now = new Date();
        if (payment.month === (now.getMonth() + 1) && payment.year === now.getFullYear()) {
          await Flat.findByIdAndUpdate(request.flatId, { currentMonthStatus: payment.status });
        }
      } catch (flatErr) {
        console.error('[PaymentRequest] flat status update error:', flatErr.message);
      }

      request.paymentId = payment._id;
      await request.save();

      // Notify member
      await notifyFlatOwner({
        flatId: request.flatId,
        societyId: request.societyId,
        title: '✅ Payment Approved',
        message: `Your payment of ₹${request.amount} for ${getMonthName(request.month)} ${request.year} has been approved.`,
        type: 'success'
      });

      emitToSociety(societyId, 'payment_approved', {
        requestId: request._id,
        flatId: request.flatId,
        message: `Payment approved for Flat`
      });
    } else if (status === 'rejected') {
      await notifyFlatOwner({
        flatId: request.flatId,
        societyId: request.societyId,
        title: '❌ Payment Rejected',
        message: `Your payment of ₹${request.amount} for ${getMonthName(request.month)} ${request.year} was rejected. ${adminNotes ? 'Reason: ' + adminNotes : ''}`,
        type: 'payment_reminder'
      });

      emitToSociety(societyId, 'payment_rejected', {
        requestId: request._id,
        flatId: request.flatId
      });
    } else if (status === 'correction_needed') {
      await notifyFlatOwner({
        flatId: request.flatId,
        societyId: request.societyId,
        title: '🔄 Payment Correction Needed',
        message: `Your payment for ${getMonthName(request.month)} ${request.year} needs correction. ${adminNotes || 'Please re-submit.'}`,
        type: 'info'
      });
    }

    const populated = await PaymentRequest.findById(request._id)
      .populate('flatId', 'number ownerName')
      .populate('submittedBy', 'name phone')
      .populate('reviewedBy', 'name');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending count for admin badge
router.get('/pending-count/:societyId', auth, async (req, res) => {
  try {
    const count = await PaymentRequest.countDocuments({
      societyId: req.params.societyId,
      status: 'pending_verification'
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function getMonthName(month) {
  return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
}

module.exports = router;
