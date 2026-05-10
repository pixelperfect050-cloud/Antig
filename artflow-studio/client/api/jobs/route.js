const { connectDB } = require('../../db');
const Job = require('../../models/Job');
const Order = require('../../models/Order');

async function notify(userId, type, title, message, link = '', meta = {}) {
  try {
    const Notification = (await import('../../models/Notification.js')).default;
    await Notification.create({ userId, type, title, message, link, meta });
  } catch (_) {}
}

module.exports = async function handler(req, res) {
  await connectDB();
  const { method, url } = req;
  const authModule = await import('../../middleware/auth.js');

  const wrapAuth = (mw, handler) => {
    return new Promise((resolve) => {
      mw(req, res, () => {
        handler().then(resolve).catch((e) => { res.status(500).json({ success: false, message: e.message }); resolve(); });
      });
    });
  };

  // POST /api/jobs/create
  if (method === 'POST' && url === '/create') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const { title, description, serviceType, instructions, priority, price } = req.body;
      const job = await Job.create({
        userId: req.user._id, title, description, serviceType, instructions,
        priority: priority || 'normal', price: price || 0, files: [],
        statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Job created' }],
      });
      return res.status(201).json({ success: true, job });
    });
  }

  // GET /api/jobs/user
  if (method === 'GET' && url === '/user') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const jobs = await Job.find({ userId: req.user._id }).sort({ createdAt: -1 });
      return res.json({ success: true, jobs });
    });
  }

  // GET /api/jobs/all
  if (method === 'GET' && url === '/all') {
    return wrapAuth(authModule.adminAuth, async () => {
      if (res.headersSent) return;
      const jobs = await Job.find().populate('userId', 'name email company').sort({ createdAt: -1 });
      return res.json({ success: true, jobs });
    });
  }

  // GET /api/jobs/:id
  if (method === 'GET' && url?.match(/^\/\w+\/\w+$/)) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const job = await Job.findById(id).populate('userId', 'name email company');
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
      return res.json({ success: true, job });
    });
  }

  // PUT /api/jobs/:id/status
  if (method === 'PUT' && url?.match(/\/\w+\/status$/)) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.adminAuth, async () => {
      if (res.headersSent) return;
      const { status, adminNotes, estimatedDelivery, price } = req.body;
      const job = await Job.findById(id);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
      const oldStatus = job.status;
      job.status = status || job.status;
      if (adminNotes !== undefined) job.adminNotes = adminNotes;
      if (estimatedDelivery) job.estimatedDelivery = estimatedDelivery;
      if (price !== undefined) job.price = price;
      job.statusHistory.push({ status: job.status, changedBy: req.user._id, note: adminNotes || '' });
      await job.save();

      if (status === 'completed') {
        const existingOrder = await Order.findOne({ jobId: job._id });
        if (!existingOrder) {
          await Order.create({ jobId: job._id, userId: job.userId, status: 'processing', amount: job.price || 0, originalAmount: job.price || 0, paymentStatus: job.price > 0 ? 'unpaid' : 'paid' });
          notify(job.userId, 'order_created', 'Order Created!', `Your job "${job.title}" is complete! An order has been created.`, '/orders').catch(() => {});
        }
      }

      if (status && status !== oldStatus) {
        notify(job.userId, 'job_status', `Job ${status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, `Your job "${job.title}" has been updated.`, '/jobs').catch(() => {});
      }

      return res.json({ success: true, job });
    });
  }

  // PUT /api/jobs/:id
  if (method === 'PUT' && url?.match(/\/\w+\/\w+$/) && !url?.includes('/status')) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const { title, description, instructions, priority, price, serviceType } = req.body;
      const job = await Job.findById(id);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
      if (job.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
      if (title !== undefined) job.title = title;
      if (description !== undefined) job.description = description;
      if (instructions !== undefined) job.instructions = instructions;
      if (priority !== undefined) job.priority = priority;
      if (price !== undefined) job.price = price;
      if (serviceType !== undefined) job.serviceType = serviceType;
      await job.save();
      return res.json({ success: true, job });
    });
  }

  // DELETE /api/jobs/:id
  if (method === 'DELETE' && url?.match(/\/\w+\/\w+$/)) {
    const id = url.split('/')[2];
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const job = await Job.findById(id);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
      if (job.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
      if (['in-progress', 'in-review'].includes(job.status)) {
        return res.status(400).json({ success: false, message: 'Cannot delete a job that is in progress.' });
      }
      await Job.findByIdAndDelete(id);
      await Order.deleteMany({ jobId: id });
      return res.json({ success: true, message: 'Job deleted.' });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
