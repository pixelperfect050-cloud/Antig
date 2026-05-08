import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import api from '../utils/api';

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

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Blocks</h1>
          <p className="page-subtitle">Select a building to manage flats</p>
        </div>
        {isAdmin && (
          <button className="btn btn--primary btn--sm mt-2 sm:mt-0" onClick={() => setShowModal(true)}>
            ➕ Add Block
          </button>
        )}
      </header>

      {blocks.length === 0 ? (
        <div className="empty-state p-20">
          <div className="text-6xl mb-6">🏗️</div>
          <h2 className="text-xl font-black mb-2">No Blocks Yet</h2>
          <p className="text-secondary mb-6">Start by adding your society's buildings.</p>
          {isAdmin && <button className="btn btn--primary" onClick={() => setShowModal(true)}>Create First Block</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map(block => {
            const stats = block.flatStats || { total: 0, paid: 0, pending: 0, partial: 0 };
            const paidPercent = stats.total ? Math.round((stats.paid / stats.total) * 100) : 0;

            return (
              <div key={block._id} className="card hover:border-primary transition-all cursor-pointer group"
                onClick={() => navigate(`/blocks/${block._id}/flats`)}>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center text-xl font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                        {block.name}
                      </div>
                      <div>
                        <h3 className="font-black text-lg">Block {block.name}</h3>
                        <p className="text-xs font-bold text-secondary">{block.description || 'Main Building'}</p>
                      </div>
                    </div>
                    
                    <div className="relative w-12 h-12">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-emerald-500" strokeWidth="3" strokeDasharray={`${paidPercent}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black">{paidPercent}%</span>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Floors</p>
                      <p className="font-bold text-sm">{block.totalFloors}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Units</p>
                      <p className="font-bold text-sm">{stats.total}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-emerald-500 mb-1">{stats.paid}</div>
                      <div className="h-1 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-amber-500 mb-1">{stats.partial}</div>
                      <div className="h-1 bg-amber-500 rounded-full"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-rose-500 mb-1">{stats.pending}</div>
                      <div className="h-1 bg-rose-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Block Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Block">
        <form onSubmit={handleSubmit} className="modal-form p-4">
          <div className="grid gap-4">
            <div className="form-group">
              <label>Block Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., A" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Floors</label>
                <input type="number" value={formData.totalFloors} onChange={e => setFormData({ ...formData, totalFloors: parseInt(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label>Flats per Floor</label>
                <input type="number" value={formData.flatsPerFloor} onChange={e => setFormData({ ...formData, flatsPerFloor: parseInt(e.target.value) })} required />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
            </div>
          </div>

          <div className="modal-actions mt-8">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : 'Create Block'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Blocks;
