import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import api from '../utils/api';
import '../styles/blocks-flats.css';

const Blocks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', totalFloors: 5, flatsPerFloor: 4, description: '' });
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const sid = user?.societyId?._id || user?.societyId;
      if (!sid) return;
      const data = await api.get(`/api/blocks/society/${sid}`);
      setBlocks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sid = user?.societyId?._id || user?.societyId;
      await api.post('/api/blocks', { ...formData, societyId: sid });
      setShowModal(false);
      setFormData({ name: '', totalFloors: 5, flatsPerFloor: 4, description: '' });
      fetchBlocks();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compute totals across all blocks
  const totals = blocks.reduce((acc, b) => {
    const s = b.flatStats || { total: 0, paid: 0, pending: 0, partial: 0 };
    acc.total   += s.total;
    acc.paid    += s.paid;
    acc.pending += s.pending;
    acc.partial += s.partial;
    return acc;
  }, { total: 0, paid: 0, pending: 0, partial: 0 });

  const overallPct = totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Blocks & Flats</h1>
          <p className="page-subtitle">
            {blocks.length} Block{blocks.length !== 1 ? 's' : ''} • {totals.total} Total Flats
            {overallPct > 0 && (
              <span className={`bf-collection-pct ${
                overallPct >= 75 ? 'bf-collection-pct--good' :
                overallPct >= 40 ? 'bf-collection-pct--mid' : 'bf-collection-pct--low'
              }`} style={{ marginLeft: '0.75rem' }}>
                {overallPct}% paid
              </span>
            )}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn--primary" onClick={() => setShowModal(true)} id="add-block-btn">
            + Add Block
          </button>
        )}
      </div>

      {/* Society-wide summary */}
      {blocks.length > 0 && (
        <div className="bf-summary" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          <div className="bf-summary-card">
            <div className="bf-summary-icon bf-summary-icon--blue">🏢</div>
            <div className="bf-summary-info">
              <span className="bf-summary-label">Total Flats</span>
              <span className="bf-summary-value">{totals.total}</span>
            </div>
          </div>
          <div className="bf-summary-card">
            <div className="bf-summary-icon bf-summary-icon--green">✓</div>
            <div className="bf-summary-info">
              <span className="bf-summary-label">Paid</span>
              <span className="bf-summary-value">{totals.paid}</span>
            </div>
          </div>
          <div className="bf-summary-card">
            <div className="bf-summary-icon bf-summary-icon--red">⏳</div>
            <div className="bf-summary-info">
              <span className="bf-summary-label">Pending</span>
              <span className="bf-summary-value">{totals.pending}</span>
            </div>
          </div>
          <div className="bf-summary-card">
            <div className="bf-summary-icon bf-summary-icon--amber">◐</div>
            <div className="bf-summary-info">
              <span className="bf-summary-label">Partial</span>
              <span className="bf-summary-value">{totals.partial}</span>
            </div>
          </div>
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="bf-empty">
          <div className="bf-empty-icon">🏗️</div>
          <h3>No blocks yet</h3>
          <p>Add your first block to get started</p>
          {isAdmin && <button className="btn btn--primary" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>+ Add Block</button>}
        </div>
      ) : (
        <div className="bf-blocks-grid">
          {blocks.map(block => {
            const s = block.flatStats || { total: 0, paid: 0, pending: 0, partial: 0 };
            const vacant = s.total - s.paid - s.pending - s.partial;
            const paidPct = s.total ? Math.round((s.paid / s.total) * 100) : 0;

            return (
              <div
                key={block._id}
                className="bf-block-card"
                onClick={() => navigate(`/blocks/${block._id}/flats`)}
                id={`block-${block.name}`}
              >
                <div className="bf-block-top">
                  <div>
                    <div className="bf-block-name">Block {block.name}</div>
                    {block.description && (
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.15rem' }}>
                        {block.description}
                      </div>
                    )}
                  </div>
                  <div className="bf-block-icon">🏢</div>
                </div>

                <div className="bf-block-info">
                  <span>📐 {block.totalFloors} Floors</span>
                  <span>🚪 {s.total} Flats</span>
                </div>

                {/* Progress bar */}
                <div className="bf-block-progress">
                  <div className="bf-block-progress-fill" style={{ width: `${paidPct}%` }}></div>
                </div>

                {/* Stats row */}
                <div className="bf-block-stats">
                  <div className="bf-block-stat bf-block-stat--paid">
                    <span className="bf-block-stat-dot"></span>{s.paid} Paid
                  </div>
                  <div className="bf-block-stat bf-block-stat--pending">
                    <span className="bf-block-stat-dot"></span>{s.pending} Due
                  </div>
                  <div className="bf-block-stat bf-block-stat--partial">
                    <span className="bf-block-stat-dot"></span>{s.partial} Partial
                  </div>
                  {vacant > 0 && (
                    <div className="bf-block-stat bf-block-stat--vacant">
                      <span className="bf-block-stat-dot"></span>{vacant} Vacant
                    </div>
                  )}
                  <span className="bf-block-pct">{paidPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Block Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Block">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="block-name">Block Name</label>
            <input type="text" id="block-name" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., A, B, C" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="block-floors">Total Floors</label>
              <input type="number" id="block-floors" min="1" value={formData.totalFloors}
                onChange={e => setFormData({ ...formData, totalFloors: parseInt(e.target.value) })} required />
            </div>
            <div className="form-group">
              <label htmlFor="block-flats">Flats/Floor</label>
              <input type="number" id="block-flats" min="1" value={formData.flatsPerFloor}
                onChange={e => setFormData({ ...formData, flatsPerFloor: parseInt(e.target.value) })} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="block-desc">Description (Optional)</label>
            <input type="text" id="block-desc" value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., East Wing" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving} id="save-block-btn">
              {saving ? <span className="btn-spinner"></span> : 'Create Block'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Blocks;
