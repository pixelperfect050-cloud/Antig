import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Briefcase, Clock, CheckCircle2, PlusCircle, ArrowUpRight, TrendingUp, Coins, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../services/api';
import socket from '../services/socket';
import { format, formatDistanceToNow } from 'date-fns';

const statusBadge = { pending: 'badge badge-pending', 'in-review': 'badge badge-review', 'in-progress': 'badge badge-progress', revision: 'badge badge-revision', completed: 'badge badge-completed', cancelled: 'badge badge-cancelled' };
const statusProgress = { pending: 10, 'in-review': 30, 'in-progress': 60, revision: 50, completed: 100, cancelled: 0 };
const progressColor = { pending: 'bg-gray-400', 'in-review': 'bg-blue-500', 'in-progress': 'bg-orange-500', revision: 'bg-amber-500', completed: 'bg-green-500', cancelled: 'bg-red-400' };

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

function AnimatedNumber({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => typeof value === 'string' ? value : Math.round(v).toString());
  const [text, setText] = useState('0');
  useEffect(() => {
    if (!inView || typeof value === 'string') { setText(String(value)); return; }
    const ctrl = animate(mv, value, { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] });
    const unsub = display.on('change', (v) => setText(v));
    return () => { ctrl.stop(); unsub(); };
  }, [inView, value]);
  return <span ref={ref}>{text}</span>;
}

function AnimatedBar({ width, color, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={inView ? { width: `${width}%` } : {}}
        transition={{ duration: 1.2, delay, ease: [0.25, 0.1, 0.25, 1] }}
        className={`h-full rounded-full ${color}`} />
    </div>
  );
}

const notifIcon = {
  order_created: '🛒', order_ready: '📦', order_delivered: '✅',
  payment_success: '💳', job_status: '📋', review_request: '⭐',
  credits_earned: '🪙', credits_used: '💰', welcome: '🎉', admin_alert: '🛡️',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/jobs/user').then(({ data }) => setJobs(data.jobs)).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { socket.on('job-updated', (u) => setJobs((p) => p.map((j) => (j._id === u._id ? u : j)))); return () => socket.off('job-updated'); }, []);

  const total = jobs.length;
  const active = jobs.filter((j) => !['completed', 'cancelled'].includes(j.status)).length;
  const completed = jobs.filter((j) => j.status === 'completed').length;

  const stats = [
    { label: 'Total Orders', value: total, icon: Briefcase, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-500' },
    { label: 'Active Jobs', value: active, icon: Clock, color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-500' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-500' },
    { label: 'Success Rate', value: total ? Math.round((completed / total) * 100) + '%' : '—', icon: TrendingUp, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-500' },
  ];

  const recentNotifs = notifications.slice(0, 5);

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link to="/jobs/create" className="btn-primary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"><PlusCircle className="w-4 h-4" /> New Job</Link>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : stats.map(({ label, value, icon: Icon, bg, text }, i) => (
          <motion.div key={i} variants={fade} whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }}
            className="card p-5 cursor-default transition-shadow">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300 }}
              className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${text}`} />
            </motion.div>
            <p className="text-2xl font-display font-bold text-gray-900"><AnimatedNumber value={value} /></p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Credits Card */}
      <motion.div variants={fade} className="mb-8">
        <motion.div whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
          style={{
            background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 50%, #0B1220 100%)',
            boxShadow: '0 8px 32px rgba(11,18,32,0.3)',
          }}>
          {/* Decorative */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #ff7a18, transparent 70%)' }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-8"
            style={{ background: 'radial-gradient(circle, #ff7a18, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff7a18, #ff5722)' }}>
                <Coins className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-0.5">Your Coin Balance</p>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={user?.credits}
                    initial={{ scale: 1.3, color: '#ff7a18' }}
                    animate={{ scale: 1, color: '#fff' }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl sm:text-4xl font-display font-black text-white">
                    {user?.credits || 0}
                  </motion.span>
                  <span className="text-sm text-gray-500">coins</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Total earned: {user?.totalCreditsEarned || 0} coins</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[10px]">✓</span>
                <span>+10 coins on signup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">★</span>
                <span>+20 coins per completed order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">%</span>
                <span>5% cashback on payments</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Two Column: Recent Jobs + Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <motion.div variants={fade} className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-gray-900">Recent Jobs</h2>
            <Link to="/jobs" className="text-sm text-[#1E40AF] hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
          {loading ? <div className="p-5 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          : jobs.length === 0 ? (
            <div className="p-16 text-center"><Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm mb-1">No jobs yet</p><Link to="/jobs/create" className="text-sm text-[#1E40AF] hover:underline">Create your first job →</Link></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {jobs.slice(0, 5).map((job, idx) => (
                <motion.div key={job._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-400">{job.serviceType.replace(/-/g, ' ')} · {format(new Date(job.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <span className={statusBadge[job.status]}>{job.status.replace(/-/g, ' ')}</span>
                  </div>
                  <AnimatedBar width={statusProgress[job.status]} color={progressColor[job.status]} delay={0.4 + idx * 0.1} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Notifications */}
        <motion.div variants={fade} className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" /> Recent Alerts
            </h2>
          </div>
          {recentNotifs.length === 0 ? (
            <div className="p-16 text-center">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentNotifs.map((n, idx) => (
                <motion.div key={n._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`px-5 py-3.5 flex gap-3 hover:bg-gray-50/50 transition-colors ${!n.isRead ? 'bg-orange-50/20' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sm flex-shrink-0">
                    {notifIcon[n.type] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#ff7a18' }} />}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
