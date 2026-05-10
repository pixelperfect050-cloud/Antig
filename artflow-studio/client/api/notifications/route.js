const { connectDB } = require('../../db');
const Notification = require('../../models/Notification');

module.exports = async function handler(req, res) {
  await connectDB();
  const { method, url } = req;
  const authModule = await import('../../middleware/auth.js');

  const wrapAuth = (mw, fn) => new Promise((resolve) => { mw(req, res, () => { fn().then(resolve).catch((e) => { res.status(500).json({ success: false, message: e.message }); resolve(); }); }); });

  if (method === 'GET') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
      const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
      return res.json({ success: true, notifications, unreadCount });
    });
  }

  if (method === 'PATCH' && url?.match(/\/\w+\/read$/)) {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      const id = url.split('/')[2];
      const notification = await Notification.findOneAndUpdate({ _id: id, userId: req.user._id }, { isRead: true }, { new: true });
      if (!notification) return res.status(404).json({ success: false, message: 'Not found.' });
      return res.json({ success: true, notification });
    });
  }

  if (method === 'PATCH' && url === '/read-all') {
    return wrapAuth(authModule.auth, async () => {
      if (res.headersSent) return;
      await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
      return res.json({ success: true, message: 'All notifications marked as read.' });
    });
  }

  return res.status(404).json({ success: false, message: 'Not found.' });
};
