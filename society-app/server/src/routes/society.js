const express = require('express');
const router = express.Router();
const Society = require('../models/Society');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const { emitToSociety } = require('../services/socketService');

// Get society by invite code (Public)
router.get('/invite/:code', async (req, res) => {
  try {
    const society = await Society.findOne({ inviteCode: req.params.code.toUpperCase() })
      .select('name address city state pincode totalBlocks totalFlats');
    
    if (!society) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }
    res.json(society);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create society
router.post('/', auth, async (req, res) => {
  try {
    const { name, address, city, state, pincode, maintenanceAmount, lateFeePerDay, lateFeeAfterDays, billingDay } = req.body;

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const society = new Society({
      name, address, city, state, pincode,
      maintenanceAmount: maintenanceAmount || 0,
      lateFeePerDay: lateFeePerDay || 0,
      lateFeeAfterDays: lateFeeAfterDays || 15,
      billingDay: billingDay || 1,
      createdBy: req.user._id,
      inviteCode
    });

    await society.save();

    // Update user with society and make admin
    await User.findByIdAndUpdate(req.user._id, {
      societyId: society._id,
      role: 'admin'
    });

    res.status(201).json(society);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get society by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const society = await Society.findById(req.params.id).populate('createdBy', 'name email');
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }
    res.json(society);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update society
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const society = await Society.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }
    res.json(society);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all members of society
router.get('/:id/members', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { societyId: req.params.id };
    if (status) query.status = status;

    const members = await User.find(query)
      .select('-password')
      .populate('flatId');
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject member
router.put('/member/:userId/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    await user.save();

    // Real-time update
    emitToSociety(user.societyId.toString(), 'user_status_updated', { 
      userId: user._id, 
      status,
      message: `User ${user.name} has been ${status}`
    });

    // If approved, update Flat occupancy
    if (status === 'approved' && user.flatId) {
      await require('../models/Flat').findByIdAndUpdate(user.flatId, {
        userId: user._id,
        isOccupied: true,
        [user.residentType === 'owner' ? 'ownerName' : 'tenantName']: user.name,
        [user.residentType === 'owner' ? 'ownerPhone' : 'tenantPhone']: user.phone
      });
    }

    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete member
router.delete('/member/:userId', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Clear flat userId if linked
    if (user.flatId) {
      await require('../models/Flat').findByIdAndUpdate(user.flatId, { userId: null });
    }
    
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
