const router = require('express').Router();
const { getAllUsers, getAllJobsAdmin, getAllOrdersAdmin, getDashboardStats, updateUserRole, toggleUserStatus } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.use(adminAuth); // All admin routes require admin role

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/jobs', getAllJobsAdmin);
router.get('/orders', getAllOrdersAdmin);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle', toggleUserStatus);

module.exports = router;
