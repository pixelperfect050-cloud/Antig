const { connectDB } = require('../../db');
const User = require('../../models/User');
const Job = require('../../models/Job');
const Order = require('../../models/Order');

const authModule = await import('../../middleware/auth.js');

module.exports = async function handler(req, res) {
  await connectDB();
  const { method, url } = req;

  const wrapAdmin = (handler) => {
    return new Promise((resolve) => {
      authModule.adminAuth(req, res, () => {
        if (res.headersSent) { resolve(); return; }
        handler().then(resolve).catch((e) => { res.status(500).json({ success: false, message: e.message }); resolve(); });
      });
    });
  };

  if (method === 'GET' && url === '/stats') {
    return wrapAdmin(async () => {
      if (res.headersSent) return;
      const [totalUsers, totalJobs, totalOrders, paidOrders] = await Promise.all([User.countDocuments(), Job.countDocuments(), Order.countDocuments(), Order.countDocuments({ paymentStatus: 'paid' })]);
      const revenueResult = await Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
      const totalRevenue = revenueResult[0]?.total || 0;
      const recentJobs = await Job.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5);
      const recentOrders = await Order.find().populate('jobId').populate('userId', 'name email').sort({ createdAt: -1 }).limit(5);
      return res.json({ success: true, stats: { totalUsers, totalJobs, totalOrders, paidOrders, totalRevenue }, recentJobs, recentOrders });
    });
  }

  if (method === 'GET' && url === '/users') {
    return wrapAdmin(async () => {
      if (res.headersSent) return;
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.json({ success: true, users });
    });
  }

  if (method === 'GET' && url === '/jobs') {
    return wrapAdmin(async () => {
      if (res.headersSent) return;
      const jobs = await Job.find().populate('userId', 'name email company').sort({ createdAt: -1 });
      return res.json({ success: true, jobs });
    });
  }

  if (method === 'GET' && url === '/orders') {
    return wrapAdmin(async () => {
      if (res.headersSent) return;
      const orders = await Order.find().populate('jobId').populate('userId', 'name email').sort({ createdAt: -1 });
      return res.json({ success: true, orders });
    });
  }

  if (method === 'PUT' && url?.includes('/users/') && url?.includes('/role')) {
    return wrapAdmin(async () => {
      if (res.headersSent) return;
      const id = url.split('/')[2];
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
      const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user });
    });
  }

  if (method === 'PUT' && url?.includes('/users/') && url?.includes('/toggle')) {
    return wrapAdmin(async () => {
      if (res.headersSent) return;
      const id = url.split('/')[2];
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.isActive = !user.isActive;
      await user.save();
      return res.json({ success: true, user });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
