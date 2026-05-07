import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const typeIcon = {
  order_created: '🛒',
  order_ready: '📦',
  order_delivered: '✅',
  payment_success: '💳',
  job_status: '📋',
  review_request: '⭐',
  credits_earned: '🪙',
  credits_used: '💰',
  welcome: '🎉',
  admin_alert: '🛡️',
};

const typeBg = {
  order_created: 'bg-blue-50',
  order_ready: 'bg-emerald-50',
  order_delivered: 'bg-green-50',
  payment_success: 'bg-purple-50',
  job_status: 'bg-orange-50',
  review_request: 'bg-amber-50',
  credits_earned: 'bg-yellow-50',
  credits_used: 'bg-red-50',
  welcome: 'bg-pink-50',
  admin_alert: 'bg-indigo-50',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
        id="notification-bell"
      >
        <Bell className="w-[18px] h-[18px]" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #ff7a18, #ff5722)',
                boxShadow: '0 2px 8px rgba(255,122,24,0.5)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl border border-gray-100 overflow-hidden z-50"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #ff7a18, #ff5722)' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[400px] scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                  <p className="text-xs text-gray-300 mt-1">We'll notify you when something happens</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <motion.button
                    key={n._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-5 py-3.5 flex gap-3 transition-all duration-200 hover:bg-gray-50 border-b border-gray-50 last:border-0 group ${
                      !n.isRead ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl ${typeBg[n.type] || 'bg-gray-50'} flex items-center justify-center flex-shrink-0 text-sm`}>
                      {typeIcon[n.type] || '🔔'}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[13px] leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} group-hover:text-[#ff7a18] transition-colors`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background: 'linear-gradient(135deg, #ff7a18, #ff5722)' }} />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1 font-medium">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
