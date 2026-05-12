const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { awardSignupBonus } = require('../services/creditService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'artflow_secret', { expiresIn: '7d' });

exports.signup = async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }
    if (company && company.length > 100) {
      return res.status(400).json({ success: false, message: 'Company name is too long.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed, company: company?.trim() || '', phone: phone?.trim() || '' });
    const token = generateToken(user._id);

    awardSignupBonus(user._id).catch(() => {});
    notify({
      userId: user._id,
      type: 'welcome',
      title: 'Welcome to ArtFlow Studio!',
      message: `Hi ${name.split(' ')[0]}, welcome aboard! You've received 10 bonus coins. Start your first job to earn more rewards.`,
      link: '/dashboard',
    }).catch(() => {});

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log(`[AUTH] Login failed: User not found for email ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`[AUTH] Login failed: Password mismatch for email ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated.' });

    const token = generateToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
