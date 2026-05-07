const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a specific flat's owner(s)
 */
const notifyFlatOwner = async ({ flatId, societyId, title, message, type = 'info' }) => {
  try {
    // Find users associated with this flat
    const users = await User.find({ flatId, societyId });
    if (users.length === 0) return;

    const userIds = users.map(u => u._id);

    const notification = new Notification({
      societyId,
      title,
      message,
      type,
      targetAll: false,
      targetUsers: userIds
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Create a notification for all users in a society
 */
const notifyAllUsers = async ({ societyId, title, message, type = 'info' }) => {
  try {
    const notification = new Notification({
      societyId,
      title,
      message,
      type,
      targetAll: true
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  notifyFlatOwner,
  notifyAllUsers
};
