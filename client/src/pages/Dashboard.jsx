import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Briefcase, Clock, CheckCircle2, PlusCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';

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

export default function Dashboard() {
  const { user } = useAuth();
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
    </motion.div>
  );
}
