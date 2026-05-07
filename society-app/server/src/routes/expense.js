const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { auth, adminOnly } = require('../middleware/auth');
const { notifyAllUsers } = require('../utils/notificationHelper');
const { emitToSociety } = require('../services/socketService');

// Add expense
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      addedBy: req.user._id
    });
    await expense.save();

    // Real-time update
    emitToSociety(expense.societyId.toString(), 'expense_added', { 
      expense,
      message: `New expense of ₹${expense.amount} added for ${expense.category}`
    });

    // Notify all users about the new expense
    await notifyAllUsers({
      societyId: expense.societyId,
      title: 'New Expense Recorded',
      message: `${expense.category}: ₹${expense.amount} for ${expense.description}`,
      type: 'expense_update'
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expenses for society (with filters)
router.get('/society/:societyId', auth, async (req, res) => {
  try {
    const { category, month, year } = req.query;
    const filter = { societyId: req.params.societyId };
    if (category) filter.category = category;
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(filter)
      .populate('blockId', 'name')
      .populate('addedBy', 'name')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expense summary by category
router.get('/summary/:societyId', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const matchFilter = { societyId: require('mongoose').Types.ObjectId.createFromHexString(req.params.societyId) };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      matchFilter.date = { $gte: startDate, $lte: endDate };
    }

    const summary = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalExpenses = summary.reduce((sum, s) => sum + s.total, 0);
    res.json({ summary, totalExpenses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update expense
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete expense
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
