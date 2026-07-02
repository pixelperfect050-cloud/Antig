import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/blocks-flats.css';

/**
 * Helper: derive the effective display status of a flat
 * Vacant flats always show as 'vacant' regardless of currentMonthStatus.
 */
const getEffectiveStatus = (flat) => {
  if (!flat.isOccupied) return 'vacant';
  return flat.currentMonthStatus || 'pending';
};

/** Format INR currency */
const formatCurrency = (amt) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

// ─── MAIN COMPONENT ────────────────────────────────────────────
const FlatGrid = () => {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const isAdmin = user?.role === 'admin';

  const [flats, setFlats] = useState([]);
  const [block, setBlock] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);

  const menuRef = useRef(null);

  // ── Fetch all data ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [flatsData, blockData] = await Promise.all([
        api.get(`/api/flats/block/${blockId}`),
        api.get(`/api/blocks/${blockId}`)
      ]);
      setFlats(flatsData);
      setBlock(blockData);

      // Fetch current-month payments for financial summary
      const sid = blockData.societyId;
      if (sid) {
        const now = new Date();
        try {
          const paymentsData = await api.get(
            `/api/payments/society/${sid}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
          );
          setPayments(paymentsData);
        } catch { /* payments may not exist yet */ }
      }
    } catch (err) {
      console.error('[FlatGrid] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [blockId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time refresh via socket
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchData();
    socket.on('payment_recorded', refresh);
    socket.on('payment_approved', refresh);
    return () => {
      socket.off('payment_recorded', refresh);
      socket.off('payment_approved', refresh);
    };
  }, [socket, fetchData]);

  // Close action menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Computed: filtered flats ────────────────────────────────
  const filteredFlats = useMemo(() => {
    return flats.filter(f => {
      const status = getEffectiveStatus(f);

      // Status filter
      let match = true;
      if (filter === 'paid')     match = status === 'paid';
      else if (filter === 'pending')  match = status === 'pending';
      else if (filter === 'partial')  match = status === 'partial';
      else if (filter === 'vacant')   match = status === 'vacant';
      else if (filter === 'occupied') match = status !== 'vacant';

      // Text search
      if (match && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        match =
          f.number.toLowerCase().includes(q) ||
          (f.ownerName && f.ownerName.toLowerCase().includes(q)) ||
          (f.ownerPhone && f.ownerPhone.toLowerCase().includes(q));
      }
      return match;
    });
  }, [flats, filter, searchQuery]);

  // ── Computed: summary statistics ────────────────────────────
  const stats = useMemo(() => {
    const total    = flats.length;
    const occupied = flats.filter(f => f.isOccupied).length;
    const vacant   = total - occupied;
    const paid     = flats.filter(f => getEffectiveStatus(f) === 'paid').length;
    const pending  = flats.filter(f => getEffectiveStatus(f) === 'pending').length;
    const partial  = flats.filter(f => getEffectiveStatus(f) === 'partial').length;

    // Financial stats from payment records
    const blockFlatIds = new Set(flats.map(f => f._id));
    const blockPayments = payments.filter(p => {
      const fid = p.flatId?._id || p.flatId;
      return blockFlatIds.has(fid);
    });
    const monthCollection   = blockPayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const outstandingAmount = blockPayments.reduce((s, p) =>
      s + Math.max(0, (p.amount || 0) + (p.lateFee || 0) - (p.paidAmount || 0)), 0
    );
    const collectionPct = occupied > 0 ? Math.round((paid / occupied) * 100) : 0;

    return { total, occupied, vacant, paid, pending, partial, monthCollection, outstandingAmount, collectionPct };
  }, [flats, payments]);

  // ── Computed: group by floor (descending) ───────────────────
  const floors = useMemo(() => {
    const grouped = {};
    filteredFlats.forEach(f => {
      if (!grouped[f.floor]) grouped[f.floor] = [];
      grouped[f.floor].push(f);
    });
    return grouped;
  }, [filteredFlats]);

  // ── Filters config ─────────────────────────────────────────
  const filterTabs = [
    { key: 'all',      label: 'All',      count: flats.length },
    { key: 'occupied', label: 'Occupied', count: stats.occupied },
    { key: 'vacant',   label: 'Vacant',   count: stats.vacant },
    { key: 'paid',     label: 'Paid',     count: stats.paid },
    { key: 'pending',  label: 'Pending',  count: stats.pending },
    { key: 'partial',  label: 'Partial',  count: stats.partial },
  ];

  // ── Summary cards config ───────────────────────────────────
  const summaryCards = [
    { label: 'Total Flats',    value: stats.total,                     icon: '🏢', colorClass: 'bf-summary-icon--blue' },
    { label: 'Occupied',       value: stats.occupied,                  icon: '👥', colorClass: 'bf-summary-icon--green' },
    { label: 'Vacant',         value: stats.vacant,                    icon: '🔑', colorClass: 'bf-summary-icon--gray' },
    { label: 'Paid',           value: stats.paid,                      icon: '✓',  colorClass: 'bf-summary-icon--green' },
    { label: 'Pending',        value: stats.pending,                   icon: '⏳', colorClass: 'bf-summary-icon--red' },
    { label: 'Partial',        value: stats.partial,                   icon: '◐',  colorClass: 'bf-summary-icon--amber' },
    { label: 'Collected',      value: formatCurrency(stats.monthCollection),   icon: '₹',  colorClass: 'bf-summary-icon--teal',  isCurrency: true },
    { label: 'Outstanding',    value: formatCurrency(stats.outstandingAmount), icon: '!',  colorClass: 'bf-summary-icon--red',   isCurrency: true },
  ];

  // ── Action menu items ──────────────────────────────────────
  const getMenuItems = (flat) => {
    const items = [
      { icon: '👁', label: 'View Details',     action: () => navigate(`/flats/${flat._id}`) },
    ];
    if (isAdmin) {
      items.push({ icon: '✏️', label: 'Edit Flat', action: () => navigate(`/flats/${flat._id}`) });
    }
    items.push({ icon: '📋', label: 'Payment History', action: () => navigate(`/flats/${flat._id}`) });
    if (isAdmin && getEffectiveStatus(flat) !== 'vacant') {
      items.push({ icon: '✅', label: 'Verify Payment', action: () => navigate(`/flats/${flat._id}`) });
    }
    return items;
  };

  // ── Loading state ──────────────────────────────────────────
  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      {/* ─── Breadcrumb & Title ────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/blocks" className="breadcrumb-link">Blocks</Link>
            <span className="breadcrumb-sep">›</span>
            <span>Block {block?.name}</span>
          </div>
          <h1 className="page-title">Block {block?.name} — Flats</h1>
          <p className="page-subtitle">
            {block?.totalFloors} Floors • {flats.length} Flats
            {stats.collectionPct > 0 && (
              <span className={`bf-collection-pct ${
                stats.collectionPct >= 75 ? 'bf-collection-pct--good' :
                stats.collectionPct >= 40 ? 'bf-collection-pct--mid' : 'bf-collection-pct--low'
              }`} style={{ marginLeft: '0.75rem' }}>
                {stats.collectionPct}% collected
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ─── Summary Dashboard ─────────────────────────────── */}
      <div className="bf-summary">
        {summaryCards.map(c => (
          <div key={c.label} className="bf-summary-card">
            <div className={`bf-summary-icon ${c.colorClass}`}>{c.icon}</div>
            <div className="bf-summary-info">
              <span className="bf-summary-label">{c.label}</span>
              <span className="bf-summary-value">{c.isCurrency ? c.value : c.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search & Filters ──────────────────────────────── */}
      <div className="bf-toolbar">
        <input
          type="text"
          className="bf-search-input"
          placeholder="Search flat, owner, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="flat-search-input"
        />
        <div className="bf-filter-group">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`bf-filter-btn ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
              id={`filter-${tab.key}`}
            >
              {tab.label}
              <span className="bf-filter-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Legend ────────────────────────────────────────── */}
      <div className="bf-legend">
        <div className="bf-legend-item"><span className="bf-legend-dot bf-legend-dot--paid"></span>Paid</div>
        <div className="bf-legend-item"><span className="bf-legend-dot bf-legend-dot--pending"></span>Pending</div>
        <div className="bf-legend-item"><span className="bf-legend-dot bf-legend-dot--partial"></span>Partial</div>
        <div className="bf-legend-item"><span className="bf-legend-dot bf-legend-dot--vacant"></span>Vacant</div>
      </div>

      {/* ─── Floor Sections ────────────────────────────────── */}
      {Object.keys(floors).length > 0 ? (
        Object.keys(floors)
          .sort((a, b) => Number(b) - Number(a))
          .map(floor => (
            <div key={floor} className="bf-floor">
              <div className="bf-floor-header">
                <span className="bf-floor-badge">
                  <span>▪</span>
                  Floor {floor}
                </span>
                <span className="bf-floor-count">{floors[floor].length} flats</span>
              </div>

              <div className="bf-flat-grid">
                {floors[floor].map(flat => {
                  const status = getEffectiveStatus(flat);
                  const isMenuOpen = activeMenu === flat._id;

                  return (
                    <div
                      key={flat._id}
                      className={`bf-flat-card bf-flat-card--${status}`}
                      onClick={() => {
                        if (status !== 'vacant') navigate(`/flats/${flat._id}`);
                      }}
                      id={`flat-${flat.number}`}
                    >
                      {/* Action menu trigger */}
                      {status !== 'vacant' && (
                        <button
                          className="bf-action-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(isMenuOpen ? null : flat._id);
                          }}
                          title="Actions"
                        >
                          ⋮
                        </button>
                      )}

                      {/* Action dropdown menu */}
                      {isMenuOpen && (
                        <div className="bf-action-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                          {getMenuItems(flat).map((item, idx) => (
                            <button
                              key={idx}
                              className="bf-action-item"
                              onClick={() => { setActiveMenu(null); item.action(); }}
                            >
                              <span className="bf-action-icon">{item.icon}</span>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Card content */}
                      <div className="bf-flat-top">
                        <span className="bf-flat-number">{flat.number}</span>
                        <span className={`bf-flat-status bf-flat-status--${status}`}>
                          {status === 'paid' ? '● Paid' :
                           status === 'pending' ? '● Pending' :
                           status === 'partial' ? '● Partial' : '● Vacant'}
                        </span>
                      </div>

                      <div className="bf-flat-owner">
                        {flat.isOccupied
                          ? flat.ownerName
                          : 'Vacant'}
                      </div>

                      <div className="bf-flat-meta">
                        <span>{flat.type || '2BHK'}</span>
                        {flat.ownerPhone && <span>📱 {flat.ownerPhone}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      ) : (
        <div className="bf-empty">
          <div className="bf-empty-icon">🔍</div>
          <h3>No flats found</h3>
          <p>No flats match your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default FlatGrid;
