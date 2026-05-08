import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Reports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('monthly');
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType, monthFilter, yearFilter]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const sid = user?.societyId?._id || user?.societyId;
      if (!sid) return;

      if (reportType === 'monthly') {
        const result = await api.get(`/api/reports/monthly/${sid}?month=${monthFilter}&year=${yearFilter}`);
        setData(result);
      } else {
        const result = await api.get(`/api/reports/flat-wise/${sid}`);
        setData(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const exportCSV = () => {
    let csv = '';
    if (reportType === 'monthly' && data) {
      csv = 'Flat,Owner,Amount,Paid,Status,Method,Date\n';
      data.payments?.forEach(p => {
        csv += `${p.flatId?.number || ''},${p.flatId?.ownerName || ''},${p.amount},${p.paidAmount},${p.status},${p.paymentMethod || ''},${p.paidDate ? new Date(p.paidDate).toLocaleDateString() : ''}\n`;
      });
    } else if (data) {
      csv = 'Flat,Block,Owner,Phone,Total Paid,Total Due,Status\n';
      data.forEach(r => {
        csv += `${r.flatNumber},${r.blockName},${r.ownerName},${r.phone},${r.totalPaid},${r.totalDue},${r.currentStatus}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${monthFilter}_${yearFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Insights & financial statements</p>
        </div>
        <div className="page-actions mt-3 sm:mt-0">
          <button className="btn btn--outline btn--sm w-full sm:w-auto" onClick={exportCSV}>
            📥 Export CSV
          </button>
        </div>
      </header>

      {/* Responsive Report Tabs */}
      <div className="card mb-6">
        <div className="p-2 flex gap-2">
          <button 
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'monthly' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-secondary hover:bg-slate-100'}`}
            onClick={() => setReportType('monthly')}
          >
            📅 Monthly
          </button>
          <button 
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'flatwise' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-secondary hover:bg-slate-100'}`}
            onClick={() => setReportType('flatwise')}
          >
            🏠 Flat-wise
          </button>
        </div>
      </div>

      {reportType === 'monthly' && (
        <div className="card mb-6">
          <div className="p-4 flex gap-4">
            <select value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))} className="flex-1 min-h-[48px] rounded-xl border-slate-200 bg-slate-50 font-bold px-4">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value))} className="w-32 min-h-[48px] rounded-xl border-slate-200 bg-slate-50 font-bold px-4">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-loader"><div className="spinner"></div></div>
      ) : reportType === 'monthly' && data ? (
        <>
          {/* Summary Stats Grid */}
          <div className="stats-grid mb-6">
            <div className="stats-card stats-card--success">
              <div className="stats-card__icon">💰</div>
              <div className="stats-card__content">
                <span className="stats-card__label">Collected</span>
                <span className="stats-card__value text-lg">{formatCurrency(data.summary?.totalCollected)}</span>
              </div>
            </div>
            <div className="stats-card stats-card--danger">
              <div className="stats-card__icon">⏳</div>
              <div className="stats-card__content">
                <span className="stats-card__label">Pending</span>
                <span className="stats-card__value text-lg">{formatCurrency(data.summary?.totalDue)}</span>
              </div>
            </div>
            <div className="stats-card stats-card--warning">
              <div className="stats-card__icon">📉</div>
              <div className="stats-card__content">
                <span className="stats-card__label">Expenses</span>
                <span className="stats-card__value text-lg">{formatCurrency(data.summary?.totalExpenses)}</span>
              </div>
            </div>
            <div className="stats-card stats-card--primary">
              <div className="stats-card__icon">🏦</div>
              <div className="stats-card__content">
                <span className="stats-card__label">Net Balance</span>
                <span className="stats-card__value text-lg">{formatCurrency(data.summary?.netBalance)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Payment Logs</h3>
              <span className="card-badge">{data.payments?.length || 0} Records</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Flat</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments?.map((p, i) => (
                    <tr key={i}>
                      <td className="font-bold">{p.flatId?.number || '-'}</td>
                      <td className="font-black">{formatCurrency(p.amount)}</td>
                      <td className="text-emerald-600 font-bold">{formatCurrency(p.paidAmount)}</td>
                      <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
                      <td>
                        <span className="text-[10px] font-bold text-secondary uppercase truncate max-w-[80px] inline-block">
                          {p.paymentMethod || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data.payments || data.payments.length === 0) && (
                    <tr><td colSpan={5} className="text-center p-12 text-secondary">No records for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : Array.isArray(data) ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Unit-wise Performance</h3>
            <span className="card-badge">{data.length} Units</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Owner</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-black text-primary">{r.flatNumber}</span>
                        <span className="text-[10px] font-bold text-secondary uppercase">{r.blockName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col truncate max-w-[120px]">
                        <span className="font-bold text-sm truncate">{r.ownerName}</span>
                        <span className="text-[10px] text-secondary">{r.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="text-emerald-600 font-bold">{formatCurrency(r.totalPaid)}</td>
                    <td className="text-rose-500 font-bold">{formatCurrency(r.totalDue)}</td>
                    <td><span className={`status-badge status-badge--${r.currentStatus}`}>{r.currentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state p-20">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-secondary font-bold">Select parameters to generate report</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
