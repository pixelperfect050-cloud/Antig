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
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage society settings</p>
        </div>
        {user?.role === 'admin' && (
          <div className="invite-box" style={{ 
            background: 'var(--primary-glow)', 
            padding: '1rem', 
            borderRadius: '12px',
            border: '1px solid var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'bold' }}>SOCIETY INVITE CODE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user?.societyId?.inviteCode ? (
                <>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.1rem' }}>{user.societyId.inviteCode}</span>
                  <button className="btn btn--primary btn--sm" onClick={() => {
                    const link = `${window.location.origin}/join/${user.societyId.inviteCode}`;
                    navigator.clipboard.writeText(link);
                    alert('Invite link copied to clipboard!');
                  }}>🔗 Copy Link</button>
                </>
              ) : (
                <button className="btn btn--primary btn--sm" onClick={handleGenerateCode}>✨ Generate Invite Code</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="settings-grid">
        <div className="card">
          <h3 className="card-title" style={{ padding: '1.5rem 1.5rem 0' }}>Society Information</h3>
          <form onSubmit={handleSubmit} className="settings-form">
            {message && <div className={`alert ${message.includes('success') ? 'alert--success' : 'alert--error'}`}>{message}</div>}

            <div className="form-group">
              <label htmlFor="set-name">Society Name</label>
              <input type="text" id="set-name" value={societyForm.name}
                onChange={e => setSocietyForm({ ...societyForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="set-address">Address</label>
              <input type="text" id="set-address" value={societyForm.address}
                onChange={e => setSocietyForm({ ...societyForm, address: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="set-maintenance">Maintenance Amount (₹)</label>
                <input type="number" id="set-maintenance" value={societyForm.maintenanceAmount}
                  onChange={e => setSocietyForm({ ...societyForm, maintenanceAmount: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label htmlFor="set-billing">Billing Day</label>
                <input type="number" id="set-billing" min="1" max="28" value={societyForm.billingDay}
                  onChange={e => setSocietyForm({ ...societyForm, billingDay: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="set-contact">Contact Number</label>
                <input type="text" id="set-contact" value={societyForm.contactNumber}
                  onChange={e => setSocietyForm({ ...societyForm, contactNumber: e.target.value })} placeholder="e.g. 9876543210" />
              </div>
              <div className="form-group">
                <label htmlFor="set-upi">UPI ID (for payments)</label>
                <input type="text" id="set-upi" value={societyForm.upiId}
                  onChange={e => setSocietyForm({ ...societyForm, upiId: e.target.value })} placeholder="e.g. society@upi" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="set-latefee">Late Fee/Day (₹)</label>
                <input type="number" id="set-latefee" value={societyForm.lateFeePerDay}
                  onChange={e => setSocietyForm({ ...societyForm, lateFeePerDay: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label htmlFor="set-latedays">Late Fee After Days</label>
                <input type="number" id="set-latedays" value={societyForm.lateFeeAfterDays}
                  onChange={e => setSocietyForm({ ...societyForm, lateFeeAfterDays: parseInt(e.target.value) })} />
              </div>
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving} id="save-settings-btn">
              {saving ? <span className="btn-spinner"></span> : '💾 Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
