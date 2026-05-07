import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import socket from '../services/socket';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);

      // Show toast for the notification
      const icon = _getNotificationIcon(notification.type);
      toast(notification.title, {
        icon,
        duration: 4000,
        style: {
          background: '#0B1220',
          color: '#fff',
          border: '1px solid rgba(255,122,24,0.3)',
          borderRadius: '14px',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        },
      });
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [user, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err.message);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

function _getNotificationIcon(type) {
  switch (type) {
    case 'order_created': return '🛒';
    case 'order_ready': return '📦';
    case 'order_delivered': return '✅';
    case 'payment_success': return '💳';
    case 'job_status': return '📋';
    case 'review_request': return '⭐';
    case 'credits_earned': return '🪙';
    case 'credits_used': return '💰';
    case 'welcome': return '🎉';
    case 'admin_alert': return '🛡️';
    default: return '🔔';
  }
}
