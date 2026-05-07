const User = require('../models/User');
const Job = require('../models/Job');
const Order = require('../models/Order');

exports.getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllJobsAdmin = async (_req, res) => {
  try {
    const jobs = await Job.find().populate('userId', 'name email company').sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllOrdersAdmin = async (_req, res) => {
  try {
    const orders = await Order.find().populate('jobId').populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (_req, res) => {
  try {
    const [totalUsers, totalJobs, totalOrders, paidOrders] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    const recentJobs = await Job.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5);
    const recentOrders = await Order.find().populate('jobId').populate('userId', 'name email').sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: { totalUsers, totalJobs, totalOrders, paidOrders, totalRevenue },
      recentJobs,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
