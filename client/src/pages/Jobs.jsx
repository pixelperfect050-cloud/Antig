import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Search, Trash2, Edit3, X, Check, DollarSign } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { api.get('/jobs/user').then(({ data }) => setJobs(data.jobs)).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    socket.on('job-updated', (u) => setJobs((p) => p.map((j) => (j._id === u._id ? u : j))));
    socket.on('job-deleted', ({ _id }) => setJobs((p) => p.filter((j) => j._id !== _id)));
    return () => { socket.off('job-updated'); socket.off('job-deleted'); };
  }, []);

  const filtered = jobs.filter((j) => filter === 'all' || j.status === filter).filter((j) => j.title.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id) => {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((p) => p.filter((j) => j._id !== id));
      toast.success('Job deleted');
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete');
      setDeleteConfirm(null);
    }
  };

  const startEdit = (job) => {
    setEditingId(job._id);
    setEditForm({ title: job.title, description: job.description || '', price: job.price || 0 });
  };

  const saveEdit = async (id) => {
    try {
      const { data } = await api.put(`/jobs/${id}`, editForm);
      setJobs((p) => p.map((j) => (j._id === id ? data.job : j)));
      toast.success('Job updated');
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleCreateOrder = async (jobId) => {
    try {
      await api.post('/orders', { jobId });
      toast.success('Order created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    }
  };

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
              {editingId === job._id ? (
                <div className="space-y-3">
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="input-field !py-2" placeholder="Title" />
                  <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="input-field min-h-[60px] resize-y" placeholder="Description" />
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-[140px]">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})} className="input-field !py-2 pl-9" placeholder="Price" />
                    </div>
                    <button onClick={() => saveEdit(job._id)} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{job.title}</h3>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[job.priority]}`} title={job.priority} />
                        {job.price > 0 && <span className="text-xs text-green-600 font-semibold">₹{job.price}</span>}
                      </div>
                      <p className="text-xs text-gray-400">{job.serviceType.replace(/-/g, ' ')} · {format(new Date(job.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                    <span className={statusBadge[job.status]}>{job.status.replace(/-/g, ' ')}</span>
                  </div>
                  {job.description && <p className="text-sm text-gray-500 line-clamp-1 mb-3">{job.description}</p>}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${progressColor[job.status]}`} style={{ width: `${statusProgress[job.status]}%` }} /></div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{statusProgress[job.status]}% complete</span>
                    <div className="flex items-center gap-1.5">
                      {job.files?.length > 0 && <span className="text-[10px] text-gray-400">{job.files.length} file{job.files.length !== 1 ? 's' : ''}</span>}
                      {job.status === 'completed' && (
                        <button onClick={() => handleCreateOrder(job._id)} className="text-[10px] text-[#1E40AF] font-medium hover:underline ml-2">Create Order</button>
                      )}
                      {!['in-progress', 'in-review', 'completed'].includes(job.status) && (
                        <>
                          <button onClick={() => startEdit(job)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ml-1" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                          {deleteConfirm === job._id ? (
                            <div className="flex items-center gap-1 ml-1">
                              <button onClick={() => handleDelete(job._id)} className="text-[10px] px-2 py-1 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100">Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-[10px] px-2 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(job._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
