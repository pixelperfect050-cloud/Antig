const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'artflow_studio_jwt_secret_2024_xK9mP2');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid token.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token expired or invalid.' });
  }
}

async function adminAuth(req, res, next) {
  await auth(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only.' });
    next();
  });
}

module.exports = { auth, adminAuth };
