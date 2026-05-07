import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Search, Filter, Trash2, Edit3, Plus, CreditCard, CheckCircle2, Clock, AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = {
  pending: 'badge badge-pending',
  'in-review': 'badge badge-review',
  'in-progress': 'badge badge-progress',
  revision: 'badge badge-revision',
  completed: 'badge badge-completed',
  cancelled: 'badge badge-cancelled'
};

const priorityColor = {
  low: 'bg-gray-400',
  normal: 'bg-blue-400',
  high: 'bg-amber-400',
  urgent: 'bg-red-400'
};

function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [orderedJobs, setOrderedJobs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, ordersRes] = await Promise.all([
          api.get('/jobs/user'),
          api.get('/orders/user')
        ]);
        setJobs(jobsRes.data.jobs);
        setOrderedJobs(ordersRes.data.orders.map(o => (o.jobId?._id || o.jobId)));
      } catch (err) {
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    socket.on('job-updated', (u) => setJobs((p) => p.map((j) => (j._id === u._id ? u : j))));
    socket.on('job-deleted', ({ id }) => setJobs((p) => p.filter((j) => j._id !== id)));
    return () => {
      socket.off('job-updated');
      socket.off('job-deleted');
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter(j => j._id !== id));
      toast.success('Job deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCreateOrder = async (jobId) => {
    try {
      const { data } = await api.post('/orders', { jobId });
      setOrderedJobs((prev) => [...prev, jobId]);
      toast.success('Order created! View it in Orders tab.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    }
  };

  const filtered = jobs
    .filter((j) => filter === 'all' || j.status === filter)
    .filter((j) => j.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your artwork requests</p>
        </div>
        <Link to="/jobs/create" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Job Request
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input-field pl-10 !py-2.5" 
            placeholder="Search jobs..." 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {['all', 'pending', 'in-review', 'in-progress', 'completed'].map((s) => (
            <button 
              key={s} 
              onClick={() => setFilter(s)} 
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${filter === s ? 'bg-[#1E40AF] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
            >
              {s === 'all' ? 'All Jobs' : s.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-900 font-medium">No jobs found</p>
          <p className="text-sm text-gray-500 mt-1 mb-6">Try adjusting your filters or search terms</p>
          <Link to="/jobs/create" className="text-[#1E40AF] text-sm font-medium hover:underline flex items-center gap-1">
            Create your first job <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((job) => (
              <motion.div 
                key={job._id} 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="card-hover p-6 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${priorityColor[job.priority]}`} title={`${job.priority} priority`} />
                      <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                      <span className={statusBadge[job.status]}>{job.status.replace(/-/g, ' ')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {job.serviceType.replace(/-/g, ' ')}</span>
                      <span>{format(new Date(job.createdAt), 'MMM d, yyyy · h:mm a')}</span>
                      {job.price > 0 && <span className="text-gray-900 font-medium">₹{job.price}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && (
                      orderedJobs.includes(job._id) ? (
                        <Link to="/orders" className="flex items-center gap-1.5 text-[11px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ORDER READY
                        </Link>
                      ) : (
                        <button 
                          onClick={() => handleCreateOrder(job._id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> CREATE ORDER
                        </button>
                      )
                    )}
                    
                    {['pending', 'in-review'].includes(job.status) && (
                      <>
                        <button 
                          onClick={() => handleDelete(job._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {job.description && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{job.description}</p>
                )}
                
                {job.statusHistory?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Last update: {format(new Date(job.statusHistory[job.statusHistory.length - 1].changedAt), 'MMM d, h:mm a')}</span>
                    {job.files?.length > 0 && <span>{job.files.length} attachment{job.files.length !== 1 ? 's' : ''}</span>}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
