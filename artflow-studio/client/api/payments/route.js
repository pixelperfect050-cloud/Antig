const { connectDB } = require('../../db');
const Order = require('../../models/Order');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  await connectDB();
  const { method } = req;

  if (method === 'POST' && req.url === '/create-order') {
    try {
      const { orderId } = req.body;
      const order = await Order.findById(orderId).populate('jobId');
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      if (order.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'Order already paid.' });
      const amount = order.amount || order.jobId?.price || 0;
      if (amount <= 0) {
        order.paymentStatus = 'paid';
        order.paymentMethod = 'free';
        await order.save();
        return res.json({ success: true, message: 'Free order — marked as paid.', order });
      }
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const Razorpay = (await import('razorpay')).default;
          const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
          const razorpayOrder = await razorpay.orders.create({ amount: amount * 100, currency: 'INR', receipt: `order_${order._id}` });
          order.paymentStatus = 'pending';
          order.paymentMethod = 'razorpay';
          await order.save();
          return res.json({ success: true, gateway: 'razorpay', razorpayOrderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, key: process.env.RAZORPAY_KEY_ID, orderId: order._id });
        } catch (_) {}
      }
      const demoPaymentId = `demo_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      order.paymentStatus = 'pending';
      order.paymentMethod = 'demo';
      order.paymentId = demoPaymentId;
      await order.save();
      return res.json({ success: true, gateway: 'demo', demoPaymentId, amount, currency: 'INR', orderId: order._id, message: 'Demo mode — use verify endpoint to simulate payment.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'POST' && req.url === '/verify') {
    try {
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, demoPaymentId } = req.body;
      const order = await Order.findById(orderId).populate('jobId');
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      if (order.paymentStatus === 'paid') return res.json({ success: true, message: 'Already paid.', order });
      if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
        if (expectedSignature !== razorpay_signature) {
          order.paymentStatus = 'failed';
          await order.save();
          return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }
        order.paymentStatus = 'paid';
        order.paymentId = razorpay_payment_id;
        await order.save();
        return res.json({ success: true, message: 'Payment verified!', order });
      }
      if (demoPaymentId || order.paymentMethod === 'demo') {
        order.paymentStatus = 'paid';
        order.paymentId = demoPaymentId || order.paymentId;
        await order.save();
        return res.json({ success: true, message: 'Demo payment verified!', order });
      }
      return res.status(400).json({ success: false, message: 'Invalid payment data.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'GET' && req.url?.match(/^\/\w+\/status\/\w+/)) {
    const id = req.url.split('/')[2];
    try {
      const order = await Order.findById(id).populate('jobId');
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      return res.json({ success: true, paymentStatus: order.paymentStatus, amount: order.amount, paymentId: order.paymentId, paymentMethod: order.paymentMethod });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
