const { connectDB } = require('../db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'artflow_studio_jwt_secret_2024_xK9mP2', { expiresIn: '7d' });
}

async function awardSignupBonus(userId) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);
    await User.findByIdAndUpdate(userId, {
      $inc: { credits: 50, totalCreditsEarned: 50 },
      $set: { creditsExpiresAt: expiresAt },
    });
  } catch (_) {}
}

async function notify(userId, type, title, message, link = '', meta = {}) {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    await Notification.create({ userId, type, title, message, link, meta });
  } catch (_) {}
}

module.exports = async function handler(req, res) {
  await connectDB();
  const { method } = req;

  if (method === 'POST' && req.url === '/signup') {
    try {
      const { name, email, password, company, phone } = req.body;
      if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email: email.toLowerCase(), password: hashed, company: company || '', phone: phone || '' });
      const token = generateToken(user._id);
      awardSignupBonus(user._id);
      notify(user._id, 'welcome', 'Welcome to ArtFlow Studio!', `Hi ${name.split(' ')[0]}, welcome aboard! You've received 50 bonus coins. Start your first job to earn more rewards.`, '/dashboard').catch(() => {});
      return res.status(201).json({ success: true, token, user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'POST' && req.url === '/login') {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      const token = generateToken(user._id);
      return res.json({ success: true, token, user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'GET' && req.url === '/me') {
    const authModule = await import('../middleware/auth.js');
    return new Promise((resolve) => {
      authModule.auth(req, res, () => {
        if (res.headersSent) { resolve(); return; }
        return res.json({ success: true, user: req.user });
      });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
