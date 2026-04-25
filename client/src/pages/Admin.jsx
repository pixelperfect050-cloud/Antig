import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Briefcase, Users, Package, ChevronDown, ChevronUp, Upload, Search } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = { pending: 'badge badge-pending', 'in-review': 'badge badge-review', 'in-progress': 'badge badge-progress', revision: 'badge badge-revision', completed: 'badge badge-completed', cancelled: 'badge badge-cancelled' };
const allStatuses = ['pending', 'in-review', 'in-progress', 'revision', 'completed', 'cancelled'];
function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

export default function Admin() {
  const [jobs, setJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => { Promise.all([api.get('/jobs/all'), api.get('/orders/all')]).then(([j, o]) => { setJobs(j.data.jobs); setOrders(o.data.orders); }).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { socket.on('new-job', (j) => setJobs((p) => [j, ...p])); socket.on('job-updated', (u) => setJobs((p) => p.map((j) => (j._id === u._id ? u : j)))); return () => { socket.off('new-job'); socket.off('job-updated'); }; }, []);

  const updateStatus = async (jobId, status) => { try { await api.put(`/jobs/${jobId}/status`, { status }); toast.success(`Updated to ${status.replace(/-/g, ' ')}`); } catch { toast.error('Failed'); } };
  const uploadDelivery = async (orderId) => {
    if (!deliveryFiles.length) return toast.error('Select files');
    const fd = new FormData(); deliveryFiles.forEach((f) => fd.append('files', f)); fd.append('deliveryNotes', deliveryNotes);
    try { await api.post(`/orders/${orderId}/deliver`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Delivered!'); setDeliveryFiles([]); setDeliveryNotes(''); const { data } = await api.get('/orders/all'); setOrders(data.orders); } catch { toast.error('Failed'); }
  };

  const filteredJobs = jobs.filter((j) => j.title?.toLowerCase().includes(search.toLowerCase()) || j.userId?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-[#1E40AF]" /></div>
        <div><h1 className="text-2xl font-display font-bold text-gray-900">Admin Panel</h1><p className="text-sm text-gray-500">Manage jobs and deliveries</p></div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{ label: 'Total Jobs', value: jobs.length, icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-500' }, { label: 'Active', value: jobs.filter(j => !['completed','cancelled'].includes(j.status)).length, icon: Users, bg: 'bg-orange-50', color: 'text-orange-500' }, { label: 'Orders', value: orders.length, icon: Package, bg: 'bg-green-50', color: 'text-green-500' }].map(({ label, value, icon: Icon, bg, color }, i) => (
          <div key={i} className="card p-5"><div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div><p className="text-2xl font-display font-bold text-gray-900">{loading ? '—' : value}</p><p className="text-xs text-gray-500">{label}</p></div>
        ))}
      </div>

      <div className="relative max-w-sm mb-6"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 !py-2.5" placeholder="Search..." /></div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div> : (
        <div className="space-y-3">{filteredJobs.map((job) => {
          const order = orders.find((o) => (o.jobId?._id || o.jobId) === job._id);
          return (
            <div key={job._id} className="card overflow-hidden">
              <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === job._id ? null : job._id)}>
                <div className="flex-1 min-w-0"><h3 className="font-medium text-sm text-gray-900 truncate">{job.title}</h3><p className="text-xs text-gray-400">{job.userId?.name || 'User'} · {job.serviceType?.replace(/-/g, ' ')} · {format(new Date(job.createdAt), 'MMM d')}</p></div>
                <span className={statusBadge[job.status]}>{job.status.replace(/-/g, ' ')}</span>
                {expanded === job._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
              {expanded === job._id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-100 p-5 space-y-4">
                  {job.description && <p className="text-sm text-gray-500">{job.description}</p>}
                  {job.instructions && <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Instructions:</span> {job.instructions}</p>}
                  <div><p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-1.5">{allStatuses.map((s) => (
                      <button key={s} onClick={() => updateStatus(job._id, s)} disabled={job.status === s} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${job.status === s ? statusBadge[s].replace('badge ', '') : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{s.replace(/-/g, ' ')}</button>
                    ))}</div>
                  </div>
                  {order && <div className="pt-4 border-t border-gray-100"><p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Delivery</p><input type="file" multiple onChange={(e) => setDeliveryFiles([...e.target.files])} className="text-sm text-gray-500 mb-2 block" /><textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} className="input-field min-h-[60px] resize-y mb-3" placeholder="Notes..." /><button onClick={() => uploadDelivery(order._id)} className="btn-primary text-sm !px-5 !py-2.5">Upload & Deliver</button></div>}
                </motion.div>
              )}
            </div>
          );
        })}</div>
      )}
    </motion.div>
  );
}
