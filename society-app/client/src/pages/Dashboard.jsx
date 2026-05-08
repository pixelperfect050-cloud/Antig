import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import api from '../utils/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'upi', transactionId: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleSync = () => fetchStats();
      socket.on('payment_recorded', handleSync);
      socket.on('expense_added', handleSync);
      socket.on('user_status_updated', handleSync);
      return () => {
        socket.off('payment_recorded', handleSync);
        socket.off('expense_added', handleSync);
        socket.off('user_status_updated', handleSync);
      };
    }
  }, [socket]);

  const fetchStats = async () => {
    try {
      if (isAdmin && user?.societyId) {
        const sid = user.societyId?._id || user.societyId;
        const data = await api.get(`/api/dashboard/stats/${sid}`);
        setStats(data);
      } else {
        const data = await api.get('/api/dashboard/member-stats');
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const handleDownloadReceipt = async (p) => {
    try {
      await api.download(`/api/payments/${p._id}/receipt`, `Receipt_${p.month}_${p.year}.pdf`);
    } catch (err) {
      alert(err.message);
    }
  };

  const openPayModal = (p) => {
    setSelectedPayment(p);
    setPayForm({ amount: p.amount - p.paidAmount, paymentMethod: 'upi', transactionId: '', notes: '' });
    setShowPayModal(true);
  };

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
      alert('Payment submitted for verification! Admin will review shortly.');
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  if (!user?.societyId) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h1 className="page-title text-center">Welcome!</h1>
          <p className="text-center text-secondary">You haven't been assigned to a society yet. Please contact your society admin or set up a new society.</p>
          {isAdmin && (
            <div className="mt-4 flex justify-center">
              <button onClick={() => navigate('/setup')} className="btn btn--primary">Setup Society</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin && stats) {
    const maxCollection = Math.max(...(stats.monthlyTrend?.map(m => m.collected) || [1]));
    const categoryColors = {
      electricity: '#f59e0b', lift: '#8b5cf6', security: '#3b82f6', cleaning: '#10b981',
      plumbing: '#ef4444', gardening: '#22c55e', repairs: '#f97316', water: '#06b6d4', misc: '#6b7280'
    };
    const totalExp = stats.expenseBreakdown?.reduce((s, e) => s + e.total, 0) || 1;

    return (
      <div className="page">
        <header className="page-header">
          <div className="page-title-group">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of your society</p>
          </div>
        </header>

        {/* Alerts Section */}
        {(stats.pendingPaymentRequests > 0 || stats.pendingFundVerifications > 0) && (
          <div className="alert alert--warning mb-4">
            <div className="flex items-center gap-2 flex-1">
              <span>⚠️</span>
              <div>
                {stats.pendingPaymentRequests > 0 && <p><strong>{stats.pendingPaymentRequests}</strong> maintenance payments pending.</p>}
                {stats.pendingFundVerifications > 0 && <p><strong>{stats.pendingFundVerifications}</strong> fund payments need review.</p>}
              </div>
            </div>
            <button className="btn btn--primary btn--sm" onClick={() => navigate('/payment-verification')}>Review</button>
          </div>
        )}

        {/* Primary Stats Grid */}
        <div className="stats-grid">
          <StatsCard icon="💰" label="Total Collection" value={formatCurrency(stats.totalCollection)} color="success" />
          <StatsCard icon="📤" label="Total Expenses" value={formatCurrency(stats.totalExpenses)} color="danger" />
          <StatsCard icon="💎" label="Balance" value={formatCurrency(stats.currentBalance)} color="primary" />
          <StatsCard icon="📅" label="This Month" value={formatCurrency(stats.monthCollection)} color="warning" />
        </div>

        {/* Fund Stats - Collapsible/Adaptive */}
        {stats.activeFundsCount > 0 && (
          <div className="stats-grid mb-4">
            <StatsCard icon="📢" label="Fund Target" value={formatCurrency(stats.totalFundTarget)} color="primary" />
            <StatsCard icon="✅" label="Fund Collected" value={formatCurrency(stats.totalFundCollected)} color="success" />
            <StatsCard icon="⏳" label="Fund Pending" value={formatCurrency(stats.totalFundPending)} color="warning" />
          </div>
        )}

        <div className="dashboard-row">
          {/* Status Overview Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Flat Payment Status</h3>
              <span className="card-badge">{stats.totalFlats} Flats</span>
            </div>
            <div className="flat-status-bars p-4">
              <div className="status-bar-row mb-4">
                <div className="flex justify-between mb-1">
                  <span className="status-label">Paid</span>
                  <span className="status-count">{stats.paidFlats}</span>
                </div>
                <div className="status-bar-track">
                  <div className="status-bar-fill status-bar--paid" style={{ width: `${(stats.paidFlats / Math.max(stats.totalFlats, 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="status-bar-row mb-4">
                <div className="flex justify-between mb-1">
                  <span className="status-label">Pending</span>
                  <span className="status-count">{stats.pendingFlats}</span>
                </div>
                <div className="status-bar-track">
                  <div className="status-bar-fill status-bar--pending" style={{ width: `${(stats.pendingFlats / Math.max(stats.totalFlats, 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="status-bar-row">
                <div className="flex justify-between mb-1">
                  <span className="status-label">Partial</span>
                  <span className="status-count">{stats.partialFlats}</span>
                </div>
                <div className="status-bar-track">
                  <div className="status-bar-fill status-bar--partial" style={{ width: `${(stats.partialFlats / Math.max(stats.totalFlats, 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Society Metrics</h3>
            </div>
            <div className="quick-stats p-4 grid grid-cols-2 gap-4">
              <div className="quick-stat flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="font-bold text-lg">{stats.totalBlocks}</p>
                  <p className="text-xs text-secondary">Blocks</p>
                </div>
              </div>
              <div className="quick-stat flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-bold text-lg">{stats.totalMembers}</p>
                  <p className="text-xs text-secondary">Members</p>
                </div>
              </div>
              <div className="quick-stat flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-lg">{formatCurrency(stats.monthExpenseTotal)}</p>
                  <p className="text-xs text-secondary">Exp / Month</p>
                </div>
              </div>
              <div className="quick-stat flex items-center gap-3">
                <span className="text-2xl">🏘️</span>
                <div>
                  <p className="font-bold text-lg">{stats.totalFlats}</p>
                  <p className="text-xs text-secondary">Total Flats</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Section */}
        <div className="dashboard-row">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Collection Trend</h3>
            </div>
            <div className="chart-container p-4">
              <div className="bar-chart flex items-end gap-2" style={{ height: '180px' }}>
                {stats.monthlyTrend?.map((m, i) => (
                  <div key={i} className="bar-group flex-1 flex flex-col items-center">
                    <div className="bar-wrapper w-full flex items-end justify-center flex-1">
                      <div 
                        className="bar bar--collected w-4/5 rounded-t-md" 
                        style={{ 
                          height: `${(m.collected / maxCollection) * 100}%`,
                          background: 'linear-gradient(180deg, var(--primary), var(--primary-light))'
                        }}
                        title={formatCurrency(m.collected)}
                      ></div>
                    </div>
                    <span className="text-[10px] text-secondary mt-1 font-bold">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expense Breakdown</h3>
            </div>
            <div className="expense-breakdown p-4 flex flex-col gap-4">
              {stats.expenseBreakdown?.map((exp, i) => (
                <div key={i} className="expense-item">
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: categoryColors[exp._id] || '#6b7280' }}></span>
                      <span className="text-xs font-bold capitalize">{exp._id}</span>
                    </div>
                    <span className="text-xs font-bold">{formatCurrency(exp.total)}</span>
                  </div>
                  <div className="expense-bar-track h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="expense-bar-fill h-full rounded-full" style={{
                      width: `${(exp.total / totalExp) * 100}%`,
                      background: categoryColors[exp._id] || '#6b7280'
                    }}></div>
                  </div>
                </div>
              ))}
              {(!stats.expenseBreakdown || stats.expenseBreakdown.length === 0) && (
                <p className="text-center text-secondary p-4">No expenses recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Member Requests Notification */}
        {isAdmin && stats.pendingMembersCount > 0 && (
          <div className="alert alert--info mb-4">
            <p className="flex-1">👋 You have <strong>{stats.pendingMembersCount}</strong> new resident requests.</p>
            <button className="btn btn--primary btn--sm" onClick={() => navigate('/requests')}>Manage</button>
          </div>
        )}
      </div>
    );
  }

  // Member Dashboard
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Your society account summary</p>
        </div>
      </header>

      {stats?.pendingRequests > 0 && (
        <div className="alert alert--info mb-4">
          <span>⏳</span>
          <p><strong>{stats.pendingRequests}</strong> payment(s) pending verification by admin.</p>
        </div>
      )}

      <div className="stats-grid">
        <StatsCard icon="✅" label="Maintenance Paid" value={formatCurrency(stats?.totalPaid)} color="success" />
        <StatsCard icon="⏳" label="Maintenance Due" value={formatCurrency(stats?.totalDue)} color="danger" />
        <StatsCard icon="📢" label="Fund Paid" value={formatCurrency(stats?.totalFundPaid)} color="primary" />
        <StatsCard icon="💰" label="Fund Due" value={formatCurrency(stats?.totalFundDue)} color="warning" />
      </div>

      {/* Maintenance History */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Payment History</h3>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats?.payments?.map((p, i) => (
                <tr key={i}>
                  <td className="font-bold">{MONTHS[p.month - 1]} {p.year}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>
                    <span className={`status-badge status-badge--${p.status}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {p.status !== 'paid' && (
                        <button className="btn btn--sm btn--primary" onClick={() => openPayModal(p)}>Pay</button>
                      )}
                      <button className="btn--icon" onClick={() => handleDownloadReceipt(p)} title="Download Receipt">📥</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!stats?.payments || stats.payments.length === 0) && (
                <tr><td colSpan="4" className="text-center text-secondary p-8">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Funds Section */}
      {stats?.fundPayments?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Society Funds</h3>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.fundPayments.map((fp, i) => (
                  <tr key={i}>
                    <td className="font-bold">{fp.fundId?.name || 'Fund'}</td>
                    <td>{formatCurrency(fp.amount)}</td>
                    <td>
                      <span className={`status-badge status-badge--${fp.status === 'paid' ? 'paid' : fp.status === 'pending_verification' ? 'warning' : 'pending'}`}>
                        {fp.status === 'paid' ? 'Paid' : fp.status === 'pending_verification' ? 'Verifying' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {fp.status === 'pending' && (
                        <button className="btn btn--sm btn--primary" onClick={() => navigate('/funds')}>Pay</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Responsive Pay Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Submit Payment">
        {selectedPayment && (
          <form onSubmit={submitPaymentRequest} className="modal-form p-4">
            <div className="payment-info-box mb-4 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-xs text-secondary">Month</p>
              <p className="font-bold mb-2">{MONTHS[selectedPayment.month - 1]} {selectedPayment.year}</p>
              <p className="text-xs text-secondary">Due Amount</p>
              <p className="font-bold text-primary text-xl">{formatCurrency(selectedPayment.amount - selectedPayment.paidAmount)}</p>
            </div>
            
            <div className="grid gap-4">
              <div className="form-group">
                <label className="text-sm font-bold">Amount to Pay</label>
                <input type="number" min="1" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
              </div>
              
              <div className="form-group">
                <label className="text-sm font-bold">Payment Mode</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank_transfer">Net Banking</option>
                  <option value="cash">Cash Payment</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="text-sm font-bold">Ref / Transaction ID</label>
                <input type="text" value={payForm.transactionId} onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} placeholder="Enter Reference No." />
              </div>
            </div>

            <div className="modal-actions mt-6 flex gap-3">
              <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
                {saving ? <span className="btn-spinner"></span> : 'Submit Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
