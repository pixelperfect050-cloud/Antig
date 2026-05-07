const router = require('express').Router();
const { getCoupons, scratch, redeem } = require('../controllers/scratchController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getCoupons);
router.post('/:id/scratch', auth, scratch);
router.post('/:id/redeem', auth, redeem);

module.exports = router;
