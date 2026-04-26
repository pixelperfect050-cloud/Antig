const Order = require('../models/Order');
const crypto = require('crypto');

// Create payment order (Razorpay-style)
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('jobId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order already paid.' });
    }

    const amount = order.amount || order.jobId?.price || 0;
    if (amount <= 0) {
      // Free order — mark as paid
      order.paymentStatus = 'paid';
      order.paymentMethod = 'free';
      await order.save();
      return res.json({ success: true, message: 'Free order — marked as paid.', order });
    }

    // If Razorpay is configured, use it
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const razorpayOrder = await razorpay.orders.create({
          amount: amount * 100, // in paise
          currency: 'INR',
          receipt: `order_${order._id}`,
          notes: { orderId: order._id.toString(), jobId: order.jobId._id.toString() },
        });

        order.paymentStatus = 'pending';
        order.paymentMethod = 'razorpay';
        await order.save();

        return res.json({
          success: true,
          gateway: 'razorpay',
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID,
          orderId: order._id,
        });
      } catch (razorpayErr) {
        console.warn('⚠️  Razorpay not available, falling back to demo mode:', razorpayErr.message);
        // Fall through to demo mode below
      }
    }

    // Fallback: Demo/Simulation mode (no real payment gateway configured)
    const demoPaymentId = `demo_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    order.paymentStatus = 'pending';
    order.paymentMethod = 'demo';
    order.paymentId = demoPaymentId;
    await order.save();

    res.json({
      success: true,
      gateway: 'demo',
      demoPaymentId,
      amount,
      currency: 'INR',
      orderId: order._id,
      message: 'Demo mode — no payment gateway configured. Use verify endpoint to simulate payment.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, demoPaymentId } = req.body;

    const order = await Order.findById(orderId).populate('jobId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Already paid.', order });
    }

    // Razorpay verification
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

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

    // Demo mode verification
    if (demoPaymentId || order.paymentMethod === 'demo') {
      order.paymentStatus = 'paid';
      order.paymentId = demoPaymentId || order.paymentId;
      await order.save();

      return res.json({ success: true, message: 'Demo payment verified!', order });
    }

    res.status(400).json({ success: false, message: 'Invalid payment data.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('jobId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      amount: order.amount,
      paymentId: order.paymentId,
      paymentMethod: order.paymentMethod,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
