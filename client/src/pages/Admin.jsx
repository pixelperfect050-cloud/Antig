import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Briefcase, Users, Package, ChevronDown, ChevronUp, Upload, Search, DollarSign, TrendingUp, UserCheck, UserX, Crown } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = { pending: 'badge badge-pending', 'in-review': 'badge badge-review', 'in-progress': 'badge badge-progress', revision: 'badge badge-revision', completed: 'badge badge-completed', cancelled: 'badge badge-cancelled' };
const allStatuses = ['pending', 'in-review', 'in-progress', 'revision', 'completed', 'cancelled'];
const paymentColors = { unpaid: 'text-red-500', pending: 'text-amber-500', paid: 'text-green-500', failed: 'text-red-500' };
function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

export default function Admin() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [priceInput, setPriceInput] = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/jobs'),
      api.get('/admin/orders'),
      api.get('/admin/users'),
    ]).then(([s, j, o, u]) => {
      setStats(s.data.stats);
      setJobs(j.data.jobs);
      setOrders(o.data.orders);
      setUsers(u.data.users);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    socket.on('new-job', (j) => setJobs((p) => [j, ...p]));
    socket.on('job-updated', (u) => setJobs((p) => p.map((j) => (j._id === u._id ? u : j))));
    socket.on('new-order', (o) => setOrders((p) => [o, ...p]));
    return () => { socket.off('new-job'); socket.off('job-updated'); socket.off('new-order'); };
  }, []);

  const updateStatus = async (jobId, status) => {
    try {
      const price = priceInput[jobId];
      const body = { status };
      if (price !== undefined) body.price = parseFloat(price);
      await api.put(`/jobs/${jobId}/status`, body);
      toast.success(`Updated to ${status.replace(/-/g, ' ')}`);
      // Refresh orders if completed
      if (status === 'completed') {
        const { data } = await api.get('/admin/orders');
        setOrders(data.orders);
      }
    } catch { toast.error('Failed'); }
  };

  const uploadDelivery = async (orderId) => {
    if (!deliveryFiles.length) return toast.error('Select files');
    const fd = new FormData();
    deliveryFiles.forEach((f) => fd.append('files', f));
    fd.append('deliveryNotes', deliveryNotes);
    try {
      await api.post(`/orders/${orderId}/deliver`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Delivered!');
      setDeliveryFiles([]);
      setDeliveryNotes('');
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders);
    } catch { toast.error('Failed'); }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers((p) => p.map((u) => (u._id === userId ? { ...u, role } : u)));
      toast.success(`Role updated to ${role}`);
    } catch { toast.error('Failed'); }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle`);
      setUsers((p) => p.map((u) => (u._id === userId ? data.user : u)));
      toast.success(`User ${data.user.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  const filteredJobs = jobs.filter((j) => j.title?.toLowerCase().includes(search.toLowerCase()) || j.userId?.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter((o) => o.jobId?.title?.toLowerCase().includes(search.toLowerCase()) || o.userId?.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: 'jobs', label: 'Jobs', icon: Briefcase, count: jobs.length },
    { id: 'orders', label: 'Orders', icon: Package, count: orders.length },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-[#1E40AF]" /></div>
        <div><h1 className="text-2xl font-display font-bold text-gray-900">Admin Panel</h1><p className="text-sm text-gray-500">Manage jobs, orders, users & payments</p></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Users', value: stats?.totalUsers || 0, icon: Users, bg: 'bg-indigo-50', color: 'text-indigo-500' },
          { label: 'Jobs', value: stats?.totalJobs || 0, icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-500' },
          { label: 'Active', value: jobs.filter(j => !['completed','cancelled'].includes(j.status)).length, icon: TrendingUp, bg: 'bg-orange-50', color: 'text-orange-500' },
          { label: 'Orders', value: stats?.totalOrders || 0, icon: Package, bg: 'bg-green-50', color: 'text-green-500' },
          { label: 'Revenue', value: `₹${stats?.totalRevenue || 0}`, icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-500' },
        ].map(({ label, value, icon: Icon, bg, color }, i) => (
          <div key={i} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <p className="text-2xl font-display font-bold text-gray-900">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === id ? 'bg-[#1E40AF] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
            <Icon className="w-4 h-4" />{label}<span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 !py-2.5" placeholder="Search..." /></div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div> : (
        <>
          {/* JOBS TAB */}
          {activeTab === 'jobs' && (
            <div className="space-y-3">{filteredJobs.map((job) => {
              const order = orders.find((o) => (o.jobId?._id || o.jobId) === job._id);
              return (
                <div key={job._id} className="card overflow-hidden">
                  <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === job._id ? null : job._id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{job.title}</h3>
                        {job.price > 0 && <span className="text-xs text-green-600 font-semibold">₹{job.price}</span>}
                      </div>
                      <p className="text-xs text-gray-400">{job.userId?.name || 'User'} · {job.serviceType?.replace(/-/g, ' ')} · {format(new Date(job.createdAt), 'MMM d')}</p>
                    </div>
                    <span className={statusBadge[job.status]}>{job.status.replace(/-/g, ' ')}</span>
                    {expanded === job._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                  {expanded === job._id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-100 p-5 space-y-4">
                      {job.description && <p className="text-sm text-gray-500">{job.description}</p>}
                      {job.instructions && <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Instructions:</span> {job.instructions}</p>}
                      {/* Price Setting */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Price (₹):</label>
                        <input type="number" value={priceInput[job._id] !== undefined ? priceInput[job._id] : (job.price || '')} onChange={(e) => setPriceInput({...priceInput, [job._id]: e.target.value})} className="input-field !py-2 !w-32" placeholder="0" />
                      </div>
                      <div><p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                        <div className="flex flex-wrap gap-1.5">{allStatuses.map((s) => (
                          <button key={s} onClick={() => updateStatus(job._id, s)} disabled={job.status === s} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${job.status === s ? statusBadge[s].replace('badge ', '') : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{s.replace(/-/g, ' ')}</button>
                        ))}</div>
                      </div>
                      {order && <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Delivery</p>
                        <p className="text-xs text-gray-400 mb-2">Payment: <span className={paymentColors[order.paymentStatus] || 'text-gray-500'}>{order.paymentStatus}</span> · Amount: ₹{order.amount}</p>
                        <input type="file" multiple onChange={(e) => setDeliveryFiles([...e.target.files])} className="text-sm text-gray-500 mb-2 block" />
                        <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} className="input-field min-h-[60px] resize-y mb-3" placeholder="Notes..." />
                        <button onClick={() => uploadDelivery(order._id)} className="btn-primary text-sm !px-5 !py-2.5">Upload & Deliver</button>
                      </div>}
                    </motion.div>
                  )}
                </div>
              );
            })}</div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-3">{filteredOrders.length === 0 ? (
              <div className="card p-16 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No orders yet</p></div>
            ) : filteredOrders.map((order) => (
              <div key={order._id} className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{order.jobId?.title || 'Order'}</h3>
                    <p className="text-xs text-gray-400">{order.userId?.name || 'User'} · {format(new Date(order.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">₹{order.amount || 0}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : order.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{order.paymentStatus || 'unpaid'}</span>
                    <span className={statusBadge[order.status]}>{order.status}</span>
                  </div>
                </div>
                {order.deliveryFiles?.length > 0 && <p className="text-xs text-gray-400 mt-2">{order.deliveryFiles.length} delivery file(s)</p>}
                {order.rating && <div className="flex items-center gap-1 mt-2"><span className="text-xs text-gray-400">Rating:</span>{[...Array(5)].map((_, i) => <span key={i} className={`text-xs ${i < order.rating ? 'text-amber-400' : 'text-gray-300'}`}>★</span>)}</div>}
              </div>
            ))}</div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-3">{filteredUsers.length === 0 ? (
              <div className="card p-16 text-center"><Users className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No users found</p></div>
            ) : filteredUsers.map((user) => (
              <div key={user._id} className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{user.name?.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-gray-900 truncate">{user.name}</h3>
                      {user.role === 'admin' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600"><Crown className="w-2.5 h-2.5" />Admin</span>}
                      {!user.isActive && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-400">{user.email}{user.company && ` · ${user.company}`}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateUserRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                      <Crown className="w-3 h-3" />{user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button onClick={() => toggleUserStatus(user._id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${user.isActive ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                      {user.isActive ? <><UserCheck className="w-3 h-3" />Active</> : <><UserX className="w-3 h-3" />Inactive</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}</div>
          )}
        </>
      )}
    </motion.div>
  );
}
