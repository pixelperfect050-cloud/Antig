const Job = require('../models/Job');
const Order = require('../models/Order');
const { getIO } = require('../services/socketService');

exports.createJob = async (req, res) => {
  try {
    const { title, description, serviceType, instructions, priority } = req.body;
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
      files,
      statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Job created' }],
    });

    getIO()?.to('admin-room').emit('new-job', job);
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

exports.updateJobStatus = async (req, res) => {
  try {
    const { status, adminNotes, estimatedDelivery } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    job.status = status || job.status;
    if (adminNotes !== undefined) job.adminNotes = adminNotes;
    if (estimatedDelivery) job.estimatedDelivery = estimatedDelivery;
    job.statusHistory.push({ status: job.status, changedBy: req.user._id, note: adminNotes || '' });

    await job.save();

    // Auto-create order when job is completed
    if (status === 'completed') {
      const existingOrder = await Order.findOne({ jobId: job._id });
      if (!existingOrder) {
        await Order.create({ jobId: job._id, userId: job.userId, status: 'processing' });
      }
    }

    getIO()?.to(`user-${job.userId}`).emit('job-updated', job);
    getIO()?.to('admin-room').emit('job-updated', job);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
