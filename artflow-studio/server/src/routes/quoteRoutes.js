const router = require('express').Router();
const { submitQuote, getAllQuotes, replyToQuote, deleteQuote } = require('../controllers/quoteController');
const { adminAuth } = require('../middleware/auth');
const { quoteUpload } = require('../middleware/upload');

// Public route — no auth required, up to 2 image files
router.post('/submit', quoteUpload.array('files', 2), submitQuote);

// Admin routes
router.get('/all', adminAuth, getAllQuotes);
router.put('/:id/reply', adminAuth, replyToQuote);
router.delete('/:id', adminAuth, deleteQuote);

module.exports = router;
