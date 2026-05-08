import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Settings = () => {
  const { user, loadUser } = useAuth();
  const [societyForm, setSocietyForm] = useState({
    name: user?.societyId?.name || '',
    address: user?.societyId?.address || '',
    maintenanceAmount: user?.societyId?.maintenanceAmount || 3000,
    lateFeePerDay: user?.societyId?.lateFeePerDay || 50,
    lateFeeAfterDays: user?.societyId?.lateFeeAfterDays || 15,
    billingDay: user?.societyId?.billingDay || 1,
    contactNumber: user?.societyId?.contactNumber || '',
    upiId: user?.societyId?.upiId || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const sid = user?.societyId?._id || user?.societyId;
      await api.put(`/api/society/${sid}`, societyForm);
      setMessage('Settings saved successfully!');
      loadUser();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const sid = user?.societyId?._id || user?.societyId;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await api.put(`/api/society/${sid}`, { inviteCode: code });
      loadUser();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure society parameters</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Admin Tools Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {user?.role === 'admin' && (
            <div className="card border-primary/20 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:rotate-12 transition-transform">✨</div>
              <div className="p-6">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4">Onboarding Tools</p>
                <h3 className="text-sm font-black text-slate-900 mb-6">Society Invite Code</h3>
                
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
                  {user?.societyId?.inviteCode ? (
                    <>
                      <span className="text-3xl font-black text-primary tracking-widest">{user.societyId.inviteCode}</span>
                      <p className="text-[10px] font-bold text-secondary uppercase">Share this code with residents</p>
                      <button className="btn btn--primary btn--sm w-full mt-2" onClick={() => {
                        const link = `${window.location.origin}/join/${user.societyId.inviteCode}`;
                        navigator.clipboard.writeText(link);
                        alert('Link copied!');
                      }}>🔗 Copy Invite Link</button>
                    </>
                  ) : (
                    <button className="btn btn--primary btn--sm w-full" onClick={handleGenerateCode}>Generate Code</button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card p-6 bg-slate-50/50 border-dashed">
            <h4 className="text-xs font-black text-slate-900 mb-2 uppercase tracking-tight">Need Help?</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Updating these settings will affect bill generation and member registration globally across the society.
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-8">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm font-black">🏢</div>
              <h3 className="text-lg font-black text-slate-900">Society Configuration</h3>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {message && (
                <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 text-xs font-bold ${message.includes('success') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  <span>{message.includes('success') ? '✅' : '⚠️'}</span>
                  {message}
                </div>
              )}

              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label>Society Name</label>
                    <input type="text" value={societyForm.name} onChange={e => setSocietyForm({ ...societyForm, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Billing Day (1-28)</label>
                    <input type="number" min="1" max="28" value={societyForm.billingDay} onChange={e => setSocietyForm({ ...societyForm, billingDay: parseInt(e.target.value) })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Address</label>
                  <input type="text" value={societyForm.address} onChange={e => setSocietyForm({ ...societyForm, address: e.target.value })} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="form-group">
                    <label>Maintenance (₹)</label>
                    <input type="number" value={societyForm.maintenanceAmount} onChange={e => setSocietyForm({ ...societyForm, maintenanceAmount: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Late Fee/Day (₹)</label>
                    <input type="number" value={societyForm.lateFeePerDay} onChange={e => setSocietyForm({ ...societyForm, lateFeePerDay: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Late After (Days)</label>
                    <input type="number" value={societyForm.lateFeeAfterDays} onChange={e => setSocietyForm({ ...societyForm, lateFeeAfterDays: parseInt(e.target.value) })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label>Admin Contact</label>
                    <input type="text" value={societyForm.contactNumber} onChange={e => setSocietyForm({ ...societyForm, contactNumber: e.target.value })} placeholder="9876543210" />
                  </div>
                  <div className="form-group">
                    <label>Society UPI ID</label>
                    <input type="text" value={societyForm.upiId} onChange={e => setSocietyForm({ ...societyForm, upiId: e.target.value })} placeholder="society@upi" />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <button type="submit" className="btn btn--primary w-full sm:w-auto px-12" disabled={saving}>
                  {saving ? <span className="btn-spinner"></span> : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
