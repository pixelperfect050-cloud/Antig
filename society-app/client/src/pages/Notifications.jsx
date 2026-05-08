import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const Notifications = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleSocketEvent = (eventData) => {
        console.log('Socket event received:', eventData);
        fetchNotifications();
      };

      socket.on('notification_received', handleSocketEvent);
      socket.on('payment_recorded', handleSocketEvent);
      socket.on('expense_added', handleSocketEvent);
      socket.on('user_status_updated', handleSocketEvent);

      return () => {
        socket.off('notification_received', handleSocketEvent);
        socket.off('payment_recorded', handleSocketEvent);
        socket.off('expense_added', handleSocketEvent);
        socket.off('user_status_updated', handleSocketEvent);
      };
    }
  }, [socket]);

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
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{data.unreadCount || 0} unread messages</p>
        </div>
        {data.unreadCount > 0 && (
          <button className="btn btn--primary btn--sm mt-2 sm:mt-0" onClick={markAllRead}>
            ✓ Read All
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3">
        {data.notifications.map(notif => {
          const isRead = notif.readBy?.includes(user?.id || user?._id);
          return (
            <div key={notif._id} 
              className={`card group transition-all cursor-pointer ${isRead ? 'opacity-80' : 'border-l-4 border-l-primary shadow-lg ring-1 ring-primary/10'}`}
              onClick={() => !isRead && markAsRead(notif._id)}>
              <div className="p-4 flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  isRead ? 'bg-slate-50 text-secondary' : 'bg-primary-light text-primary'
                }`}>
                  {typeIcons[notif.type] || '📌'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-black truncate pr-4 ${isRead ? 'text-secondary' : 'text-slate-900'}`}>
                      {notif.title}
                    </h3>
                    {!isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse"></div>
                    )}
                  </div>
                  
                  <p className={`text-xs leading-relaxed mb-3 ${isRead ? 'text-secondary' : 'text-slate-600 font-medium'}`}>
                    {notif.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-tighter">
                    <span className="shrink-0">🕒</span>
                    <span className="truncate">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {data.notifications.length === 0 && (
          <div className="empty-state p-20">
            <div className="text-6xl mb-6">🔔</div>
            <h2 className="text-xl font-black mb-2">All Caught Up</h2>
            <p className="text-secondary">You don't have any new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
