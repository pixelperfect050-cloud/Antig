const Quote = require('../models/Quote');

// Public — anyone can submit a quote request (with optional file uploads)
exports.submitQuote = async (req, res) => {
  try {
    const { name, email, phone, company, service, description, fileLink } = req.body;
    if (!name || !email || !service || !description) {
      return res.status(400).json({ success: false, message: 'Name, email, service, and description are required.' });
    }

    // Process uploaded files
    const files = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
    }));

    const quote = await Quote.create({
      name, email, phone, company, service, description,
      files,
      fileLink: fileLink || '',
    });
    
    // Notify admin via socket if available
    const io = req.app.get('io');
    if (io) io.to('admin-room').emit('new-quote', quote);

    res.status(201).json({ success: true, quote, message: 'Quote request submitted! We will get back to you soon.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin — get all quotes
exports.getAllQuotes = async (_req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json({ success: true, quotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin — reply to a quote
exports.replyToQuote = async (req, res) => {
  try {
    const { adminReply, quotedPrice, quotedTurnaround, status } = req.body;
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { adminReply, quotedPrice, quotedTurnaround, status: status || 'quoted' },
      { new: true }
    );
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found.' });
    res.json({ success: true, quote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin — delete a quote
exports.deleteQuote = async (req, res) => {
  try {
    await Quote.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quote deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
