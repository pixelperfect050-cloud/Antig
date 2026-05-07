const express = require('express');
const router = express.Router();
const Flat = require('../models/Flat');
const Payment = require('../models/Payment');
const { auth, adminOnly } = require('../middleware/auth');

// PUBLIC: Get flats by blockId (for join flow - no auth required)
router.get('/public/block/:blockId', async (req, res) => {
  try {
    const flats = await Flat.find({ blockId: req.params.blockId })
      .select('number _id floor')
      .sort({ floor: 1, number: 1 });
    res.json(flats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get flats of a block
router.get('/block/:blockId', auth, async (req, res) => {
  try {
    const flats = await Flat.find({ blockId: req.params.blockId }).sort({ floor: 1, number: 1 });
    res.json(flats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single flat with payment history
router.get('/:id', auth, async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id).populate('blockId').populate('userId', 'name email phone');
    if (!flat) return res.status(404).json({ message: 'Flat not found' });

    const payments = await Payment.find({ flatId: flat._id })
      .sort({ year: -1, month: -1 })
      .limit(24);

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = payments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    res.json({ flat, payments, totalPaid, totalDue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update flat details
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const flat = await Flat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    res.json(flat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all flats of a society
router.get('/society/:societyId', auth, async (req, res) => {
  try {
    const flats = await Flat.find({ societyId: req.params.societyId })
      .populate('blockId', 'name')
      .sort({ number: 1 });
    res.json(flats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
