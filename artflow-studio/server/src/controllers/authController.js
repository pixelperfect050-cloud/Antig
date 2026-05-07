const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { awardSignupBonus } = require('../services/creditService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'artflow_secret', { expiresIn: '7d' });

exports.signup = async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, company: company || '', phone: phone || '' });
    const token = generateToken(user._id);

    // Award signup bonus credits (10 coins) + send welcome notification
    awardSignupBonus(user._id).catch(() => {});
    notify({
      userId: user._id,
      type: 'welcome',
      title: '🎉 Welcome to ArtFlow Studio!',
      message: `Hi ${name.split(' ')[0]}, welcome aboard! You've received 10 bonus coins. Start your first job to earn more rewards.`,
      link: '/dashboard',
    }).catch(() => {});

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = generateToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
