import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Modal from '../components/Modal';
import api from '../utils/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Payments = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [payments, setPayments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showBillModal, setShowBillModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [billForm, setBillForm] = useState({ amount: 3000 });
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [flats, setFlats] = useState([]);
  const isAdmin = user?.role === 'admin';

  // Manual entry form (admin)
  const [manualForm, setManualForm] = useState({
    flatId: '', amount: '', paidAmount: '', paymentMethod: 'cash',
    transactionId: '', notes: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

  // Member pay form (for existing bill)
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '', paymentMethod: 'upi', transactionId: '', notes: ''
  });

  // Member new request form (manual - no existing bill needed)
  const [newReqForm, setNewReqForm] = useState({
    month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    amount: '', paymentMethod: 'upi', transactionId: '', notes: ''
  });

  useEffect(() => { fetchPayments(); }, [monthFilter, yearFilter]);

  useEffect(() => {
    if (socket) {
      const refresh = () => fetchPayments();
      socket.on('payment_recorded', refresh);
      socket.on('payment_approved', refresh);
      socket.on('payment_rejected', refresh);
      socket.on('payment_request_submitted', refresh);
      return () => {
        socket.off('payment_recorded', refresh);
        socket.off('payment_approved', refresh);
        socket.off('payment_rejected', refresh);
        socket.off('payment_request_submitted', refresh);
      };
    }
  }, [socket]);

  const fetchPayments = async () => {
    try {
      const sid = user?.societyId?._id || user?.societyId;
      if (!sid) return;

      if (isAdmin) {
        const data = await api.get(`/api/payments/society/${sid}?month=${monthFilter}&year=${yearFilter}`);
        setPayments(data);
      } else {
        // Member: get own payments
        const data = await api.get('/api/dashboard/member-stats');
        setPayments(data.payments || []);
        // Also get pending payment requests
        const reqs = await api.get('/api/payment-requests/my-requests');
        setMyRequests(reqs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Admin: fetch flats for manual entry
  const openManualModal = async () => {
    try {
      const sid = user?.societyId?._id || user?.societyId;
      const blocksData = await api.get(`/api/blocks/society/${sid}`);
      setBlocks(blocksData);
      setFlats([]);
      setManualForm({
        flatId: '', amount: '', paidAmount: '', paymentMethod: 'cash',
        transactionId: '', notes: '', month: monthFilter, year: yearFilter
      });
      setShowManualModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const onBlockSelect = async (blockId) => {
    try {
      const data = await api.get(`/api/flats/block/${blockId}`);
      setFlats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const generateBills = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sid = user?.societyId?._id || user?.societyId;
      const result = await api.post('/api/payments/generate-bills', {
        societyId: sid, month: monthFilter, year: yearFilter,
        amount: parseFloat(billForm.amount)
      });
      alert(result.message);
      setShowBillModal(false);
      fetchPayments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Admin manual entry
  const submitManualEntry = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sid = user?.societyId?._id || user?.societyId;
      await api.post('/api/payments', {
        flatId: manualForm.flatId,
        societyId: sid,
        amount: parseFloat(manualForm.amount),
        paidAmount: parseFloat(manualForm.paidAmount),
        month: parseInt(manualForm.month),
        year: parseInt(manualForm.year),
        paymentMethod: manualForm.paymentMethod,
        transactionId: manualForm.transactionId,
        notes: manualForm.notes
      });
      setShowManualModal(false);
      alert('Payment recorded successfully!');
      fetchPayments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Member: open pay modal
  const openPayModal = (p) => {
    setSelectedPayment(p);
    setPayForm({ amount: p.amount - p.paidAmount, paymentMethod: 'upi', transactionId: '', notes: '' });
    setShowPayModal(true);
  };

  // Member: submit payment request
  const submitPaymentRequest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/payment-requests', {
        paymentId: selectedPayment._id,
        amount: parseFloat(payForm.amount),
        month: selectedPayment.month,
        year: selectedPayment.year,
        paymentMethod: payForm.paymentMethod,
        transactionId: payForm.transactionId,
        notes: payForm.notes
      });
      setShowPayModal(false);
      alert('✅ Payment submitted for verification! Admin will review shortly.');
      fetchPayments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Member: submit NEW manual payment request (no existing bill needed)
  const submitNewRequest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/payment-requests', {
        amount: parseFloat(newReqForm.amount),
        month: parseInt(newReqForm.month),
        year: parseInt(newReqForm.year),
        paymentMethod: newReqForm.paymentMethod,
        transactionId: newReqForm.transactionId,
        notes: newReqForm.notes
      });
      setShowNewRequestModal(false);
      setNewReqForm({
        month: new Date().getMonth() + 1, year: new Date().getFullYear(),
        amount: '', paymentMethod: 'upi', transactionId: '', notes: ''
      });
      alert('✅ Payment request submitted! Admin will verify shortly.');
      fetchPayments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const handleDownloadReceipt = async (p) => {
    try {
      await api.download(`/api/payments/${p._id}/receipt`, `Receipt_${p.month}_${p.year}_Flat_${p.flatId?.number || 'NA'}.pdf`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);
  const totalCollected = payments.reduce((s, p) => s + p.paidAmount, 0);
  const totalDue = payments.reduce((s, p) => s + Math.max(0, p.amount - p.paidAmount), 0);

  // Check if member has pending request for a specific month
  const hasPendingRequest = (month, year) => {
    return myRequests.some(r => r.month === month && r.year === year && r.status === 'pending_verification');
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">{isAdmin ? 'Manage bills & collections' : 'Your society dues'}</p>
        </div>
        <div className="page-actions mt-3 sm:mt-0">
          {isAdmin ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="btn btn--primary flex-1 sm:flex-initial" onClick={() => setShowBillModal(true)}>📄 Generate</button>
              <button className="btn btn--success flex-1 sm:flex-initial" onClick={openManualModal}>➕ Manual</button>
            </div>
          ) : (
            <button className="btn btn--primary w-full sm:w-auto" onClick={() => setShowNewRequestModal(true)}>📤 Submit Payment</button>
          )}
        </div>
      </header>

      {/* Primary Summary Stats */}
      <div className="stats-grid mb-6">
        <div className="stats-card stats-card--success">
          <div className="stats-card__icon">💰</div>
          <div className="stats-card__content">
            <span className="stats-card__label">Collected</span>
            <span className="stats-card__value">{formatCurrency(totalCollected)}</span>
          </div>
        </div>
        <div className="stats-card stats-card--danger">
          <div className="stats-card__icon">⏳</div>
          <div className="stats-card__content">
            <span className="stats-card__label">Pending</span>
            <span className="stats-card__value">{formatCurrency(totalDue)}</span>
          </div>
        </div>
        <div className="stats-card stats-card--primary">
          <div className="stats-card__icon">📊</div>
          <div className="stats-card__content">
            <span className="stats-card__label">Records</span>
            <span className="stats-card__value">{payments.length}</span>
          </div>
        </div>
      </div>

      {/* Responsive Filters Section */}
      <div className="card mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))} className="flex-1 min-h-[44px] rounded-lg border-slate-200 px-3 font-bold text-sm bg-slate-50">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value))} className="w-24 min-h-[44px] rounded-lg border-slate-200 px-3 font-bold text-sm bg-slate-50">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          
          <div className="filter-tabs filter-tabs--sm w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['all', 'paid', 'pending', 'partial'].map(s => (
              <button key={s} className={`filter-tab filter-tab--${s} ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Member Alerts */}
      {!isAdmin && (
        <div className="flex flex-col gap-3 mb-6">
          {myRequests.filter(r => r.status === 'pending_verification').length > 0 && (
            <div className="alert alert--info">
              <span>⏳</span>
              <p><strong>{myRequests.filter(r => r.status === 'pending_verification').length}</strong> payments awaiting approval.</p>
            </div>
          )}
          {myRequests.filter(r => r.status === 'rejected').length > 0 && (
            <div className="alert alert--error">
              <span>❌</span>
              <p><strong>{myRequests.filter(r => r.status === 'rejected').length}</strong> payments rejected. Check history below.</p>
            </div>
          )}
        </div>
      )}

      {/* Main Records Table */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Maintenance Records</h3>
          <span className="card-badge">{filtered.length} items</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {isAdmin && <th>Flat</th>}
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i}>
                  {isAdmin && (
                    <td>
                      <div className="flex flex-col">
                        <span className="font-black text-primary">{p.flatId?.number || '-'}</span>
                        <span className="text-[10px] text-secondary truncate max-w-[100px]">{p.flatId?.ownerName || '-'}</span>
                      </div>
                    </td>
                  )}
                  <td className="font-bold">{MONTHS[p.month - 1]?.slice(0, 3)} {p.year}</td>
                  <td className="font-black">{formatCurrency(p.amount)}</td>
                  <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      {!isAdmin && p.status !== 'paid' && !hasPendingRequest(p.month, p.year) && (
                        <button className="btn btn--sm btn--primary px-3" onClick={() => openPayModal(p)}>Pay</button>
                      )}
                      {!isAdmin && hasPendingRequest(p.month, p.year) && (
                        <span className="text-[10px] font-black uppercase text-warning tracking-tighter">⏳ Verifying</span>
                      )}
                      {p.status === 'paid' && (
                        <button className="btn--icon bg-slate-50 hover:bg-slate-100" onClick={() => handleDownloadReceipt(p)}>📥</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-center p-12 text-secondary">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member History Table */}
      {!isAdmin && myRequests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Request History</h3>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r, i) => (
                  <tr key={i}>
                    <td className="font-bold">{MONTHS[r.month - 1]?.slice(0, 3)} {r.year}</td>
                    <td className="font-black">{formatCurrency(r.amount)}</td>
                    <td>
                      <span className={`status-badge status-badge--${
                        r.status === 'approved' ? 'paid' :
                        r.status === 'pending_verification' ? 'warning' :
                        r.status === 'rejected' ? 'danger' : 'info'
                      }`}>
                        {r.status === 'pending_verification' ? 'Verifying' :
                         r.status === 'approved' ? 'Approved' :
                         r.status === 'rejected' ? 'Rejected' : 'Correction'}
                      </span>
                    </td>
                    <td className="text-[10px] font-bold text-secondary">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals - Standardized and Responsive */}
      <Modal isOpen={showBillModal} onClose={() => setShowBillModal(false)} title="Generate Bills">
        <form onSubmit={generateBills} className="modal-form p-4">
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border-l-4 border-primary">
            <p className="text-sm font-bold text-secondary">Billing Period</p>
            <p className="text-lg font-black">{MONTHS[monthFilter - 1]} {yearFilter}</p>
          </div>
          <div className="form-group mb-6">
            <label className="text-xs font-black uppercase tracking-widest text-secondary mb-2 block">Maintenance Amount (₹)</label>
            <input type="number" className="text-2xl font-black p-4" min="1" value={billForm.amount}
              onChange={e => setBillForm({ ...billForm, amount: e.target.value })} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowBillModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Create Bills'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Record Payment">
        <form onSubmit={submitManualEntry} className="modal-form p-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="grid gap-4">
            <div className="form-group">
              <label>Block</label>
              <select onChange={e => onBlockSelect(e.target.value)} required>
                <option value="">Select Block</option>
                {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Flat</label>
              <select value={manualForm.flatId} onChange={e => setManualForm({ ...manualForm, flatId: e.target.value })} required disabled={flats.length === 0}>
                <option value="">Select Flat</option>
                {flats.map(f => <option key={f._id} value={f._id}>{f.number} - {f.ownerName || 'Vacant'}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label>Month</label>
                <select value={manualForm.month} onChange={e => setManualForm({ ...manualForm, month: e.target.value })}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <select value={manualForm.year} onChange={e => setManualForm({ ...manualForm, year: e.target.value })}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label>Bill (₹)</label>
                <input type="number" value={manualForm.amount} onChange={e => setManualForm({ ...manualForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Paid (₹)</label>
                <input type="number" value={manualForm.paidAmount} onChange={e => setManualForm({ ...manualForm, paidAmount: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Method</label>
              <select value={manualForm.paymentMethod} onChange={e => setManualForm({ ...manualForm, paymentMethod: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="modal-actions mt-6">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowManualModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--success flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Save Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Pay Maintenance">
        {selectedPayment && (
          <form onSubmit={submitPaymentRequest} className="modal-form p-4">
            <div className="mb-4 p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-black text-secondary tracking-widest uppercase">Bill Amount</p>
              <p className="text-3xl font-black text-primary">{formatCurrency(selectedPayment.amount - selectedPayment.paidAmount)}</p>
              <p className="text-[10px] font-bold text-secondary mt-1">{MONTHS[selectedPayment.month - 1]} {selectedPayment.year}</p>
            </div>
            <div className="grid gap-4">
              <div className="form-group">
                <label>Paying Amount</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Method</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div className="form-group">
                <label>Transaction ID / Ref</label>
                <input type="text" value={payForm.transactionId} onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} placeholder="Reference number" />
              </div>
            </div>
            <div className="modal-actions mt-6">
              <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
                {saving ? <span className="btn-spinner"></span> : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={showNewRequestModal} onClose={() => setShowNewRequestModal(false)} title="Submit Payment">
        <form onSubmit={submitNewRequest} className="modal-form p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="form-group">
              <label>Month</label>
              <select value={newReqForm.month} onChange={e => setNewReqForm({ ...newReqForm, month: e.target.value })}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select value={newReqForm.year} onChange={e => setNewReqForm({ ...newReqForm, year: e.target.value })}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="form-group">
              <label>Amount Paid (₹)</label>
              <input type="number" value={newReqForm.amount} onChange={e => setNewReqForm({ ...newReqForm, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={newReqForm.paymentMethod} onChange={e => setNewReqForm({ ...newReqForm, paymentMethod: e.target.value })}>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transaction ID / Ref</label>
              <input type="text" value={newReqForm.transactionId} onChange={e => setNewReqForm({ ...newReqForm, transactionId: e.target.value })} placeholder="Reference number" />
            </div>
          </div>
          <div className="modal-actions mt-6">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowNewRequestModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
