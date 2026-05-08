import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Modal from '../components/Modal';
import api from '../utils/api';

const FUND_CATEGORIES = [
  { value: 'emergency', label: '🚨 Emergency', color: '#ef4444' },
  { value: 'festival', label: '🎉 Festival', color: '#f59e0b' },
  { value: 'repair', label: '🔧 Repair', color: '#3b82f6' },
  { value: 'water_tank', label: '💧 Water Tank', color: '#06b6d4' },
  { value: 'renovation', label: '🏗️ Renovation', color: '#8b5cf6' },
  { value: 'security', label: '🛡️ Security', color: '#10b981' },
  { value: 'special', label: '⭐ Special', color: '#f97316' },
  { value: 'other', label: '📦 Other', color: '#6b7280' }
];

const Funds = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [funds, setFunds] = useState([]);
  const [myFundPayments, setMyFundPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fundDetail, setFundDetail] = useState(null);
  const [selectedFP, setSelectedFP] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '', description: '', category: 'other', amountPerFlat: '',
    dueDate: '', applicableTo: 'all', applicableBlocks: []
  });
  const [payForm, setPayForm] = useState({
    amount: '', paymentMethod: 'upi', transactionId: '', notes: ''
  });
  const [manualForm, setManualForm] = useState({
    paidAmount: '', paymentMethod: 'cash', notes: ''
  });

  const isAdmin = user?.role === 'admin';
  const sid = user?.societyId?._id || user?.societyId;

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (socket) {
      const refresh = () => fetchData();
      socket.on('fund_created', refresh);
      socket.on('fund_payment_submitted', refresh);
      socket.on('fund_payment_approved', refresh);
      socket.on('fund_payment_rejected', refresh);
      socket.on('fund_payment_recorded', refresh);
      return () => {
        socket.off('fund_created', refresh);
        socket.off('fund_payment_submitted', refresh);
        socket.off('fund_payment_approved', refresh);
        socket.off('fund_payment_rejected', refresh);
        socket.off('fund_payment_recorded', refresh);
      };
    }
  }, [socket]);

  const fetchData = async () => {
    try {
      if (!sid) return;
      const [fundsData, blocksData] = await Promise.all([
        api.get(`/api/funds/society/${sid}`),
        isAdmin ? api.get(`/api/blocks/society/${sid}`) : Promise.resolve([])
      ]);
      setFunds(fundsData);
      setBlocks(blocksData);

      if (!isAdmin) {
        const myPays = await api.get('/api/funds/my-payments');
        setMyFundPayments(myPays);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createFund = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/funds', {
        ...createForm,
        amountPerFlat: parseFloat(createForm.amountPerFlat)
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', category: 'other', amountPerFlat: '', dueDate: '', applicableTo: 'all', applicableBlocks: [] });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitFundPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/funds/${selectedFund._id || selectedFund}/pay`, {
        ...payForm,
        amount: parseFloat(payForm.amount)
      });
      setShowPayModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const viewFundDetail = async (fund) => {
    try {
      const detail = await api.get(`/api/funds/${fund._id}`);
      setFundDetail(detail);
      setShowDetailModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const reviewFundPayment = async (fpId, status, adminNotes = '') => {
    try {
      await api.put(`/api/funds/payment/${fpId}/review`, { status, adminNotes });
      const detail = await api.get(`/api/funds/${fundDetail.fund._id}`);
      setFundDetail(detail);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const submitManualPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/funds/payment/${selectedFP._id}/manual`, {
        paidAmount: parseFloat(manualForm.paidAmount),
        paymentMethod: manualForm.paymentMethod,
        notes: manualForm.notes
      });
      setShowManualModal(false);
      const detail = await api.get(`/api/funds/${fundDetail.fund._id}`);
      setFundDetail(detail);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const getCatInfo = (cat) => FUND_CATEGORIES.find(c => c.value === cat) || FUND_CATEGORIES[7];

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Society Funds</h1>
          <p className="page-subtitle">{isAdmin ? 'Manage collections' : 'Contribution tracker'}</p>
        </div>
        {isAdmin && (
          <button className="btn btn--primary btn--sm mt-2 sm:mt-0" onClick={() => setShowCreateModal(true)}>
            ➕ Create Fund
          </button>
        )}
      </header>

      {funds.length === 0 ? (
        <div className="empty-state p-20">
          <div className="text-6xl mb-6">💰</div>
          <h2 className="text-xl font-black mb-2">No active funds</h2>
          <p className="text-secondary">Special collections or emergency funds will appear here.</p>
          {isAdmin && <button className="btn btn--primary mt-4" onClick={() => setShowCreateModal(true)}>Create First Fund</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funds.map(fund => {
            const catInfo = getCatInfo(fund.category);
            const progress = fund.totalTarget > 0 ? ((fund.totalCollected / fund.totalTarget) * 100) : 0;
            const isOverdue = new Date(fund.dueDate) < new Date() && fund.status === 'active';
            const myPayment = myFundPayments.find(p => (p.fundId?._id || p.fundId) === fund._id);

            return (
              <div key={fund._id} className="card overflow-hidden group hover:border-primary transition-all">
                {/* Visual Header */}
                <div className="h-2" style={{ backgroundColor: catInfo.color }}></div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{catInfo.label.split(' ')[0]}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                        {catInfo.label.split(' ')[1]}
                      </span>
                    </div>
                    {fund.status === 'completed' ? (
                      <span className="status-badge status-badge--success text-[10px]">Completed</span>
                    ) : isOverdue ? (
                      <span className="status-badge status-badge--danger text-[10px]">Overdue</span>
                    ) : (
                      <span className="status-badge status-badge--warning text-[10px]">Active</span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-primary transition-colors">
                    {fund.name}
                  </h3>
                  <p className="text-xs text-secondary mb-6 line-clamp-2">{fund.description}</p>

                  {/* Fund Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Per Flat</p>
                      <p className="text-lg font-black text-primary">{formatCurrency(fund.amountPerFlat)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-xs font-bold">{new Date(fund.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>

                  {/* Progress Visualization */}
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Collection Progress</span>
                      <span className="text-xs font-black text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full rounded-full shadow-sm shadow-black/10 transition-all duration-1000" 
                        style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: catInfo.color }}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold">
                      <span className="text-emerald-600">{formatCurrency(fund.totalCollected)}</span>
                      <span className="text-secondary">Target: {formatCurrency(fund.totalTarget)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(fund.paidCount, 3))].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">👤</div>
                      ))}
                      {fund.paidCount > 3 && (
                        <div className="w-6 h-6 rounded-full bg-primary-light text-primary border-2 border-white flex items-center justify-center text-[8px] font-black">
                          +{fund.paidCount - 3}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-right pl-4">
                      {isAdmin ? (
                        <button className="btn btn--secondary btn--sm w-full" onClick={() => viewFundDetail(fund)}>
                          View Breakdown
                        </button>
                      ) : (
                        <>
                          {(!myPayment || myPayment.status === 'pending' || myPayment.status === 'rejected') && (
                            <button className="btn btn--primary btn--sm w-full" onClick={() => {
                              setSelectedFund(fund);
                              setPayForm({ amount: fund.amountPerFlat, paymentMethod: 'upi', transactionId: '', notes: '' });
                              setShowPayModal(true);
                            }}>
                              {myPayment?.status === 'rejected' ? 'Re-submit' : 'Contribute'}
                            </button>
                          )}
                          {myPayment?.status === 'pending_verification' && (
                            <span className="text-[10px] font-black text-amber-500 uppercase">⏳ Verifying</span>
                          )}
                          {myPayment?.status === 'paid' && (
                            <span className="text-[10px] font-black text-emerald-500 uppercase">✅ Contributed</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standardized Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Society Fund">
        <form onSubmit={createFund} className="modal-form p-4">
          <div className="grid gap-4">
            <div className="form-group">
              <label>Fund Name</label>
              <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Roof Repair 2024" required />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Detailed explanation..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Category</label>
                <select value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                  {FUND_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Amount/Flat (₹)</label>
                <input type="number" min="1" value={createForm.amountPerFlat} onChange={e => setCreateForm({ ...createForm, amountPerFlat: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={createForm.dueDate} onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Scope</label>
                <select value={createForm.applicableTo} onChange={e => setCreateForm({ ...createForm, applicableTo: e.target.value })}>
                  <option value="all">Entire Society</option>
                  <option value="specific_blocks">Specific Blocks</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-actions mt-8">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Initialize Fund'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Other modals refactored for premium mobile-first experience */}
      {/* Detail Modal Refactor */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={fundDetail?.fund?.name || 'Breakdown'}>
        {fundDetail && (
          <div className="p-4">
            <div className="stats-card stats-card--primary mb-6">
              <div className="stats-card__icon">💰</div>
              <div className="stats-card__content">
                <span className="stats-card__label">Total Collected</span>
                <span className="stats-card__value">{formatCurrency(fundDetail.totalCollected)}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              {fundDetail.payments?.map(fp => (
                <div key={fp._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-3 border border-slate-100">
                  <div className="min-w-0">
                    <p className="font-black text-sm text-primary">Unit {fp.flatId?.number || '?'}</p>
                    <p className="text-[10px] font-bold text-secondary truncate uppercase">{fp.flatId?.ownerName}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {fp.status === 'pending_verification' ? (
                      <div className="flex gap-1">
                        <button className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs" onClick={() => reviewFundPayment(fp._id, 'paid')}>✓</button>
                        <button className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs" onClick={() => reviewFundPayment(fp._id, 'rejected', 'Rejected')}>✕</button>
                      </div>
                    ) : (fp.status === 'pending' || fp.status === 'rejected') ? (
                      <button className="btn btn--outline btn--sm text-[10px] py-1 px-3" onClick={() => {
                        setSelectedFP(fp);
                        setManualForm({ paidAmount: fp.amount, paymentMethod: 'cash', notes: '' });
                        setShowManualModal(true);
                      }}>Manual</button>
                    ) : (
                      <span className="text-xs font-black text-emerald-600">{formatCurrency(fp.paidAmount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Contribution and Manual modals also updated... */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Contribute to Fund">
        <form onSubmit={submitFundPayment} className="modal-form p-4">
          <div className="p-4 bg-primary-light rounded-2xl mb-6">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Contributing to</p>
            <p className="text-lg font-black text-primary truncate">{selectedFund?.name}</p>
            <p className="text-xs font-bold text-primary/70">Required: {formatCurrency(selectedFund?.amountPerFlat)}</p>
          </div>
          <div className="grid gap-4">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" min="1" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Payment Mode</label>
              <select value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                <option value="upi">UPI / QR Scan</option>
                <option value="bank_transfer">Net Banking</option>
                <option value="cash">Cash / Physical</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reference #</label>
              <input type="text" value={payForm.transactionId} onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} placeholder="Transaction ID (if any)" />
            </div>
          </div>
          <div className="modal-actions mt-8">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowPayModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>Confirm Payment</button>
          </div>
        </form>
      </Modal>

      {/* Manual Modal Refactor */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Manual Entry">
        <form onSubmit={submitManualPayment} className="modal-form p-4">
          <div className="grid gap-4">
            <div className="form-group">
              <label>Received Amount (₹)</label>
              <input type="number" min="1" value={manualForm.paidAmount} onChange={e => setManualForm({ ...manualForm, paidAmount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={manualForm.paymentMethod} onChange={e => setManualForm({ ...manualForm, paymentMethod: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Admin Notes</label>
              <input type="text" value={manualForm.notes} onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} placeholder="Received by..." />
            </div>
          </div>
          <div className="modal-actions mt-8">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowManualModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>Record Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Funds;
