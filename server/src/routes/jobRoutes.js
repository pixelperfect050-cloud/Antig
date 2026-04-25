const router = require('express').Router();
const { createJob, getUserJobs, getAllJobs, getJobById, updateJobStatus } = require('../controllers/jobController');
const { auth, adminAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/create', auth, upload.array('files', 10), createJob);
router.get('/user', auth, getUserJobs);
router.get('/all', adminAuth, getAllJobs);
router.get('/:id', auth, getJobById);
router.put('/:id/status', adminAuth, updateJobStatus);

module.exports = router;
