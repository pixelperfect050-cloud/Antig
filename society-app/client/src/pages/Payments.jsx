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

  // Member pay form
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payForm, setPayForm] = useState({
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
      <div className="page-header">
        <div>
          <h1 className="page-title">🏠 Maintenance</h1>
          <p className="page-subtitle">{isAdmin ? 'Manage maintenance bills & payments' : 'Your maintenance payments'}</p>
        </div>
        {isAdmin && (
          <div className="btn-group">
            <button className="btn btn--primary" onClick={() => setShowBillModal(true)}>📄 Generate Bills</button>
            <button className="btn btn--success" onClick={openManualModal}>➕ Manual Entry</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        {isAdmin && (
          <div className="filter-group">
            <select value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))} className="filter-select">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value))} className="filter-select">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        <div className="filter-tabs filter-tabs--sm">
          {['all', 'paid', 'pending', 'partial'].map(s => (
            <button key={s} className={`filter-tab filter-tab--${s} ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="payment-summary">
        <div className="payment-summary-item payment-summary--collected">
          <span className="psi-label">Collected</span>
          <span className="psi-value">{formatCurrency(totalCollected)}</span>
        </div>
        <div className="payment-summary-item payment-summary--due">
          <span className="psi-label">Pending</span>
          <span className="psi-value">{formatCurrency(totalDue)}</span>
        </div>
        <div className="payment-summary-item payment-summary--count">
          <span className="psi-label">Records</span>
          <span className="psi-value">{payments.length}</span>
        </div>
      </div>

      {/* Member: Pending Requests Alert */}
      {!isAdmin && myRequests.filter(r => r.status === 'pending_verification').length > 0 && (
        <div className="alert alert--warning" style={{ marginBottom: '1rem' }}>
          ⏳ <strong>{myRequests.filter(r => r.status === 'pending_verification').length}</strong> payment(s) pending verification by admin.
        </div>
      )}

      {/* Rejected requests alert */}
      {!isAdmin && myRequests.filter(r => r.status === 'rejected').length > 0 && (
        <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
          ❌ <strong>{myRequests.filter(r => r.status === 'rejected').length}</strong> payment(s) were rejected. Please re-submit.
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{isAdmin ? 'All Maintenance Records' : 'My Maintenance Records'}</h3>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {isAdmin && <th>Flat</th>}
                {isAdmin && <th>Owner</th>}
                <th>Month</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Method</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i}>
                  {isAdmin && <td className="font-medium">{p.flatId?.number || '-'}</td>}
                  {isAdmin && <td>{p.flatId?.ownerName || '-'}</td>}
                  <td className="font-medium">{MONTHS[p.month - 1]?.slice(0, 3)} {p.year}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td className="text-success">{formatCurrency(p.paidAmount)}</td>
                  <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
                  <td>{p.paymentMethod?.replace('_', ' ') || '-'}</td>
                  <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td>
                    <div className="btn-group">
                      {/* Member: Pay button */}
                      {!isAdmin && p.status !== 'paid' && !hasPendingRequest(p.month, p.year) && (
                        <button className="btn btn--sm btn--primary" onClick={() => openPayModal(p)}>💰 Pay</button>
                      )}
                      {!isAdmin && hasPendingRequest(p.month, p.year) && (
                        <span className="status-badge status-badge--warning" style={{ fontSize: '.7rem' }}>⏳ Verifying</span>
                      )}
                      {/* Receipt */}
                      {p.status === 'paid' && (
                        <button className="btn--icon" onClick={() => handleDownloadReceipt(p)} title="Download Receipt">📥</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 10 : 8} className="text-center text-muted">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member: My Payment Requests History */}
      {!isAdmin && myRequests.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">My Payment Requests</h3>
            <span className="card-badge">{myRequests.length} requests</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Txn ID</th>
                  <th>Status</th>
                  <th>Admin Notes</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium">{MONTHS[r.month - 1]?.slice(0, 3)} {r.year}</td>
                    <td>{formatCurrency(r.amount)}</td>
                    <td>{r.paymentMethod?.replace('_', ' ') || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{r.transactionId || '-'}</td>
                    <td>
                      <span className={`status-badge status-badge--${
                        r.status === 'approved' ? 'paid' :
                        r.status === 'pending_verification' ? 'warning' :
                        r.status === 'rejected' ? 'danger' : 'info'
                      }`}>
                        {r.status === 'pending_verification' ? '⏳ Verifying' :
                         r.status === 'approved' ? '✅ Approved' :
                         r.status === 'rejected' ? '❌ Rejected' : '🔄 Correction'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '150px', fontSize: '.8rem' }}>{r.adminNotes || '-'}</td>
                    <td style={{ fontSize: '.8rem' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Bills Modal (Admin) */}
      <Modal isOpen={showBillModal} onClose={() => setShowBillModal(false)} title="Generate Monthly Bills">
        <form onSubmit={generateBills} className="modal-form">
          <div className="payment-info-box">
            <p>Generate bills for: <strong>{MONTHS[monthFilter - 1]} {yearFilter}</strong></p>
            <p>Bills will be created for all occupied flats that don't have a bill yet.</p>
          </div>
          <div className="form-group">
            <label>Maintenance Amount (₹)</label>
            <input type="number" min="1" value={billForm.amount}
              onChange={e => setBillForm({ ...billForm, amount: e.target.value })} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowBillModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Generate Bills'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Entry Modal (Admin) */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="➕ Manual Payment Entry">
        <form onSubmit={submitManualEntry} className="modal-form">
          <div className="payment-info-box">
            <p>Manually record a maintenance payment for a flat.</p>
            <p>Useful for cash payments, old records, or corrections.</p>
          </div>
          <div className="form-group">
            <label>Select Block</label>
            <select onChange={e => onBlockSelect(e.target.value)} required>
              <option value="">Select Block</option>
              {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Select Flat</label>
            <select value={manualForm.flatId} onChange={e => setManualForm({ ...manualForm, flatId: e.target.value })} required disabled={flats.length === 0}>
              <option value="">Select Flat</option>
              {flats.map(f => <option key={f._id} value={f._id}>{f.number} - {f.ownerName || 'Vacant'}</option>)}
            </select>
          </div>
          <div className="form-row">
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
          <div className="form-row">
            <div className="form-group">
              <label>Bill Amount (₹)</label>
              <input type="number" min="1" value={manualForm.amount}
                onChange={e => setManualForm({ ...manualForm, amount: e.target.value })} required placeholder="e.g. 3000" />
            </div>
            <div className="form-group">
              <label>Paid Amount (₹)</label>
              <input type="number" min="0" value={manualForm.paidAmount}
                onChange={e => setManualForm({ ...manualForm, paidAmount: e.target.value })} required placeholder="e.g. 3000" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Payment Method</label>
              <select value={manualForm.paymentMethod} onChange={e => setManualForm({ ...manualForm, paymentMethod: e.target.value })}>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
                <option value="cheque">📝 Cheque</option>
                <option value="online">🌐 Online</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transaction ID</label>
              <input type="text" value={manualForm.transactionId}
                onChange={e => setManualForm({ ...manualForm, transactionId: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input type="text" value={manualForm.notes}
              onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} placeholder="e.g. Collected by secretary" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowManualModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : '💾 Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Member: Pay Maintenance Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="💰 Pay Maintenance">
        {selectedPayment && (
          <form onSubmit={submitPaymentRequest} className="modal-form">
            <div className="payment-info-box">
              <p>Paying for: <strong>{MONTHS[selectedPayment.month - 1]} {selectedPayment.year}</strong></p>
              <p>Due Amount: <strong>{formatCurrency(selectedPayment.amount - selectedPayment.paidAmount)}</strong></p>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.5rem' }}>
                ℹ️ Payment will be sent to admin for verification. Once approved, your status will update automatically.
              </p>
            </div>
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input type="number" min="1" value={payForm.amount}
                onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Payment Method *</label>
              <select value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                <option value="upi">📱 UPI</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
                <option value="cash">💵 Cash</option>
                <option value="cheque">📝 Cheque</option>
                <option value="online">🌐 Online</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transaction ID / Reference</label>
              <input type="text" value={payForm.transactionId}
                onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} placeholder="UPI ref / Bank ref number" />
            </div>
            <div className="form-group">
              <label>Notes / Message</label>
              <input type="text" value={payForm.notes}
                onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Any message for admin" />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary btn--lg" disabled={saving} style={{ flex: 1 }}>
                {saving ? <span className="btn-spinner"></span> : '📤 Submit for Verification'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
