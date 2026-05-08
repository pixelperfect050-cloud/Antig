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
      <header className="page-header">
        <div className="page-title-group">
          <div className="breadcrumb flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
            <Link to="/blocks" className="hover:text-primary">Blocks</Link>
            <span>›</span>
            <Link to={`/blocks/${flat.blockId?._id || flat.blockId}/flats`} className="hover:text-primary truncate max-w-[80px]">
              Block {flat.blockId?.name}
            </Link>
            <span>›</span>
            <span className="text-text">{flat.number}</span>
          </div>
          <h1 className="page-title">Flat {flat.number}</h1>
        </div>
        {isAdmin && (
          <button className="btn btn--outline btn--sm mt-2 sm:mt-0" onClick={() => setShowEditModal(true)}>
            ✏️ Edit
          </button>
        )}
      </header>

      {/* Responsive Info Grid */}
      <div className="dashboard-row mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Resident Details</h3>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center text-xl font-bold">
                {flat.ownerName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-secondary uppercase tracking-tighter">Owner</p>
                <p className="font-bold text-lg">{flat.ownerName}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <span className="text-xs font-bold text-secondary flex items-center gap-1">📱 {flat.ownerPhone || 'N/A'}</span>
                  <span className="text-xs font-bold text-secondary flex items-center gap-1">📧 {flat.ownerEmail || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {flat.tenantName && (
              <div className="pt-4 border-t border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-secondary flex items-center justify-center text-lg font-bold">
                  {flat.tenantName?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-secondary uppercase tracking-tighter">Tenant</p>
                  <p className="font-bold">{flat.tenantName}</p>
                </div>
              </div>
            )}

            <div className="mt-2 flex gap-4 p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-[10px] font-black text-secondary uppercase">Type</p>
                <p className="font-bold text-sm">{flat.type}</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <p className="text-[10px] font-black text-secondary uppercase">Area</p>
                <p className="font-bold text-sm">{flat.area} sq.ft</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-20 blur-3xl -mr-16 -mt-16 rounded-full"></div>
          
          <div className="card-header border-slate-800">
            <h3 className="card-title text-slate-300">Account Summary</h3>
          </div>
          <div className="p-4 relative z-10">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-xl font-black text-emerald-400">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                <p className={`text-xl font-black ${totalDue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{formatCurrency(totalDue)}</p>
              </div>
            </div>

            {totalDue > 0 && !isAdmin && (
              <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">📱</div>
                  <div>
                    <p className="text-sm font-black">Scan to Pay</p>
                    <p className="text-[10px] font-bold text-slate-500">Instant UPI Payment</p>
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl relative">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=society@upi&am=${totalDue}&tn=Maintenance_${flat.number}`}
                      alt="Payment QR"
                      className="w-32 h-32"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-lg shadow-lg text-lg">🏘️</div>
                  </div>
                </div>
                <button className="btn btn--primary w-full rounded-xl py-4 font-black">
                  OPEN UPI APPS
                </button>
              </div>
            )}

            <div className={`mt-4 p-3 rounded-xl text-center text-xs font-black uppercase tracking-widest ${
              flat.currentMonthStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
              flat.currentMonthStatus === 'partial' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {flat.currentMonthStatus === 'paid' ? 'Current Month Paid' :
               flat.currentMonthStatus === 'partial' ? 'Partially Paid' : 'Payment Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Payment History */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">Payment History</h3>
          <span className="card-badge">{payments?.length || 0} Records</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((p, i) => (
                <tr key={i}>
                  <td className="font-bold">
                    <div className="flex flex-col">
                      <span>{MONTHS[p.month - 1]} {p.year}</span>
                      <span className="text-[9px] font-bold text-secondary uppercase">{p.paymentMethod || '-'}</span>
                    </div>
                  </td>
                  <td className="font-black">{formatCurrency(p.amount)}</td>
                  <td className="text-emerald-600 font-bold">{formatCurrency(p.paidAmount)}</td>
                  <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn--icon" onClick={() => handleDownloadReceipt(p)}>📥</button>
                      {isAdmin && p.status !== 'paid' && (
                        <button className="btn btn--sm btn--primary px-3" onClick={() => handleRecordPayment(p)}>💰 Record</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
                <tr><td colSpan={5} className="text-center p-12 text-secondary font-bold">No payment history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optimized Modals */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        <form onSubmit={submitPayment} className="modal-form p-4">
          <div className="mb-4 p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Period</p>
              <p className="font-black">{MONTHS[(selectedPayment?.month || 1) - 1]} {selectedPayment?.year}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Remaining</p>
              <p className="font-black text-rose-500">{formatCurrency((selectedPayment?.amount || 0) - (selectedPayment?.paidAmount || 0))}</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Paid Amount</label>
                <input type="number" min="1" value={paymentForm.paidAmount}
                  onChange={e => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Late Fee</label>
                <input type="number" min="0" value={paymentForm.lateFee}
                  onChange={e => setPaymentForm({ ...paymentForm, lateFee: e.target.value })} />
              </div>
            </div>
            
            <div className="form-group">
              <label>Method</label>
              <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Reference / Notes</label>
              <input type="text" value={paymentForm.transactionId}
                onChange={e => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} placeholder="Txn ID / Cheque No." />
            </div>
          </div>

          <div className="modal-actions mt-8">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Save Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Flat">
        <form onSubmit={submitEdit} className="modal-form p-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="grid gap-4">
            <div className="form-group">
              <label>Owner Name</label>
              <input type="text" value={editForm.ownerName || ''}
                onChange={e => setEditForm({ ...editForm, ownerName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={editForm.ownerPhone || ''}
                  onChange={e => setEditForm({ ...editForm, ownerPhone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editForm.ownerEmail || ''}
                  onChange={e => setEditForm({ ...editForm, ownerEmail: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Type</label>
                <select value={editForm.type || '2BHK'} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="4BHK">4BHK</option>
                </select>
              </div>
              <div className="form-group">
                <label>Area (sq.ft)</label>
                <input type="number" value={editForm.area || 0}
                  onChange={e => setEditForm({ ...editForm, area: parseInt(e.target.value) })} />
              </div>
            </div>
          </div>
          <div className="modal-actions mt-8">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Update Details'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FlatDetail;
