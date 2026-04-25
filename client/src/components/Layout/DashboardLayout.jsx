import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { connectSocket, disconnectSocket } from '../../services/socket';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user) connectSocket(user._id, isAdmin);
    return () => disconnectSocket();
  }, [user, isAdmin]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[240px] min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-5">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-700 p-1.5 -ml-1 rounded-lg hover:bg-gray-100"><Menu className="w-5 h-5" /></button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><Bell className="w-[18px] h-[18px]" /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#1E40AF] rounded-full" /></button>
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-xs font-bold text-white ml-1">{user?.name?.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>
        <main className="p-5 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
