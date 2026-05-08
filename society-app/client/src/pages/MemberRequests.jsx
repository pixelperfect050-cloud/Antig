import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/api';

const MemberRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const data = await api.get(`/api/society/${user.societyId._id}/members?status=${filter}`);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, status) => {
    setProcessing(userId);
    try {
      await api.put(`/api/society/member/${userId}/status`, { status });
      setRequests(requests.filter(r => r._id !== userId));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setProcessing(userId);
    try {
      await api.delete(`/api/society/member/${userId}`);
      setRequests(requests.filter(r => r._id !== userId));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">Manage society access & roles</p>
        </div>
      </header>

      {/* Fluid Filter Tabs */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar p-2 gap-2 bg-slate-50/50">
          {[
            { id: 'pending', label: 'Pending', icon: '⏳' },
            { id: 'approved', label: 'Residents', icon: '✅' },
            { id: 'rejected', label: 'Rejected', icon: '✕' },
            { id: 'suspended', label: 'Suspended', icon: '🚫' }
          ].map(t => (
            <button key={t.id}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2 ${filter === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-secondary border border-slate-200'}`}
              onClick={() => setFilter(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="p-20 flex justify-center"><div className="spinner"></div></div>
        ) : requests.length === 0 ? (
          <div className="empty-state p-20">
            <div className="text-6xl mb-6">👥</div>
            <h2 className="text-xl font-black mb-2">No {filter} members</h2>
            <p className="text-secondary max-w-xs mx-auto">New registrations will appear here for your review and approval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div key={req._id} className="card group hover:border-primary transition-all p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-black text-lg shrink-0">
                    {req.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-black text-slate-900 truncate pr-2">{req.name}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-secondary">
                        {req.residentType}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-secondary truncate mb-1">{req.email}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary">Unit {req.flatId?.number || 'TBD'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-[10px] font-bold text-secondary">Joined {new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-black text-secondary">
                    <span>📞</span> {req.phone}
                  </div>
                  
                  <div className="flex gap-2">
                    {filter === 'pending' && (
                      <>
                        <button className="btn btn--primary btn--sm py-1.5 px-4 text-[10px]" 
                          onClick={() => handleAction(req._id, 'approved')} disabled={processing === req._id}>
                          {processing === req._id ? '...' : 'Approve'}
                        </button>
                        <button className="btn btn--secondary btn--sm py-1.5 px-4 text-[10px] text-rose-500 border-rose-100 bg-rose-50/50" 
                          onClick={() => handleAction(req._id, 'rejected')} disabled={processing === req._id}>
                          Reject
                        </button>
                      </>
                    )}
                    {filter === 'approved' && (
                      <button className="btn btn--secondary btn--sm py-1.5 px-4 text-[10px]" 
                        onClick={() => handleAction(req._id, 'suspended')} disabled={processing === req._id}>
                        Suspend
                      </button>
                    )}
                    {(filter === 'rejected' || filter === 'suspended') && (
                      <>
                        <button className="btn btn--primary btn--sm py-1.5 px-4 text-[10px]" 
                          onClick={() => handleAction(req._id, 'approved')} disabled={processing === req._id}>
                          Restore
                        </button>
                        <button className="btn btn--secondary btn--sm py-1.5 px-4 text-[10px] text-rose-500 border-rose-100 bg-rose-50/50" 
                          onClick={() => handleDelete(req._id)} disabled={processing === req._id}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberRequests;
