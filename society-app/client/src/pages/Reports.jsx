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
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and export reports</p>
        </div>
        <button className="btn btn--outline" onClick={exportCSV} id="export-csv-btn">
          📥 Export CSV
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="report-tabs">
        <button className={`report-tab ${reportType === 'monthly' ? 'active' : ''}`}
          onClick={() => setReportType('monthly')} id="monthly-report-tab">
          📅 Monthly Report
        </button>
        <button className={`report-tab ${reportType === 'flatwise' ? 'active' : ''}`}
          onClick={() => setReportType('flatwise')} id="flatwise-report-tab">
          🏠 Flat-wise Report
        </button>
      </div>

      {reportType === 'monthly' && (
        <div className="filters-bar">
          <div className="filter-group">
            <select value={monthFilter} onChange={e => setMonthFilter(parseInt(e.target.value))} className="filter-select">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value))} className="filter-select">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-loader"><div className="spinner"></div></div>
      ) : reportType === 'monthly' && data ? (
        <>
          {/* Summary Cards */}
          <div className="report-summary">
            <div className="report-summary-card report-summary--collected premium-card">
              <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</span>
              <span className="rs-label">Collected</span>
              <span className="rs-value" style={{ color: 'var(--success)' }}>{formatCurrency(data.summary?.totalCollected)}</span>
            </div>
            <div className="report-summary-card report-summary--due premium-card">
              <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</span>
              <span className="rs-label">Pending</span>
              <span className="rs-value" style={{ color: 'var(--error)' }}>{formatCurrency(data.summary?.totalDue)}</span>
            </div>
            <div className="report-summary-card report-summary--expense premium-card">
              <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📉</span>
              <span className="rs-label">Expenses</span>
              <span className="rs-value" style={{ color: 'var(--warning)' }}>{formatCurrency(data.summary?.totalExpenses)}</span>
            </div>
            <div className="report-summary-card report-summary--net premium-card">
              <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏦</span>
              <span className="rs-label">Net Balance</span>
              <span className="rs-value" style={{ color: 'var(--primary)' }}>{formatCurrency(data.summary?.netBalance)}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ padding: '1rem 1.5rem 0' }}>Payment Records</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Flat</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments?.map((p, i) => (
                    <tr key={i}>
                      <td className="font-medium">{p.flatId?.number || '-'}</td>
                      <td>{formatCurrency(p.amount)}</td>
                      <td className="text-success">{formatCurrency(p.paidAmount)}</td>
                      <td><span className={`status-badge status-badge--${p.status}`}>{p.status}</span></td>
                      <td>{p.paymentMethod || '-'}</td>
                      <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : Array.isArray(data) ? (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Flat</th>
                  <th>Block</th>
                  <th>Owner</th>
                  <th>Phone</th>
                  <th>Total Paid</th>
                  <th>Total Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium">{r.flatNumber}</td>
                    <td>{r.blockName}</td>
                    <td>{r.ownerName}</td>
                    <td>{r.phone}</td>
                    <td className="text-success">{formatCurrency(r.totalPaid)}</td>
                    <td className="text-danger">{formatCurrency(r.totalDue)}</td>
                    <td><span className={`status-badge status-badge--${r.currentStatus}`}>{r.currentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Reports;
