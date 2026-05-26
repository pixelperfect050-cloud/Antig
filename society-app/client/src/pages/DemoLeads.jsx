import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { API_BASE } from '../lib/apiConfig';

const STATUS_MAP = {
  new: { label: 'New', color: '#6366f1', bg: '#eef2ff', icon: '🆕' },
  contacted: { label: 'Contacted', color: '#f59e0b', bg: '#fffbeb', icon: '📞' },
  demo_scheduled: { label: 'Demo Scheduled', color: '#3b82f6', bg: '#eff6ff', icon: '📅' },
  converted: { label: 'Converted', color: '#10b981', bg: '#ecfdf5', icon: '✅' },
  lost: { label: 'Lost', color: '#ef4444', bg: '#fef2f2', icon: '❌' }
};

const DemoLeads = () => {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let url = `/api/admin/demo-leads?page=${page}&limit=20`;
      if (filter) url += `&status=${filter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await api.get(url);
      setLeads(data.leads || []);
      setCounts(data.counts || {});
      setPagination(data.pagination || {});
    } catch (err) {
      showToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/admin/demo-leads/${id}`, { status: newStatus });
      showToast(`Status updated to ${STATUS_MAP[newStatus]?.label}`);
      fetchLeads(pagination.page);
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const saveNotes = async (id) => {
    try {
      await api.put(`/api/admin/demo-leads/${id}`, { notes: editNotes });
      showToast('Notes saved');
      setEditingId(null);
      fetchLeads(pagination.page);
    } catch (err) {
      showToast('Save failed', 'error');
    }
  };

  const exportCSV = () => {
    const token = localStorage.getItem('token');
    let url = `${API_BASE}/api/admin/demo-leads/export`;
    if (filter) url += `?status=${filter}`;
    // Open in new tab - browser will download the CSV
    const link = document.createElement('a');
    link.href = url;
    // We need to pass auth token via fetch for download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `demo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(blobUrl);
        showToast('CSV downloaded! Open in Excel or Google Sheets');
      })
      .catch(() => showToast('Export failed', 'error'));
  };

  const totalLeads = Object.values(counts).reduce((a, b) => a + b, 0);
  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="admin-mgmt">
      {toast && <div className={`admin-toast admin-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="admin-mgmt__header">
        <h1>📋 Demo Leads</h1>
        <p>Manage demo bookings from FunkiAI public assistant</p>
      </div>

      {/* Stats */}
      <div className="demo-stats">
        <div className="demo-stat" style={{ borderLeft: '3px solid #6366f1' }}>
          <span className="demo-stat__value">{totalLeads}</span>
          <span className="demo-stat__label">Total Leads</span>
        </div>
        <div className="demo-stat" style={{ borderLeft: '3px solid #10b981' }}>
          <span className="demo-stat__value">{counts.new || 0}</span>
          <span className="demo-stat__label">🆕 New</span>
        </div>
        <div className="demo-stat" style={{ borderLeft: '3px solid #f59e0b' }}>
          <span className="demo-stat__value">{counts.contacted || 0}</span>
          <span className="demo-stat__label">📞 Contacted</span>
        </div>
        <div className="demo-stat" style={{ borderLeft: '3px solid #3b82f6' }}>
          <span className="demo-stat__value">{counts.converted || 0}</span>
          <span className="demo-stat__label">✅ Converted</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="demo-toolbar">
        <div className="demo-toolbar__left">
          <input
            type="text"
            className="demo-search"
            placeholder="🔍 Search name, mobile, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="activity-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {val.label}</option>
            ))}
          </select>
        </div>
        <button className="demo-export-btn" onClick={exportCSV} title="Download CSV for Excel / Google Sheets">
          📥 Export CSV
        </button>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="admin-empty">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="activity-empty">
          <span className="activity-empty__icon">📋</span>
          <h3>No demo leads yet</h3>
          <p>Leads will appear here when visitors book demos via FunkiAI</p>
        </div>
      ) : (
        <div className="demo-table-wrap">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Society</th>
                <th>Flats</th>
                <th>City</th>
                <th>Demo Time</th>
                <th>Status</th>
                <th>Booked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const st = STATUS_MAP[lead.status] || STATUS_MAP.new;
                return (
                  <React.Fragment key={lead._id}>
                    <tr className="demo-row">
                      <td>
                        <div className="demo-lead-info">
                          <strong>{lead.name}</strong>
                          <span className="demo-lead-phone">📱 {lead.mobile}</span>
                        </div>
                      </td>
                      <td>{lead.societyName || '—'}</td>
                      <td>{lead.numberOfFlats || '—'}</td>
                      <td>{lead.city || '—'}</td>
                      <td className="demo-time">{lead.preferredDemoTime || '—'}</td>
                      <td>
                        <select
                          className="demo-status-select"
                          value={lead.status}
                          onChange={(e) => updateStatus(lead._id, e.target.value)}
                          style={{ color: st.color, background: st.bg, borderColor: st.color }}
                        >
                          {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="demo-date">{formatDate(lead.createdAt)}</td>
                      <td>
                        <button
                          className="demo-note-btn"
                          onClick={() => { setEditingId(editingId === lead._id ? null : lead._id); setEditNotes(lead.notes || ''); }}
                          title="Add/Edit notes"
                        >
                          📝
                        </button>
                      </td>
                    </tr>
                    {editingId === lead._id && (
                      <tr className="demo-notes-row">
                        <td colSpan="8">
                          <div className="demo-notes-edit">
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add notes about this lead..."
                              rows={2}
                            />
                            <div className="demo-notes-actions">
                              <button className="admin-action-btn admin-action-btn--promote" onClick={() => saveNotes(lead._id)}>💾 Save</button>
                              <button className="admin-action-btn admin-action-btn--demote" onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="activity-pagination">
          <button className="activity-page-btn" disabled={pagination.page <= 1} onClick={() => fetchLeads(pagination.page - 1)}>← Prev</button>
          <span className="activity-page-info">Page {pagination.page} of {pagination.pages}</span>
          <button className="activity-page-btn" disabled={pagination.page >= pagination.pages} onClick={() => fetchLeads(pagination.page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default DemoLeads;
