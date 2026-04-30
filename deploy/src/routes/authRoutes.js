const router = require('express').Router();
const { signup, login, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);

module.exports = router;
