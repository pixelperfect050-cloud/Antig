const { connectDB } = require('../../db');
const Order = require('../../models/Order');
const Job = require('../../models/Job');
const authModule = await import('../../middleware/auth.js');

async function notify(userId, type, title, message, link = '', meta = {}) {
  try {
    const Notification = (await import('../../models/Notification.js')).default;
    await Notification.create({ userId, type, title, message, link, meta });
  } catch (_) {}
}

module.exports = async function handler(req, res) {
  await connectDB();
  const { method, url } = req;

  const wrapAuth = (mw, handler) => {
    return new Promise((resolve) => {
      mw(req, res, () => {
        handler().then(resolve).catch((e) => { res.status(500).json({ success: false, message: e.message }); resolve(); });
      });
    });
  };

  // POST /api/orders
  if (method === 'POST' && url === '/') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const { jobId } = req.body;
      const job = await Job.findById(jobId);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
      const existingOrder = await Order.findOne({ jobId });
      if (existingOrder) return res.status(409).json({ success: false, message: 'Order already exists for this job.', order: existingOrder });
      const order = await Order.create({ jobId: job._id, userId: req.user._id, amount: job.price || 0, originalAmount: job.price || 0, paymentStatus: job.price > 0 ? 'unpaid' : 'paid', status: 'processing' });
      const populated = await Order.findById(order._id).populate('jobId').populate('userId', 'name email');
      return res.status(201).json({ success: true, order: populated });
    });
  }

  // GET /api/orders/user
  if (method === 'GET' && url === '/user') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const orders = await Order.find({ userId: req.user._id }).populate('jobId').sort({ createdAt: -1 });
      return res.json({ success: true, orders });
    });
  }

  // GET /api/orders/all
  if (method === 'GET' && url === '/all') {
    return wrapAuth(authModule.adminAuth, async () => {
      if (res.headersSent) return;
      const orders = await Order.find().populate('jobId').populate('userId', 'name email').sort({ createdAt: -1 });
      return res.json({ success: true, orders });
    });
  }

  // GET /api/orders/:id
  if (method === 'GET' && url?.match(/\/\w+\/\w+$/) && !url?.includes('/feedback')) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const order = await Order.findById(id).populate('jobId').populate('userId', 'name email');
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      return res.json({ success: true, order });
    });
  }

  // POST /api/orders/:id/feedback
  if (method === 'POST' && url?.match(/\/\w+\/feedback$/)) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const { rating, feedback } = req.body;
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      order.rating = rating;
      order.feedback = feedback;
      await order.save();
      return res.json({ success: true, order });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
