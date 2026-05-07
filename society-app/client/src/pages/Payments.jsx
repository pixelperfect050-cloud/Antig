import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import api from '../utils/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ amount: 3000 });
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchPayments();
  }, [monthFilter, yearFilter]);

  const fetchPayments = async () => {
    try {
      const sid = user?.societyId?._id || user?.societyId;
      if (!sid) return;
      const data = await api.get(`/api/payments/society/${sid}?month=${monthFilter}&year=${yearFilter}`);
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateBills = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sid = user?.societyId?._id || user?.societyId;
      const result = await api.post('/api/payments/generate-bills', {
        societyId: sid,
        month: monthFilter,
        year: yearFilter,
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

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Manage maintenance payments</p>
        </div>
        {isAdmin && (
          <button className="btn btn--primary" onClick={() => setShowBillModal(true)} id="generate-bills-btn">
            📄 Generate Bills
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <select value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))} className="filter-select" id="month-filter">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value))} className="filter-select" id="year-filter">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
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

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Flat</th>
                <th>Owner</th>
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
                  <td className="font-medium">{p.flatId?.number || '-'}</td>
                  <td>{p.flatId?.ownerName || '-'}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td className="text-success">{formatCurrency(p.paidAmount)}</td>
                  <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
                  <td>{p.paymentMethod || '-'}</td>
                  <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td>
                    {p.status === 'paid' && (
                      <button className="btn--icon" onClick={() => handleDownloadReceipt(p)} title="Download Receipt">
                        📥
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="text-center text-muted">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bills Modal */}
      <Modal isOpen={showBillModal} onClose={() => setShowBillModal(false)} title="Generate Monthly Bills">
        <form onSubmit={generateBills} className="modal-form">
          <div className="payment-info-box">
            <p>Generate bills for: <strong>{MONTHS[monthFilter - 1]} {yearFilter}</strong></p>
            <p>Bills will be created for all occupied flats that don't have a bill yet.</p>
          </div>
          <div className="form-group">
            <label htmlFor="bill-amount">Maintenance Amount (₹)</label>
            <input type="number" id="bill-amount" min="1" value={billForm.amount}
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
    </div>
  );
};

export default Payments;
