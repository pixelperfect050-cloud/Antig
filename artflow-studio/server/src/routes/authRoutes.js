const router = require('express').Router();
const { signup, login, getMe, forgotPassword, verifyResetCode, resetPassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;
