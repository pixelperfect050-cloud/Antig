const router = require('express').Router();
const { getCredits, redeemCredits } = require('../controllers/creditController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getCredits);
router.post('/redeem', auth, redeemCredits);

module.exports = router;
