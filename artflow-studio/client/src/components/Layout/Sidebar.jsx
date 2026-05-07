import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, PlusCircle, Briefcase, Package, ShieldCheck, LogOut, PenTool, X, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs/create', icon: PlusCircle, label: 'New Job' },
  { to: '/jobs', icon: Briefcase, label: 'My Jobs' },
  { to: '/orders', icon: Package, label: 'Orders' },
  { to: '/rewards', icon: Coins, label: 'Rewards' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm ${
      isActive ? 'bg-blue-50 text-[#1E40AF] font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`;

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-5 pb-6">
        <div className="flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E40AF] flex items-center justify-center"><PenTool className="w-4 h-4 text-white" /></div>
            <span className="text-sm font-display font-bold text-gray-900">ArtFlow</span>
          </NavLink>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-3.5 mb-2">Menu</p>
        {navItems.map(({ to, icon: Icon, label }, i) => (
          <motion.div key={to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}>
            <NavLink to={to} className={linkClass} onClick={onClose}><Icon className="w-[18px] h-[18px]" /><span>{label}</span></NavLink>
          </motion.div>
        ))}
        {isAdmin && (
          <>
            <div className="my-3 mx-3.5 border-t border-gray-100" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-3.5 mb-2">Admin</p>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <NavLink to="/admin" className={linkClass} onClick={onClose}><ShieldCheck className="w-[18px] h-[18px]" /><span>Admin Panel</span></NavLink>
            </motion.div>
          </>
        )}
      </nav>

      {/* Credits Card in Sidebar */}
      {user && (
        <div className="px-3 mb-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl p-3.5 border border-amber-100/60"
            style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff7a18, #ff5722)' }}>
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">My Coins</p>
                <p className="text-lg font-display font-bold text-amber-800">{user.credits || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="p-3 mt-auto">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          {isAdmin && <div className="flex items-center gap-1.5 mb-2 px-1"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600"><ShieldCheck className="w-2.5 h-2.5" />Admin</span></div>}
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[240px] flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200">{content}</aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-gray-200 lg:hidden">{content}</motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
