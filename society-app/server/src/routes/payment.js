const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const Society = require('../models/Society');
const { auth, adminOnly } = require('../middleware/auth');
const { notifyFlatOwner, notifyAllUsers } = require('../utils/notificationHelper');
const { logActivity } = require('../services/activityLogger');
const { generatePaymentReceipt } = require('../utils/pdfGenerator');
const { emitToSociety } = require('../services/socketService');


// Record payment (Manual Entry by Admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    let { flatId, societyId, amount, paidAmount, month, year, paymentMethod, transactionId, notes, lateFee } = req.body;
    
    // Validate required fields
    if (!flatId || !societyId) {
      return res.status(400).json({ message: 'Flat ID and Society ID are required' });
    }

    // Explicitly cast to correct types
    const mMonth = parseInt(month);
    const mYear = parseInt(year);
    const mPaidAmount = parseFloat(paidAmount) || 0;
    const mAmount = parseFloat(amount) || 0;
    const mLateFee = parseFloat(lateFee) || 0;

    if (isNaN(mMonth) || isNaN(mYear) || mMonth < 1 || mMonth > 12) {
      return res.status(400).json({ message: 'Invalid month or year' });
    }

    console.log(`[Payment] Processing manual payment for Flat: ${flatId}, Month: ${mMonth}, Year: ${mYear}, Amount: ${mPaidAmount}`);

    // Check if a payment record already exists for this flat, month, and year
    let fId;
    try {
      fId = new mongoose.Types.ObjectId(flatId);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid flat ID format' });
    }

    let payment = await Payment.findOne({ flatId: fId, month: mMonth, year: mYear });
    let isNew = false;

    if (payment) {
      console.log(`[Payment] Updating existing record: ${payment._id}`);
      payment.paidAmount += mPaidAmount;
      payment.paymentMethod = paymentMethod || payment.paymentMethod;
      payment.transactionId = transactionId || payment.transactionId;
      if (notes) payment.notes = payment.notes ? `${payment.notes}\n${notes}` : notes;
      if (lateFee !== undefined) payment.lateFee = mLateFee;
      
      const totalRequired = (payment.amount || 0) + (payment.lateFee || 0);
      if (payment.paidAmount >= totalRequired) payment.status = 'paid';
      else if (payment.paidAmount > 0) payment.status = 'partial';
      
      if (mPaidAmount > 0) payment.paidDate = new Date();
      await payment.save();
    } else {
      console.log(`[Payment] Creating new record for flat: ${flatId}`);
      isNew = true;
      let status = 'pending';
      const totalRequired = mAmount + mLateFee;
      if (mPaidAmount >= totalRequired && mPaidAmount > 0) status = 'paid';
      else if (mPaidAmount > 0) status = 'partial';

      payment = new Payment({
        flatId: fId, 
        societyId: new mongoose.Types.ObjectId(societyId), 
        amount: mAmount, 
        paidAmount: mPaidAmount,
        month: mMonth, 
        year: mYear, 
        status,
        paymentMethod: paymentMethod || 'cash',
        transactionId: transactionId || '', 
        notes: notes || '',
        lateFee: mLateFee,
        paidDate: mPaidAmount > 0 ? new Date() : null,
        dueDate: new Date(mYear, mMonth - 1, 15),
        recordedBy: req.user._id
      });

      await payment.save();
    }

    // Update flat's current month status BEFORE sending response
    // This ensures the block view shows green immediately
    try {
      const now = new Date();
      if (mMonth === (now.getMonth() + 1) && mYear === now.getFullYear()) {
        console.log(`[Payment] Updating flat ${flatId} status to: ${payment.status}`);
        await Flat.findByIdAndUpdate(flatId, { currentMonthStatus: payment.status });
      }
    } catch (flatUpdateErr) {
      console.error('[Payment] Non-critical: flat status update failed:', flatUpdateErr.message);
    }

    // Send success response IMMEDIATELY
    const responsePayment = payment.toObject();
    res.status(isNew ? 201 : 200).json(responsePayment);
    console.log(`[Payment] Response sent successfully (${isNew ? 'created' : 'updated'})`);

    // Log activity
    const monthLabel = new Date(mYear, mMonth - 1).toLocaleString('default', { month: 'long' });
    logActivity({
      societyId,
      admin: req.user,
      actionType: 'payment_approved',
      description: `Payment of ₹${mPaidAmount} recorded for ${monthLabel} ${mYear} by ${req.user.name}`,
      targetType: 'payment',
      targetId: payment._id,
      metadata: { flatId, amount: mPaidAmount, month: mMonth, year: mYear }
    }).catch(() => {});

    // ALL background tasks - socket, notifications - run AFTER response
    // These CANNOT cause any error for the user
    setImmediate(async () => {
      try {
        const monthName = new Date(mYear, mMonth - 1).toLocaleString('default', { month: 'long' });

        // Real-time update via Socket.io
        try {
          emitToSociety(societyId.toString(), 'payment_recorded', { 
            payment: responsePayment, 
            flatId: flatId.toString(),
            message: `Payment of ₹${mPaidAmount} recorded for ${monthName} ${mYear}`
          });
        } catch (socketErr) {
          console.error('[Payment] Socket emit error:', socketErr.message);
        }

        // Notify flat owner
        try {
          await notifyFlatOwner({
            flatId,
            societyId,
            title: 'Payment Recorded',
            message: `A payment of ₹${mPaidAmount} has been recorded for ${monthName} ${mYear}. Status: ${payment.status}`,
            type: 'success'
          });
        } catch (notifErr) {
          console.error('[Payment] Notification error:', notifErr.message);
        }
      } catch (secondaryError) {
        console.error('[Payment] Background task error:', secondaryError.message);
      }
    });
  } catch (error) {
    console.error('[Payment] Recording Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Generate monthly bills for all flats
router.post('/generate-bills', auth, adminOnly, async (req, res) => {
  try {
    const { societyId, month, year, amount } = req.body;

    const flats = await Flat.find({ societyId, isOccupied: true });
    const existingPayments = await Payment.find({ societyId, month, year });
    const existingFlatIds = existingPayments.map(p => p.flatId.toString());

    const newPayments = [];
    for (const flat of flats) {
      if (!existingFlatIds.includes(flat._id.toString())) {
        newPayments.push({
          flatId: flat._id,
          societyId,
          amount,
          paidAmount: 0,
          month, year,
          status: 'pending',
          dueDate: new Date(year, month - 1, 15),
          recordedBy: req.user._id
        });
      }
    }

    if (newPayments.length > 0) {
      await Payment.insertMany(newPayments);
      // Update all flats status to pending
      const newFlatIds = newPayments.map(p => p.flatId);
      await Flat.updateMany(
        { _id: { $in: newFlatIds } },
        { currentMonthStatus: 'pending' }
      );

      // Notify all users about new bills (background - don't fail request)
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      notifyAllUsers({
        societyId,
        title: 'Maintenance Bills Generated',
        message: `Maintenance bills of ₹${amount} for ${monthName} ${year} have been generated. Please check your dues.`,
        type: 'info'
      }).catch(e => console.error('Bill notification error:', e));
    }

    res.json({ message: `Bills generated for ${newPayments.length} flats`, count: newPayments.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { paidAmount, paymentMethod, transactionId, notes, lateFee } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.paidAmount = paidAmount;
    payment.paymentMethod = paymentMethod || payment.paymentMethod;
    payment.transactionId = transactionId || payment.transactionId;
    payment.notes = notes || payment.notes;
    if (lateFee !== undefined) payment.lateFee = lateFee;

    const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);
    if (paidAmount >= totalAmount) payment.status = 'paid';
    else if (paidAmount > 0) payment.status = 'partial';
    else payment.status = 'pending';

    if (paidAmount > 0) payment.paidDate = new Date();

    await payment.save();

    // Update flat status BEFORE response
    try {
      const now = new Date();
      if (payment.month === (now.getMonth() + 1) && payment.year === now.getFullYear()) {
        await Flat.findByIdAndUpdate(payment.flatId, { currentMonthStatus: payment.status });
      }
    } catch (flatErr) {
      console.error('[Payment PUT] flat status update error:', flatErr.message);
    }

    // Log activity
    logActivity({
      societyId: payment.societyId,
      admin: req.user,
      actionType: 'payment_edited',
      description: `Payment updated to ₹${paidAmount} by ${req.user.name}`,
      targetType: 'payment',
      targetId: payment._id,
      metadata: { paidAmount, status: payment.status }
    }).catch(() => {});

    // Send response FIRST
    res.json(payment);

    // Background: Notify flat owner (don't block response)
    setImmediate(async () => {
      try {
        const monthName = new Date(payment.year, payment.month - 1).toLocaleString('default', { month: 'long' });
        await notifyFlatOwner({
          flatId: payment.flatId,
          societyId: payment.societyId,
          title: 'Payment Updated',
          message: `Your payment for ${monthName} ${payment.year} has been updated. Paid: ₹${paidAmount}.`,
          type: 'success'
        });
      } catch (e) {
        console.error('[Payment PUT] notification error:', e.message);
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payments for a flat
router.get('/flat/:flatId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ flatId: req.params.flatId })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payments for society (with filters)
router.get('/society/:societyId', auth, async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const filter = { societyId: req.params.societyId };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('flatId', 'number blockId ownerName')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending payments
router.get('/pending/:societyId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({
      societyId: req.params.societyId,
      status: { $in: ['pending', 'partial'] }
    })
      .populate('flatId', 'number blockId ownerName ownerPhone')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Receipt Details (JSON for in-app receipt view)
router.get('/:id/details', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Ensure user has access
    if (req.user.role !== 'admin' && req.user.flatId?.toString() !== payment.flatId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [society, flat] = await Promise.all([
      Society.findById(payment.societyId),
      Flat.findById(payment.flatId).populate('blockId', 'name')
    ]);

    res.json({ payment, society, flat });
  } catch (error) {
    console.error('Receipt details error:', error);
    res.status(500).json({ message: 'Error fetching receipt details', error: error.message });
  }
});

// Download Receipt PDF
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Ensure user has access (admin or flat owner)
    if (req.user.role !== 'admin' && req.user.flatId?.toString() !== payment.flatId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [society, flat] = await Promise.all([
      Society.findById(payment.societyId),
      Flat.findById(payment.flatId).populate('blockId', 'name')
    ]);

    const pdfBuffer = await generatePaymentReceipt(payment, society, flat);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.month}_${payment.year}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Error:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

module.exports = router;
