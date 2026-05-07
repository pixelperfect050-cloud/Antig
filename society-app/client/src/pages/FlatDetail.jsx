import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import api from '../utils/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FlatDetail = () => {
  const { flatId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ paidAmount: 0, paymentMethod: 'cash', transactionId: '', notes: '' });
  const [editForm, setEditForm] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchFlatDetail();
  }, [flatId]);

  const fetchFlatDetail = async () => {
    try {
      const result = await api.get(`/api/flats/${flatId}`);
      setData(result);
      setEditForm({
        ownerName: result.flat.ownerName,
        ownerPhone: result.flat.ownerPhone,
        ownerEmail: result.flat.ownerEmail,
        tenantName: result.flat.tenantName,
        tenantPhone: result.flat.tenantPhone,
        type: result.flat.type,
        area: result.flat.area
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (payment) => {
    setSelectedPayment(payment);
    
    // Calculate late fee if applicable
    let suggestedLateFee = 0;
    if (data.society && data.society.lateFeePerDay > 0) {
      const dueDate = new Date(payment.year, payment.month - 1, data.society.lateFeeAfterDays || 15);
      const today = new Date();
      if (today > dueDate) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        suggestedLateFee = diffDays * data.society.lateFeePerDay;
      }
    }

    setPaymentForm({
      paidAmount: payment.amount - payment.paidAmount,
      paymentMethod: 'cash',
      transactionId: '',
      notes: '',
      lateFee: suggestedLateFee
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/payments/${selectedPayment._id}`, {
        paidAmount: selectedPayment.paidAmount + parseFloat(paymentForm.paidAmount),
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId,
        notes: paymentForm.notes,
        lateFee: parseFloat(paymentForm.lateFee || 0)
      });
      setShowPaymentModal(false);
      fetchFlatDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/flats/${flatId}`, editForm);
      setShowEditModal(false);
      fetchFlatDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const handleDownloadReceipt = async (p) => {
    try {
      await api.download(`/api/payments/${p._id}/receipt`, `Receipt_${p.month}_${p.year}_Flat_${data.flat.number}.pdf`);
    } catch (err) {
      alert(err.message);
    }
  };


  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!data) return <div className="empty-state"><h2>Flat not found</h2></div>;

  const { flat, payments, totalPaid, totalDue } = data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/blocks" className="breadcrumb-link">Blocks</Link>
            <span className="breadcrumb-sep">›</span>
            <Link to={`/blocks/${flat.blockId?._id || flat.blockId}/flats`} className="breadcrumb-link">
              Block {flat.blockId?.name}
            </Link>
            <span className="breadcrumb-sep">›</span>
            <span>{flat.number}</span>
          </div>
          <h1 className="page-title">Flat {flat.number}</h1>
        </div>
        {isAdmin && (
          <button className="btn btn--outline" onClick={() => setShowEditModal(true)} id="edit-flat-btn">
            ✏️ Edit Details
          </button>
        )}
      </div>

      {/* Flat Info Cards */}
      <div className="flat-detail-grid">
        <div className="card flat-info-card">
          <h3 className="card-title">Owner Information</h3>
          <div className="info-rows">
            <div className="info-row"><span className="info-label">👤 Owner</span><span className="info-value">{flat.ownerName}</span></div>
            <div className="info-row"><span className="info-label">📱 Phone</span><span className="info-value">{flat.ownerPhone || '-'}</span></div>
            <div className="info-row"><span className="info-label">📧 Email</span><span className="info-value">{flat.ownerEmail || '-'}</span></div>
            {flat.tenantName && <div className="info-row"><span className="info-label">🏠 Tenant</span><span className="info-value">{flat.tenantName}</span></div>}
            <div className="info-row"><span className="info-label">📐 Type</span><span className="info-value">{flat.type} • {flat.area} sq.ft</span></div>
          </div>
        </div>

        <div className="card flat-summary-card premium-card">
          <h3 className="card-title">Payment Summary</h3>
          <div className="summary-stats">
            <div className="summary-stat summary-stat--paid">
              <span className="summary-label">Total Paid</span>
              <span className="summary-value">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="summary-stat summary-stat--due">
              <span className="summary-label">Total Due</span>
              <span className="summary-value" style={{ color: totalDue > 0 ? 'var(--error)' : 'inherit' }}>{formatCurrency(totalDue)}</span>
            </div>
          </div>
          
          {totalDue > 0 && !isAdmin && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📱</span>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Quick Pay via UPI</h4>
                  <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Scan & pay instantly</p>
                </div>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                {/* Mock QR Code */}
                <div style={{ width: '120px', height: '120px', background: '#f1f5f9', border: '8px solid #fff', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: '10px', background: 'url("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=society@upi&am=' + totalDue + '&tn=Maintenance") center/cover no-repeat' }}></div>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '4px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    🏘️
                  </div>
                </div>
              </div>
              <button className="btn btn--primary btn--full" style={{ borderRadius: '25px' }}>
                Open PhonePe / GPay
              </button>
            </div>
          )}

          <div className={`flat-status-badge flat-status-badge--${flat.currentMonthStatus}`} style={{ marginTop: totalDue > 0 && !isAdmin ? '1.5rem' : '1rem' }}>
            {flat.currentMonthStatus === 'paid' ? '✅ Current Month Paid' :
             flat.currentMonthStatus === 'partial' ? '🔶 Partially Paid' : '⏳ Payment Pending'}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Payment History</h3>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Method</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((p, i) => (
                <tr key={i}>
                  <td className="font-medium">{MONTHS[p.month - 1]} {p.year}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td className="text-success">{formatCurrency(p.paidAmount)}</td>
                  <td className="text-danger">{formatCurrency(Math.max(0, p.amount - p.paidAmount))}</td>
                  <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
                  <td>{p.paymentMethod || '-'}</td>
                  <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td>
                    <div className="btn-group">
                      {p.status === 'paid' && (
                        <button className="btn--icon" onClick={() => handleDownloadReceipt(p)} title="Download Receipt">
                          📥
                        </button>
                      )}
                      {isAdmin && p.status !== 'paid' && (
                        <button className="btn btn--sm btn--primary" onClick={() => handleRecordPayment(p)}>
                          💰 Record
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
                <tr><td colSpan={8} className="text-center text-muted">No payment records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        <form onSubmit={submitPayment} className="modal-form">
          <div className="payment-info-box">
            <p>Recording for: <strong>{MONTHS[(selectedPayment?.month || 1) - 1]} {selectedPayment?.year}</strong></p>
            <p>Remaining: <strong>{formatCurrency((selectedPayment?.amount || 0) - (selectedPayment?.paidAmount || 0))}</strong></p>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pay-amount">Amount Paid</label>
              <input type="number" id="pay-amount" min="1" value={paymentForm.paidAmount}
                onChange={e => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="pay-latefee">Late Fee (₹)</label>
              <input type="number" id="pay-latefee" min="0" value={paymentForm.lateFee}
                onChange={e => setPaymentForm({ ...paymentForm, lateFee: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pay-method">Payment Method</label>
            <select id="pay-method" value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pay-txn">Transaction ID (Optional)</label>
            <input type="text" id="pay-txn" value={paymentForm.transactionId}
              onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="pay-notes">Notes (Optional)</label>
            <input type="text" id="pay-notes" value={paymentForm.notes}
              onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Flat Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Flat Details">
        <form onSubmit={submitEdit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-owner">Owner Name</label>
            <input type="text" id="edit-owner" value={editForm.ownerName || ''}
              onChange={e => setEditForm({ ...editForm, ownerName: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-phone">Phone</label>
              <input type="text" id="edit-phone" value={editForm.ownerPhone || ''}
                onChange={e => setEditForm({ ...editForm, ownerPhone: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-email">Email</label>
              <input type="email" id="edit-email" value={editForm.ownerEmail || ''}
                onChange={e => setEditForm({ ...editForm, ownerEmail: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-type">Flat Type</label>
              <select id="edit-type" value={editForm.type || '2BHK'}
                onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="4BHK">4BHK</option>
                <option value="Studio">Studio</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-area">Area (sq.ft)</label>
              <input type="number" id="edit-area" value={editForm.area || 0}
                onChange={e => setEditForm({ ...editForm, area: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FlatDetail;
