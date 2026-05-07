import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const JoinSociety = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(urlCode ? 2 : 1);
  const [inviteCode, setInviteCode] = useState(urlCode || '');
  const [society, setSociety] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    blockId: '',
    flatId: '',
    residentType: 'owner'
  });

  useEffect(() => {
    if (urlCode) {
      verifyInviteCode(urlCode);
    }
  }, [urlCode]);

  const verifyInviteCode = async (code) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/api/society/invite/${code}`);
      setSociety(data);
      setInviteCode(code);
      setStep(2);
      fetchBlocks(data._id);
    } catch (err) {
      setError('Invalid or expired invite code');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async (societyId) => {
    try {
      const data = await api.get(`/api/blocks?societyId=${societyId}`);
      setBlocks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFlats = async (blockId) => {
    try {
      const data = await api.get(`/api/blocks/${blockId}/flats`);
      setFlats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockChange = (e) => {
    const blockId = e.target.value;
    setFormData({ ...formData, blockId, flatId: '' });
    if (blockId) fetchFlats(blockId);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({
        ...formData,
        role: 'member',
        inviteCode
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login-page">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <div className="login-header">
          <h1>Join Society</h1>
          <p>Register as a resident member</p>
        </div>

        {step === 1 && (
          <div className="setup-form">
            <div className="form-group">
              <label>Enter Invite Code</label>
              <input 
                type="text" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="6-character code"
                style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.2rem' }}
              />
            </div>
            {error && <div className="alert alert--error">{error}</div>}
            <button 
              className="btn btn--primary btn--full" 
              onClick={() => verifyInviteCode(inviteCode)}
              disabled={loading || !inviteCode}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        )}

        {step === 2 && society && (
          <form onSubmit={handleRegister} className="setup-form">
            <div className="society-brief-card" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>{society.name}</h3>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.7, fontSize: '0.9rem' }}>{society.address}</p>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Block</label>
                <select value={formData.blockId} onChange={handleBlockChange} required>
                  <option value="">Select Block</option>
                  {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Flat</label>
                <select value={formData.flatId} onChange={e => setFormData({...formData, flatId: e.target.value})} required disabled={!formData.blockId}>
                  <option value="">Select Flat</option>
                  {flats.map(f => <option key={f._id} value={f._id}>{f.number}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Resident Type</label>
              <div className="radio-group" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" checked={formData.residentType === 'owner'} onChange={() => setFormData({...formData, residentType: 'owner'})} />
                  Owner
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" checked={formData.residentType === 'tenant'} onChange={() => setFormData({...formData, residentType: 'tenant'})} />
                  Tenant
                </label>
              </div>
            </div>

            {error && <div className="alert alert--error">{error}</div>}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn--outline" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? 'Registering...' : 'Register & Request Access'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default JoinSociety;
