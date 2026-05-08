import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const SetupSociety = () => {
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', state: '', pincode: '',
    maintenanceAmount: 3000, lateFeePerDay: 50, lateFeeAfterDays: 15, billingDay: 1
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/society', formData);
      await loadUser();
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (user?.societyId) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape shape-1"></div>
        <div className="auth-bg-shape shape-2"></div>
        <div className="auth-bg-shape shape-3"></div>
      </div>

      <div className="auth-container" style={{ maxWidth: '600px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🏙️</div>
            <h1 className="auth-title">Setup Your Society</h1>
            <p className="auth-subtitle">Lay the foundation for your digital community</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-900">Society Identity</h2>
              <p className="text-xs text-secondary font-medium">Basic information that residents will see</p>
            </div>

            <div className="grid gap-6">
              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Society Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sunrise Heights" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Primary Address</label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Landmark" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">City</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">State</label>
                  <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="State"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Pincode</label>
                  <input type="text" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h2 className="text-xl font-black text-slate-900 mb-1">Financial Parameters</h2>
                <p className="text-xs text-secondary font-medium mb-6">Default billing configuration for all flats</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Maintenance (₹)</label>
                    <input type="number" value={formData.maintenanceAmount} onChange={e => setFormData({ ...formData, maintenanceAmount: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                  </div>
                  <div className="form-group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Billing Day</label>
                    <input type="number" min="1" max="28" value={formData.billingDay} onChange={e => setFormData({ ...formData, billingDay: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn--primary w-full py-4 rounded-2xl shadow-lg shadow-primary/20 mt-8" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : '🚀 Initialize Society'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupSociety;
