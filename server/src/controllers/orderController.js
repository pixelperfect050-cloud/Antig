const Order = require('../models/Order');
const Job = require('../models/Job');
const path = require('path');
const { getIO } = require('../services/socketService');
const { notify, notifyAdmins } = require('../services/notificationService');
const { awardOrderCompleteBonus } = require('../services/creditService');

exports.createOrder = async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Check if order already exists for this job
    const existingOrder = await Order.findOne({ jobId });
    if (existingOrder) return res.status(409).json({ success: false, message: 'Order already exists for this job.', order: existingOrder });

    const order = await Order.create({
      jobId: job._id,
      userId: req.user._id,
      amount: job.price || 0,
      originalAmount: job.price || 0,
      paymentStatus: job.price > 0 ? 'unpaid' : 'paid',
      status: 'processing',
    });

    const populated = await Order.findById(order._id).populate('jobId').populate('userId', 'name email');
    getIO()?.to('admin-room').emit('new-order', populated);

    // Notify admins about new order
    notifyAdmins({
      type: 'order_created',
      title: '🛒 New Order Received',
      message: `${req.user.name} placed a new order for "${job.title}" (${job.price > 0 ? `₹${job.price}` : 'Free'})`,
      link: '/admin',
      meta: { orderId: order._id, jobId: job._id },
    }).catch(() => {});

    res.status(201).json({ success: true, order: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate('jobId').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllOrders = async (_req, res) => {
  try {
    const orders = await Order.find().populate('jobId').populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('jobId').populate('userId', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('jobId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      size: f.size,
      mimetype: f.mimetype,
    }));

    order.deliveryFiles.push(...files);
    order.status = 'ready';
    order.deliveryNotes = req.body.deliveryNotes || order.deliveryNotes;
    await order.save();

    // Notify user that order is ready
    notify({
      userId: order.userId,
      type: 'order_ready',
      title: '📦 Your Order is Ready!',
      message: `Your order for "${order.jobId?.title || 'your job'}" is ready for download. ${files.length} file(s) delivered.`,
      link: '/orders',
      meta: { orderId: order._id },
    }).catch(() => {});

    getIO()?.to(`user-${order.userId}`).emit('order-updated', order);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const file = order.deliveryFiles.find((f) => f.filename === req.params.filename);
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

    const wasProcessing = order.status !== 'delivered';
    order.downloadCount += 1;
    order.status = 'delivered';
    await order.save();

    // On first download, mark as delivered and award credits
    if (wasProcessing) {
      notify({
        userId: order.userId,
        type: 'order_delivered',
        title: '✅ Order Delivered',
        message: `Your order has been marked as delivered. Enjoy your files! Leave a review to help us improve.`,
        link: '/orders',
        meta: { orderId: order._id },
      }).catch(() => {});

      // Award order completion credits
      awardOrderCompleteBonus(order.userId).catch(() => {});
    }

    res.download(path.resolve(file.path), file.originalName);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.rating = rating;
    order.feedback = feedback;
    await order.save();

    // Notify admins about the review
    notifyAdmins({
      type: 'review_request',
      title: `⭐ New Review (${rating}/5)`,
      message: `Customer left a ${rating}-star review: "${feedback || 'No comment'}"`,
      link: '/admin',
      meta: { orderId: order._id, rating },
    }).catch(() => {});

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
