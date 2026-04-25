import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, Filter } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';

const statusBadge = { pending: 'badge badge-pending', 'in-review': 'badge badge-review', 'in-progress': 'badge badge-progress', revision: 'badge badge-revision', completed: 'badge badge-completed', cancelled: 'badge badge-cancelled' };
const statusProgress = { pending: 10, 'in-review': 30, 'in-progress': 60, revision: 50, completed: 100, cancelled: 0 };
const progressColor = { pending: 'bg-gray-400', 'in-review': 'bg-blue-500', 'in-progress': 'bg-orange-500', revision: 'bg-amber-500', completed: 'bg-green-500', cancelled: 'bg-red-400' };
const priorityDot = { low: 'bg-gray-400', normal: 'bg-blue-400', high: 'bg-amber-400', urgent: 'bg-red-400' };
function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.get('/jobs/user').then(({ data }) => setJobs(data.jobs)).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { socket.on('job-updated', (u) => setJobs((p) => p.map((j) => (j._id === u._id ? u : j)))); return () => socket.off('job-updated'); }, []);

  const filtered = jobs.filter((j) => filter === 'all' || j.status === filter).filter((j) => j.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8"><h1 className="text-2xl font-display font-bold text-gray-900">My Jobs</h1><p className="text-sm text-gray-500 mt-1">{jobs.length} total</p></div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 !py-2.5" placeholder="Search jobs..." />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'pending', 'in-progress', 'completed'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${filter === s ? 'bg-[#1E40AF] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>{s === 'all' ? 'All' : s.replace(/-/g, ' ')}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      : filtered.length === 0 ? (
        <div className="card p-16 text-center"><Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No jobs found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <motion.div key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-hover p-5">
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><h3 className="font-medium text-sm text-gray-900 truncate">{job.title}</h3><div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[job.priority]}`} title={job.priority} /></div>
                  <p className="text-xs text-gray-400">{job.serviceType.replace(/-/g, ' ')} · {format(new Date(job.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                </div>
                <span className={statusBadge[job.status]}>{job.status.replace(/-/g, ' ')}</span>
              </div>
              {job.description && <p className="text-sm text-gray-500 line-clamp-1 mb-3">{job.description}</p>}
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${progressColor[job.status]}`} style={{ width: `${statusProgress[job.status]}%` }} /></div>
              <div className="flex items-center justify-between mt-2"><span className="text-[10px] text-gray-400">{statusProgress[job.status]}% complete</span>{job.files?.length > 0 && <span className="text-[10px] text-gray-400">{job.files.length} file{job.files.length !== 1 ? 's' : ''}</span>}</div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
