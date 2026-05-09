const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const Society = require('../models/Society');
const { auth, adminOnly } = require('../middleware/auth');
const { notifyFlatOwner, notifyAllUsers } = require('../utils/notificationHelper');
const { generatePaymentReceipt } = require('../utils/pdfGenerator');
const { emitToSociety } = require('../services/socketService');


// Record payment
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    let { flatId, societyId, amount, paidAmount, month, year, paymentMethod, transactionId, notes, lateFee } = req.body;
    
    // Explicitly cast to correct types
    const mMonth = parseInt(month);
    const mYear = parseInt(year);
    const mPaidAmount = parseFloat(paidAmount) || 0;
    const mAmount = parseFloat(amount) || 0;
    const mLateFee = parseFloat(lateFee) || 0;

    console.log(`[Payment] Processing manual payment for Flat: ${flatId}, Month: ${mMonth}, Year: ${mYear}, Amount: ${mPaidAmount}`);

    // Check if a payment record already exists for this flat, month, and year
    // Using standard mongoose ObjectId casting
    const fId = new mongoose.Types.ObjectId(flatId);
    
    let payment = await Payment.findOne({ flatId: fId, month: mMonth, year: mYear });
    let isNew = false;

    if (payment) {
      console.log(`[Payment] Found existing record: ${payment._id}. Updating...`);
      // Update existing record
      payment.paidAmount += mPaidAmount;
      payment.paymentMethod = paymentMethod || payment.paymentMethod;
      payment.transactionId = transactionId || payment.transactionId;
      if (notes) payment.notes = `${payment.notes}\n${notes}`;
      if (lateFee !== undefined) payment.lateFee = mLateFee;
      
      const totalRequired = payment.amount + payment.lateFee;
      if (payment.paidAmount >= totalRequired) payment.status = 'paid';
      else if (payment.paidAmount > 0) payment.status = 'partial';
      
      if (mPaidAmount > 0) payment.paidDate = new Date();
      await payment.save();
    } else {
      console.log(`[Payment] No existing record. Creating new one.`);
      // Create new record
      isNew = true;
      let status = 'pending';
      const totalRequired = mAmount + mLateFee;
      if (mPaidAmount >= totalRequired) status = 'paid';
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
        transactionId, 
        notes,
        lateFee: mLateFee,
        paidDate: mPaidAmount > 0 ? new Date() : null,
        dueDate: new Date(mYear, mMonth - 1, 15),
        recordedBy: req.user._id
      });

      await payment.save();
    }

    const monthName = new Date(mYear, mMonth - 1).toLocaleString('default', { month: 'long' });

    // Real-time update via Socket.io
    emitToSociety(societyId, 'payment_recorded', { 
      payment, 
      flatId,
      message: `Payment of ₹${mPaidAmount} recorded for ${monthName} ${mYear}`
    });

    // Notify flat owner
    notifyFlatOwner({
      flatId,
      societyId,
      title: 'Payment Recorded',
      message: `A payment of ₹${mPaidAmount} has been recorded for ${monthName} ${mYear}.`,
      type: 'success'
    }).catch(e => console.error('Notification error:', e));


    // Update flat's current month status if it's the current month
    const now = new Date();
    if (mMonth === now.getMonth() + 1 && mYear === now.getFullYear()) {
      console.log(`[Payment] Updating Flat ${flatId} status to ${payment.status}`);
      await Flat.findByIdAndUpdate(flatId, { currentMonthStatus: payment.status });
    }

    console.log(`[Payment] Success! Record ${isNew ? 'Created' : 'Updated'}.`);
    res.status(isNew ? 201 : 200).json(payment);
  } catch (error) {
    console.error('Payment Recording Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

      // Notify all users about new bills
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      await notifyAllUsers({
        societyId,
        title: 'Maintenance Bills Generated',
        message: `Maintenance bills of ₹${amount} for ${monthName} ${year} have been generated. Please check your dues.`,
        type: 'info'
      });
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

    const totalAmount = payment.amount + payment.lateFee;
    if (paidAmount >= totalAmount) payment.status = 'paid';
    else if (paidAmount > 0) payment.status = 'partial';
    else payment.status = 'pending';

    if (paidAmount > 0) payment.paidDate = new Date();

    await payment.save();

    // Notify flat owner
    const monthName = new Date(payment.year, payment.month - 1).toLocaleString('default', { month: 'long' });
    await notifyFlatOwner({
      flatId: payment.flatId,
      societyId: payment.societyId,
      title: 'Payment Updated',
      message: `Your payment for ${monthName} ${payment.year} has been updated. Paid: ₹${paidAmount}.`,
      type: 'success'
    });


    // Update flat status
    const now = new Date();
    if (payment.month === now.getMonth() + 1 && payment.year === now.getFullYear()) {
      await Flat.findByIdAndUpdate(payment.flatId, { currentMonthStatus: payment.status });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payments for a flat
router.get('/flat/:flatId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ flatId: req.params.flatId })
      .sort({ year: -1, month: -1 });
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
      .sort({ year: -1, month: -1 });
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
      .sort({ year: -1, month: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

