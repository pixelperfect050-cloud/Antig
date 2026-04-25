const Order = require('../models/Order');
const path = require('path');
const { getIO } = require('../services/socketService');

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
    const order = await Order.findById(req.params.id);
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

    order.downloadCount += 1;
    order.status = 'delivered';
    await order.save();

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

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
