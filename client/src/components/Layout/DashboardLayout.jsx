import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { connectSocket, disconnectSocket } from '../../services/socket';
import NotificationBell from '../shared/NotificationBell';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, refreshUser } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    connectSocket(user._id, isAdmin);

    const handleNotification = (n) => {
      // If notification is about credits, refresh the user object to update the badge
      if (n.type === 'credits_earned' || n.type === 'credits_used') {
        refreshUser();
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      disconnectSocket();
    };
  }, [user, isAdmin, refreshUser]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[240px] min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-5">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-700 p-1.5 -ml-1 rounded-lg hover:bg-gray-100"><Menu className="w-5 h-5" /></button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* Credits Badge */}
              {user && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/60">
                  <span className="text-sm">🪙</span>
                  <span className="text-xs font-bold text-amber-700">{user.credits || 0}</span>
                </div>
              )}
              <NotificationBell />
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-xs font-bold text-white ml-1">{user?.name?.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>
        <main className="p-5 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
