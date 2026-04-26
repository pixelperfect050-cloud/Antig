const router = require('express').Router();
const { createPaymentOrder, verifyPayment, getPaymentStatus } = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

router.post('/create-order', auth, createPaymentOrder);
router.post('/verify', auth, verifyPayment);
router.get('/status/:id', auth, getPaymentStatus);

module.exports = router;
