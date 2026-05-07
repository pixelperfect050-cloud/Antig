const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth, adminOnly } = require('../middleware/auth');
const { emitToSociety } = require('../services/socketService');

// Create notification
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      createdBy: req.user._id
    });
    await notification.save();

    // Real-time update
    emitToSociety(notification.societyId.toString(), 'notification_received', { 
      notification,
      message: notification.title
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notifications for user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      societyId: req.user.societyId,
      $or: [
        { targetAll: true },
        { targetUsers: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter(n => !n.readBy.includes(req.user._id)).length;
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id }
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        societyId: req.user.societyId,
        $or: [{ targetAll: true }, { targetUsers: req.user._id }]
      },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
