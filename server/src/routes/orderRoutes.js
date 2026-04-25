const router = require('express').Router();
const { getUserOrders, getAllOrders, getOrderById, uploadDelivery, downloadFile, submitFeedback } = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');
const { deliveryUpload } = require('../middleware/upload');

router.get('/user', auth, getUserOrders);
router.get('/all', adminAuth, getAllOrders);
router.get('/:id', auth, getOrderById);
router.post('/:id/deliver', adminAuth, deliveryUpload.array('files', 10), uploadDelivery);
router.get('/:id/download/:filename', auth, downloadFile);
router.post('/:id/feedback', auth, submitFeedback);

module.exports = router;
