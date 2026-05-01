const Job = require('../models/Job');
const Order = require('../models/Order');
const { getIO } = require('../services/socketService');
const { notify, notifyAdmins } = require('../services/notificationService');

exports.createJob = async (req, res) => {
  try {
    const { title, description, serviceType, instructions, priority, price } = req.body;
    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      size: f.size,
      mimetype: f.mimetype,
    }));

    const job = await Job.create({
      userId: req.user._id,
      title,
      description,
      serviceType,
      instructions,
      priority: priority || 'normal',
      price: price || 0,
      files,
      statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Job created' }],
    });

    getIO()?.to('admin-room').emit('new-job', job);

    // Notify admins about new job
    notifyAdmins({
      type: 'admin_alert',
      title: '📋 New Job Submitted',
      message: `${req.user.name} submitted a new ${serviceType.replace(/-/g, ' ')} job: "${title}"`,
      link: '/admin',
      meta: { jobId: job._id, serviceType },
    }).catch(() => {});

    // Notify user about job creation
    notify({
      userId: req.user._id,
      type: 'job_status',
      title: '✅ Job Submitted Successfully',
      message: `Your job "${title}" has been submitted and is pending review.`,
      link: '/jobs',
      meta: { jobId: job._id },
    }).catch(() => {});

    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllJobs = async (_req, res) => {
  try {
    const jobs = await Job.find().populate('userId', 'name email company').sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('userId', 'name email company');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { title, description, instructions, priority, price, serviceType } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Only owner or admin can update
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
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { status, adminNotes, estimatedDelivery, price } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    const oldStatus = job.status;
    job.status = status || job.status;
    if (adminNotes !== undefined) job.adminNotes = adminNotes;
    if (estimatedDelivery) job.estimatedDelivery = estimatedDelivery;
    if (price !== undefined) job.price = price;
    job.statusHistory.push({ status: job.status, changedBy: req.user._id, note: adminNotes || '' });

    await job.save();

    // Auto-create order when job is completed
    if (status === 'completed') {
      const existingOrder = await Order.findOne({ jobId: job._id });
      if (!existingOrder) {
        const order = await Order.create({
          jobId: job._id,
          userId: job.userId,
          status: 'processing',
          amount: job.price || 0,
          originalAmount: job.price || 0,
          paymentStatus: job.price > 0 ? 'unpaid' : 'paid',
        });

        // Notify user about order creation
        notify({
          userId: job.userId,
          type: 'order_created',
          title: '🎉 Order Created!',
          message: `Your job "${job.title}" is complete! An order has been created for delivery.`,
          link: '/orders',
          meta: { jobId: job._id, orderId: order._id },
        }).catch(() => {});

        // Notify admins
        notifyAdmins({
          type: 'admin_alert',
          title: '📦 New Order Auto-Created',
          message: `Order created for job "${job.title}" (${job.price > 0 ? `₹${job.price}` : 'Free'})`,
          link: '/admin',
          meta: { orderId: order._id },
        }).catch(() => {});
      }
    }

    // Notify user about job status change
    if (status && status !== oldStatus) {
      notify({
        userId: job.userId,
        type: 'job_status',
        title: `📋 Job ${status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        message: `Your job "${job.title}" has been updated to "${status.replace(/-/g, ' ')}".${adminNotes ? ` Note: ${adminNotes}` : ''}`,
        link: '/jobs',
        meta: { jobId: job._id, status, oldStatus },
      }).catch(() => {});
    }

    getIO()?.to(`user-${job.userId}`).emit('job-updated', job);
    getIO()?.to('admin-room').emit('job-updated', job);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Only owner or admin can delete
    if (job.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Don't allow deleting in-progress jobs
    if (['in-progress', 'in-review'].includes(job.status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete a job that is in progress.' });
    }

    await Job.findByIdAndDelete(req.params.id);
    // Also remove any associated orders
    await Order.deleteMany({ jobId: req.params.id });

    getIO()?.to('admin-room').emit('job-deleted', { _id: req.params.id });
    res.json({ success: true, message: 'Job deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
