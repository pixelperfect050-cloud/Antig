import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Notifications = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const result = await api.get('/api/notifications');
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const typeIcons = {
    payment_reminder: '💰',
    expense_update: '📋',
    announcement: '📢',
    maintenance: '🔧',
    general: '📌',
    success: '✅',
    info: 'ℹ️'
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{data.unreadCount} unread</p>
        </div>
        {data.unreadCount > 0 && (
          <button className="btn btn--outline" onClick={markAllRead} id="mark-all-read-btn">
            ✓ Mark All Read
          </button>
        )}
      </div>

      <div className="notification-list">
        {data.notifications.map(notif => {
          const isRead = notif.readBy?.includes(user?.id || user?._id);
          return (
            <div key={notif._id} className={`notification-card ${isRead ? '' : 'unread'}`}
              onClick={() => !isRead && markAsRead(notif._id)}>
              <div className="notification-icon">{typeIcons[notif.type] || '📌'}</div>
              <div className="notification-content">
                <div className="notification-title">{notif.title}</div>
                <div className="notification-message">{notif.message}</div>
                <div className="notification-time">
                  {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              {!isRead && <div className="notification-dot"></div>}
            </div>
          );
        })}
        {data.notifications.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h2>No notifications</h2>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
