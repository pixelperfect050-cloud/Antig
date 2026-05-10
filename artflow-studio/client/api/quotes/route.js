const { connectDB } = require('../../db');
const Quote = require('../../models/Quote');

module.exports = async function handler(req, res) {
  await connectDB();
  const { method, url } = req;

  if (method === 'POST') {
    try {
      const { name, email, phone, company, service, description, fileLink } = req.body;
      if (!name || !email || !service || !description) {
        return res.status(400).json({ success: false, message: 'Name, email, service, and description are required.' });
      }
      const quote = await Quote.create({ name, email, phone, company, service, description, fileLink: fileLink || '' });
      return res.status(201).json({ success: true, quote, message: 'Quote request submitted! We will get back to you soon.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'GET') {
    const authModule = await import('../../middleware/auth.js');
    return new Promise((resolve) => {
      authModule.adminAuth(req, res, async () => {
        if (res.headersSent) { resolve(); return; }
        try {
          const quotes = await Quote.find().sort({ createdAt: -1 });
          return res.json({ success: true, quotes });
        } catch (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
      });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
