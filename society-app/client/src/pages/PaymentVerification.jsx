import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Modal from '../components/Modal';
import api from '../utils/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PaymentVerification = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', adminNotes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRequests(); }, [filter]);

  useEffect(() => {
    if (socket) {
      const refresh = () => fetchRequests();
      socket.on('payment_request_submitted', refresh);
      return () => socket.off('payment_request_submitted', refresh);
    }
  }, [socket]);

  const fetchRequests = async () => {
    try {
      const sid = user?.societyId?._id || user?.societyId;
      if (!sid) return;
      const url = filter === 'all'
        ? `/api/payment-requests/society/${sid}`
        : `/api/payment-requests/society/${sid}?status=${filter}`;
      const data = await api.get(url);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReview = (req) => {
    setSelectedReq(req);
    setReviewForm({ status: 'approved', adminNotes: '' });
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/payment-requests/${selectedReq._id}/review`, reviewForm);
      setShowReviewModal(false);
      fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const statusColors = {
    pending_verification: 'warning',
    approved: 'success',
    rejected: 'danger',
    correction_needed: 'info'
  };

  const statusLabels = {
    pending_verification: '⏳ Pending Verification',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
    correction_needed: '🔄 Correction Needed'
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Verification</h1>
          <p className="page-subtitle">{requests.length} payment requests</p>
        </div>
      </header>

      {/* Responsive Filter Tabs */}
      <div className="card mb-6">
        <div className="filter-tabs filter-tabs--sm w-full overflow-x-auto no-scrollbar p-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending_verification', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'correction_needed', label: 'Correction' }
          ].map(f => (
            <button key={f.key}
              className={`filter-tab filter-tab--${f.key === 'all' ? 'primary' : statusColors[f.key]} ${filter === f.key ? 'active' : ''}`}
              onClick={() => { setFilter(f.key); setLoading(true); }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state p-20">
          <div className="text-6xl mb-6">📋</div>
          <h2 className="text-xl font-black mb-2">Clear Records</h2>
          <p className="text-secondary">No {filter.replace('_', ' ')} requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(req => (
            <div key={req._id} className="card group hover:border-primary transition-all">
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center font-black">
                      {req.flatId?.number || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{req.submittedBy?.name}</p>
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                        {MONTHS[req.month - 1]} {req.year}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge status-badge--${statusColors[req.status]} text-[10px]`}>
                    {req.status === 'pending_verification' ? 'Pending' : req.status}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] font-black text-secondary uppercase">Amount</p>
                    <p className="text-lg font-black text-primary">{formatCurrency(req.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-secondary uppercase">Method</p>
                    <p className="text-xs font-bold truncate uppercase">{req.paymentMethod?.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {req.transactionId && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-secondary uppercase">Txn ID</span>
                      <span className="font-black font-mono bg-slate-100 px-2 py-0.5 rounded text-primary">{req.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-secondary uppercase tracking-widest">Submitted</span>
                    <span className="font-bold">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {req.status === 'pending_verification' ? (
                    <>
                      <button className="btn btn--primary btn--sm flex-1" onClick={() => openReview(req)}>Review</button>
                      {req.screenshotUrl && (
                        <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm px-3">🖼️</a>
                      )}
                    </>
                  ) : (
                    <button className="btn btn--secondary btn--sm w-full" onClick={() => openReview(req)}>View Details</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal - Standardized and Responsive */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Verify Payment">
        {selectedReq && (
          <form onSubmit={submitReview} className="modal-form p-4">
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">💰</div>
                <div>
                  <p className="text-2xl font-black text-primary">{formatCurrency(selectedReq.amount)}</p>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                    Flat {selectedReq.flatId?.number} • {MONTHS[selectedReq.month - 1]} {selectedReq.year}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-black text-secondary uppercase mb-1">Member</p>
                  <p className="font-bold">{selectedReq.submittedBy?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-secondary uppercase mb-1">Method</p>
                  <p className="font-bold uppercase">{selectedReq.paymentMethod?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="form-group">
                <label>Decision</label>
                <select value={reviewForm.status} onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })}>
                  <option value="approved">✅ Approve Payment</option>
                  <option value="correction_needed">🔄 Request Correction</option>
                  <option value="rejected">❌ Reject Payment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  value={reviewForm.adminNotes}
                  onChange={e => setReviewForm({ ...reviewForm, adminNotes: e.target.value })}
                  placeholder={reviewForm.status === 'rejected' ? 'Reason for rejection...' : 'Optional notes for member...'}
                  rows={3}
                  required={reviewForm.status !== 'approved'}
                />
              </div>
            </div>

            <div className="modal-actions mt-8">
              <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowReviewModal(false)}>Cancel</button>
              <button type="submit" 
                className={`btn flex-1 ${reviewForm.status === 'approved' ? 'btn--primary' : reviewForm.status === 'rejected' ? 'btn--danger' : 'btn--warning'}`} 
                disabled={saving}>
                {saving ? <span className="btn-spinner"></span> : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PaymentVerification;
