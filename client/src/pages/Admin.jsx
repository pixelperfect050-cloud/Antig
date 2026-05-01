import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Briefcase, Users, Package, ChevronDown, ChevronUp, Upload, Search, DollarSign, UserPlus, Trash2, CheckCircle2, XCircle, MoreVertical, MessageSquare, Send } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { BACKEND_URL } from '../config';
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

const allStatuses = ['pending', 'in-review', 'in-progress', 'revision', 'completed', 'cancelled'];

function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

export default function Admin() {
  const [jobs, setJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalJobs: 0, totalOrders: 0, paidOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'orders', 'users', 'quotes'
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [quoteReply, setQuoteReply] = useState({ adminReply: '', quotedPrice: '', quotedTurnaround: '' });

  const fetchData = async () => {
    try {
      const [j, o, u, s] = await Promise.all([
        api.get('/admin/jobs'),
        api.get('/admin/orders'),
        api.get('/admin/users'),
        api.get('/admin/stats')
      ]);
      setJobs(j.data.jobs);
      setOrders(o.data.orders);
      setUsers(u.data.users);
      setStats(s.data.stats);
      // Fetch quotes separately (non-blocking)
      try {
        const q = await api.get('/quotes/all');
        setQuotes(q.data.quotes || []);
      } catch { /* quotes endpoint may not exist yet */ }
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    socket.on('new-job', (j) => {
      setJobs((p) => [j, ...p]);
      setStats(p => ({ ...p, totalJobs: p.totalJobs + 1 }));
    });
    socket.on('job-updated', (u) => setJobs((p) => p.map((j) => (j._id === u._id ? u : j))));
    return () => {
      socket.off('new-job');
      socket.off('job-updated');
    };
  }, []);

  const updateJobStatus = async (jobId, status, price) => {
    try {
      const { data } = await api.put(`/jobs/${jobId}/status`, { status, price });
      setJobs(p => p.map(j => j._id === jobId ? data.job : j));
      toast.success(`Updated to ${status}`);
      if (status === 'completed') fetchData(); // Refresh to show new order
    } catch {
      toast.error('Update failed');
    }
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
      fetchData();
    } catch {
      toast.error('Upload failed');
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle`);
      setUsers(p => p.map(u => u._id === userId ? data.user : u));
      toast.success('User status updated');
    } catch {
      toast.error('Failed to update user');
    }
  };

  const filteredItems = () => {
    const q = search.toLowerCase();
    if (activeTab === 'jobs') return jobs.filter(j => j.title?.toLowerCase().includes(q) || j.userId?.name?.toLowerCase().includes(q));
    if (activeTab === 'orders') return orders.filter(o => o.jobId?.title?.toLowerCase().includes(q) || o.userId?.name?.toLowerCase().includes(q));
    if (activeTab === 'users') return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    if (activeTab === 'quotes') return quotes.filter(qt => qt.name?.toLowerCase().includes(q) || qt.email?.toLowerCase().includes(q) || qt.service?.toLowerCase().includes(q));
    return [];
  };

  const replyToQuote = async (quoteId) => {
    try {
      const { data } = await api.put(`/quotes/${quoteId}/reply`, quoteReply);
      setQuotes(p => p.map(q => q._id === quoteId ? data.quote : q));
      setQuoteReply({ adminReply: '', quotedPrice: '', quotedTurnaround: '' });
      toast.success('Quote reply sent!');
    } catch {
      toast.error('Reply failed');
    }
  };

  const deleteQuote = async (quoteId) => {
    try {
      await api.delete(`/quotes/${quoteId}`);
      setQuotes(p => p.filter(q => q._id !== quoteId));
      toast.success('Quote deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E40AF]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-sm text-gray-500">Monitor system performance and manage users</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Revenue', value: `₹${stats.totalRevenue}`, icon: DollarSign, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Active Orders', value: stats.totalOrders, icon: Package, bg: 'bg-orange-50', color: 'text-orange-600' },
          { label: 'Paid Orders', value: stats.paidOrders, icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: 'bg-purple-50', color: 'text-purple-600' }
        ].map((stat, i) => (
          <div key={i} className="card p-5 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-gray-900">{loading ? '—' : stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-1">
          {[
            { id: 'jobs', label: 'All Jobs', icon: Briefcase },
            { id: 'orders', label: 'Deliveries', icon: Package },
            { id: 'quotes', label: 'Quote Requests', icon: MessageSquare },
            { id: 'users', label: 'User Management', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setExpanded(null); setSearch(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-[#1E40AF] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Quick search..."
                className="input-field pl-10 !py-2.5 !text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems().map((item) => (
                <div key={item._id} className="card overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
                  <div 
                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(expanded === item._id ? null : item._id)}
                  >
                    <div className="flex-1 min-w-0">
                      {activeTab === 'users' ? (
                        <>
                          <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                          <p className="text-xs text-gray-400">{item.email} · {item.role.toUpperCase()}</p>
                        </>
                      ) : activeTab === 'quotes' ? (
                        <>
                          <h3 className="font-semibold text-sm text-gray-900">{item.name} — {item.service}</h3>
                          <p className="text-xs text-gray-400">{item.email} {item.company && `· ${item.company}`} · {format(new Date(item.createdAt), 'MMM d, yyyy')}</p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-semibold text-sm text-gray-900 truncate">{item.title || (item.jobId?.title || 'Order')}</h3>
                          <p className="text-xs text-gray-400">
                            {item.userId?.name || 'User'} · {format(new Date(item.createdAt), 'MMM d, yyyy')}
                            {item.amount > 0 && <span className="ml-2 font-bold text-blue-600">₹{item.amount}</span>}
                          </p>
                        </>
                      )}
                    </div>
                    {activeTab === 'users' ? (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {item.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    ) : activeTab === 'quotes' ? (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'quoted' ? 'bg-blue-50 text-blue-600' :
                        item.status === 'accepted' ? 'bg-green-50 text-green-600' :
                        item.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>{item.status?.toUpperCase()}</span>
                    ) : (
                      <span className={statusBadge[item.status]}>{item.status.replace(/-/g, ' ')}</span>
                    )}
                    {expanded === item._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>

                  <AnimatePresence>
                    {expanded === item._id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-50 p-6 bg-gray-50/30 space-y-4"
                      >
                        {activeTab === 'jobs' && (
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Update Status & Pricing</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {allStatuses.map((s) => (
                                    <button 
                                      key={s} 
                                      onClick={() => updateJobStatus(item._id, s, priceInput || item.price)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${item.status === s ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                      {s.toUpperCase().replace(/-/g, ' ')}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Set Job Price (₹)</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="number" 
                                    defaultValue={item.price}
                                    onChange={(e) => setPriceInput(e.target.value)}
                                    placeholder="Enter price..."
                                    className="input-field !py-2 !text-sm max-w-[120px]"
                                  />
                                  <button onClick={() => updateJobStatus(item._id, item.status, priceInput)} className="btn-primary !py-2 !px-4 text-xs">Save Price</button>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Details</p>
                              {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                              {item.instructions && (
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Client Instructions</p>
                                  <p className="text-xs text-amber-800 leading-relaxed">{item.instructions}</p>
                                </div>
                              )}
                              {item.files?.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  {item.files.map((f, idx) => (
                                    <a key={idx} href={`${BACKEND_URL}/uploads/${f.filename}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-medium text-gray-600 hover:border-blue-300 transition-colors">
                                      {f.originalName}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {activeTab === 'orders' && (
                          <div className="max-w-xl space-y-4">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Upload Delivery Files</p>
                              <div className="bg-white p-4 rounded-xl border border-dashed border-gray-300">
                                <input type="file" multiple onChange={(e) => setDeliveryFiles([...e.target.files])} className="text-xs text-gray-500 mb-4 block w-full" />
                                <textarea 
                                  value={deliveryNotes} 
                                  onChange={(e) => setDeliveryNotes(e.target.value)} 
                                  className="input-field min-h-[80px] resize-y mb-4 !text-sm" 
                                  placeholder="Delivery notes or instructions for client..." 
                                />
                                <button onClick={() => uploadDelivery(item._id)} className="btn-primary w-full flex items-center justify-center gap-2">
                                  <Upload className="w-4 h-4" /> Complete & Deliver
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'users' && (
                          <div className="flex flex-wrap items-center gap-4">
                            <button 
                              onClick={() => toggleUserStatus(item._id)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${item.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                              {item.isActive ? <><XCircle className="w-4 h-4" /> DEACTIVATE USER</> : <><CheckCircle2 className="w-4 h-4" /> ACTIVATE USER</>}
                            </button>

                            <button 
                              onClick={async () => {
                                try {
                                  const newRole = item.role === 'admin' ? 'user' : 'admin';
                                  const { data } = await api.put(`/admin/users/${item._id}/role`, { role: newRole });
                                  setUsers(p => p.map(u => u._id === item._id ? data.user : u));
                                  toast.success(`Role changed to ${newRole}`);
                                } catch { toast.error('Role update failed'); }
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all"
                            >
                              <UserPlus className="w-4 h-4" /> {item.role === 'admin' ? 'REVOKE ADMIN' : 'MAKE ADMIN'}
                            </button>

                            <p className="text-xs text-gray-400 italic">User since {format(new Date(item.createdAt), 'MMMM yyyy')}</p>
                          </div>
                        )}

                        {activeTab === 'quotes' && (
                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer's Request</p>
                              <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                              {item.phone && <p className="text-xs text-gray-500">📞 {item.phone}</p>}
                            </div>

                            {/* Uploaded Reference Images */}
                            {item.files?.length > 0 && (
                              <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">📎 Uploaded Files</p>
                                <div className="flex flex-wrap gap-3">
                                  {item.files.map((f, idx) => {
                                    const isImage = f.mimetype?.startsWith('image/');
                                    const fileUrl = `${BACKEND_URL}/uploads/quotes/${f.filename}`;
                                    return (
                                      <a key={idx} href={fileUrl} target="_blank" rel="noreferrer"
                                        className="group relative block">
                                        {isImage ? (
                                          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-100 group-hover:border-[#ff7a18] transition-colors shadow-sm">
                                            <img src={fileUrl} alt={f.originalName} className="w-full h-full object-cover" />
                                          </div>
                                        ) : (
                                          <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-gray-100 group-hover:border-[#ff7a18] flex flex-col items-center justify-center gap-1 transition-colors">
                                            <Upload className="w-5 h-5 text-gray-400" />
                                            <span className="text-[9px] text-gray-400 px-1 truncate max-w-full">{f.originalName?.split('.').pop()?.toUpperCase()}</span>
                                          </div>
                                        )}
                                        <p className="text-[9px] text-gray-400 mt-1 truncate max-w-[96px] text-center">{f.originalName}</p>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* External File Link */}
                            {item.fileLink && (
                              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">🔗 Shared File Link</p>
                                <a href={item.fileLink} target="_blank" rel="noreferrer"
                                  className="text-sm text-purple-700 hover:text-purple-900 underline break-all">
                                  {item.fileLink}
                                </a>
                              </div>
                            )}

                            {item.adminReply && (
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Your Reply</p>
                                <p className="text-sm text-blue-800">{item.adminReply}</p>
                                {item.quotedPrice > 0 && <p className="text-sm font-bold text-blue-700 mt-1">Price: ₹{item.quotedPrice}</p>}
                                {item.quotedTurnaround && <p className="text-xs text-blue-600">Turnaround: {item.quotedTurnaround}</p>}
                              </div>
                            )}
                            <div className="bg-white p-4 rounded-xl border border-dashed border-gray-300">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Reply to Quote</p>
                              <textarea
                                value={quoteReply.adminReply}
                                onChange={(e) => setQuoteReply(p => ({ ...p, adminReply: e.target.value }))}
                                className="input-field min-h-[80px] resize-y mb-3 !text-sm"
                                placeholder="Your response to the customer..."
                              />
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <input type="number" placeholder="Quoted Price (₹)" value={quoteReply.quotedPrice}
                                  onChange={(e) => setQuoteReply(p => ({ ...p, quotedPrice: e.target.value }))}
                                  className="input-field !py-2 !text-sm" />
                                <input type="text" placeholder="Turnaround (e.g. 24 hours)" value={quoteReply.quotedTurnaround}
                                  onChange={(e) => setQuoteReply(p => ({ ...p, quotedTurnaround: e.target.value }))}
                                  className="input-field !py-2 !text-sm" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => replyToQuote(item._id)} className="btn-primary flex items-center gap-2 !py-2">
                                  <Send className="w-4 h-4" /> Send Quote
                                </button>
                                <button onClick={() => deleteQuote(item._id)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {filteredItems().length === 0 && (
                <div className="p-12 text-center text-gray-400 italic">No {activeTab} found matching your search.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
