const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { awardSignupBonus } = require('../services/creditService');
const { sendResetCode } = require('../services/emailService');

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

// ─── FORGOT PASSWORD: Send 6-digit OTP to email ───
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't reveal whether email exists — return success either way
      return res.json({ success: true, message: 'If this email is registered, a verification code has been sent.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send email
    await sendResetCode(user.email, code, user.name);

    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('[AUTH] Forgot password error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.' });
  }
};

// ─── VERIFY RESET CODE ───
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email?.trim() || !code?.trim()) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
    }

    if (user.resetCode !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    if (user.resetCodeExpires < new Date()) {
      user.resetCode = null;
      user.resetCodeExpires = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    }

    res.json({ success: true, message: 'Code verified successfully.' });
  } catch (err) {
    console.error('[AUTH] Verify code error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RESET PASSWORD ───
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email?.trim() || !code?.trim() || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
    }

    if (user.resetCode !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    if (user.resetCodeExpires < new Date()) {
      user.resetCode = null;
      user.resetCodeExpires = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    }

    // Update password and clear reset code
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('[AUTH] Reset password error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
