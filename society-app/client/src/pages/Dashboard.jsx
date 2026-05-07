import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import api from '../utils/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchStats();
  }, []);

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

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  if (!user?.societyId) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h2>Welcome to SocietySync!</h2>
          <p>You haven't been assigned to a society yet. Please contact your society admin or set up a new society.</p>
          {isAdmin && <a href="/setup" className="btn btn--primary">Setup Society</a>}
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
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of your society</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatsCard icon="💰" label="Total Collection" value={formatCurrency(stats.totalCollection)} color="success" />
          <StatsCard icon="📤" label="Total Expenses" value={formatCurrency(stats.totalExpenses)} color="danger" />
          <StatsCard icon="💎" label="Current Balance" value={formatCurrency(stats.currentBalance)} color="primary" />
          <StatsCard icon="📅" label="This Month" value={formatCurrency(stats.monthCollection)} subValue={`Due: ${formatCurrency(stats.monthDue)}`} color="warning" />
        </div>

        {/* Flat Status Overview */}
        <div className="dashboard-row">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Flat Status Overview</h3>
              <span className="card-badge">{stats.totalFlats} flats</span>
            </div>
            <div className="flat-status-bars">
              <div className="status-bar-row">
                <span className="status-label">✅ Paid</span>
                <div className="status-bar-track">
                  <div className="status-bar-fill status-bar--paid" style={{ width: `${(stats.paidFlats / Math.max(stats.totalFlats, 1)) * 100}%` }}></div>
                </div>
                <span className="status-count">{stats.paidFlats}</span>
              </div>
              <div className="status-bar-row">
                <span className="status-label">⏳ Pending</span>
                <div className="status-bar-track">
                  <div className="status-bar-fill status-bar--pending" style={{ width: `${(stats.pendingFlats / Math.max(stats.totalFlats, 1)) * 100}%` }}></div>
                </div>
                <span className="status-count">{stats.pendingFlats}</span>
              </div>
              <div className="status-bar-row">
                <span className="status-label">🔶 Partial</span>
                <div className="status-bar-track">
                  <div className="status-bar-fill status-bar--partial" style={{ width: `${(stats.partialFlats / Math.max(stats.totalFlats, 1)) * 100}%` }}></div>
                </div>
                <span className="status-count">{stats.partialFlats}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Stats</h3>
            </div>
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-icon">🏢</span>
                <div>
                  <span className="quick-stat-value">{stats.totalBlocks}</span>
                  <span className="quick-stat-label">Blocks</span>
                </div>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">🏠</span>
                <div>
                  <span className="quick-stat-value">{stats.totalFlats}</span>
                  <span className="quick-stat-label">Flats</span>
                </div>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">👥</span>
                <div>
                  <span className="quick-stat-value">{stats.totalMembers}</span>
                  <span className="quick-stat-label">Members</span>
                </div>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">📅</span>
                <div>
                  <span className="quick-stat-value">{formatCurrency(stats.monthExpenseTotal)}</span>
                  <span className="quick-stat-label">Month Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="dashboard-row">
          {/* Collection Trend Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Collection Trend (Last 6 Months)</h3>
            </div>
            <div className="chart-container">
              <div className="bar-chart">
                {stats.monthlyTrend?.map((m, i) => (
                  <div key={i} className="bar-group">
                    <div className="bar-wrapper">
                      <div className="bar bar--collected" style={{ height: `${(m.collected / maxCollection) * 100}%` }}
                        title={formatCurrency(m.collected)}>
                      </div>
                    </div>
                    <span className="bar-label">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot legend-dot--collected"></span> Collected</span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expense Breakdown</h3>
            </div>
            <div className="expense-breakdown">
              {stats.expenseBreakdown?.map((exp, i) => (
                <div key={i} className="expense-item">
                  <div className="expense-info">
                    <span className="expense-dot" style={{ background: categoryColors[exp._id] || '#6b7280' }}></span>
                    <span className="expense-category">{exp._id}</span>
                  </div>
                  <div className="expense-bar-track">
                    <div className="expense-bar-fill" style={{
                      width: `${(exp.total / totalExp) * 100}%`,
                      background: categoryColors[exp._id] || '#6b7280'
                    }}></div>
                  </div>
                  <span className="expense-amount">{formatCurrency(exp.total)}</span>
                </div>
              ))}
              {(!stats.expenseBreakdown || stats.expenseBreakdown.length === 0) && (
                <p className="text-muted">No expenses this month</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Member Dashboard
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Your payment overview</p>
        </div>
      </div>

      <div className="stats-grid stats-grid--2">
        <StatsCard icon="✅" label="Total Paid" value={formatCurrency(stats?.totalPaid)} color="success" />
        <StatsCard icon="⏳" label="Total Due" value={formatCurrency(stats?.totalDue)} color="danger" />
      </div>

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
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.payments?.map((p, i) => (
                <tr key={i}>
                  <td>{MONTHS[p.month - 1]} {p.year}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>{formatCurrency(p.paidAmount)}</td>
                  <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
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
              {(!stats?.payments || stats.payments.length === 0) && (
                <tr><td colSpan="6" className="text-center text-muted">No payment records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
