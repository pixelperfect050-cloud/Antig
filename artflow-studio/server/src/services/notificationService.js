const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO } = require('./socketService');

/**
 * Create a notification, save to DB, and emit via socket in real-time.
 * @param {Object} opts
 * @param {string} opts.userId - target user's ObjectId
 * @param {string} opts.type - notification type enum value
 * @param {string} opts.title - short title
 * @param {string} opts.message - descriptive message
 * @param {string} [opts.link] - redirect URL on click
 * @param {Object} [opts.meta] - extra data
 * @returns {Promise<Object>} saved notification
 */
async function notify({ userId, type, title, message, link = '', meta = {} }) {
  try {
    const notification = await Notification.create({ userId, type, title, message, link, meta });
    // Push via socket to the specific user's room
    getIO()?.to(`user-${userId}`).emit('notification', notification);
    return notification;
  } catch (err) {
    console.error('❌ Notification error:', err.message);
    return null;
  }
}

/**
 * Notify all admins about something.
 * @param {Object} opts - same as notify(), minus userId
 */
async function notifyAdmins({ type, title, message, link = '', meta = {} }) {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const notifications = await Promise.all(
      admins.map((admin) =>
        Notification.create({ userId: admin._id, type, title, message, link, meta })
      )
    );
    // Also emit to the admin socket room
    const io = getIO();
    if (io) {
      notifications.forEach((n) => {
        io.to(`user-${n.userId}`).emit('notification', n);
      });
      io.to('admin-room').emit('notification', notifications[0]); // For admin-room listeners
    }
    return notifications;
  } catch (err) {
    console.error('❌ Admin notification error:', err.message);
    return [];
  }
}

module.exports = { notify, notifyAdmins };
