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
      const data = await api.get(`/api/blocks/public/${societyId}`);
      setBlocks(data);
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    }
  };

  const fetchFlats = async (blockId) => {
    try {
      const data = await api.get(`/api/flats/public/block/${blockId}`);
      setFlats(data);
    } catch (err) {
      console.error('Failed to fetch flats:', err);
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
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-shape shape-1"></div>
        <div className="auth-bg-shape shape-2"></div>
        <div className="auth-bg-shape shape-3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🏘️</div>
            <h1 className="auth-title">SocietySync</h1>
            <p className="auth-subtitle">Join Your Digital Community</p>
          </div>

          {step === 1 && (
            <div className="auth-form">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-black text-slate-900">Enter Invite Code</h2>
                <p className="text-xs text-secondary font-medium">Provided by your society admin</p>
              </div>

              <div className="form-group">
                <input 
                  type="text" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="CODE24"
                  className="w-full py-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-3xl font-black text-center tracking-[0.5rem] text-primary"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button 
                className="btn btn--primary w-full py-4 rounded-2xl shadow-lg shadow-primary/20 mt-4" 
                onClick={() => verifyInviteCode(inviteCode)}
                disabled={loading || !inviteCode}
              >
                {loading ? <span className="btn-spinner"></span> : 'Verify Code'}
              </button>

              <p className="auth-link">
                Already registered? <Link to="/login">Sign In</Link>
              </p>
            </div>
          )}

          {step === 2 && society && (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 text-4xl group-hover:rotate-12 transition-transform">🏢</div>
                <h3 className="text-sm font-black text-primary uppercase tracking-tight truncate">{society.name}</h3>
                <p className="text-[10px] font-bold text-secondary truncate mt-1">{society.address}</p>
              </div>

              <div className="grid gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Full Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@ext.com" required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                  </div>
                  <div className="form-group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..." required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Security Key</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Block</label>
                    <select value={formData.blockId} onChange={handleBlockChange} required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium">
                      <option value="">Select</option>
                      {blocks.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Flat</label>
                    <select value={formData.flatId} onChange={e => setFormData({...formData, flatId: e.target.value})} required disabled={!formData.blockId}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium">
                      <option value="">Select</option>
                      {flats.map(f => <option key={f._id} value={f._id}>Flat {f.number}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Resident Type</label>
                  <div className="flex gap-4 mt-2">
                    {['owner', 'tenant'].map(type => (
                      <label key={type} className="flex-1 cursor-pointer">
                        <input type="radio" className="hidden" checked={formData.residentType === type} onChange={() => setFormData({...formData, residentType: type})} />
                        <div className={`py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest transition-all border ${formData.residentType === type ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-secondary'}`}>
                          {type}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
              
              <div className="flex gap-4 mt-6">
                <button type="button" className="btn btn--secondary flex-1 py-4 rounded-2xl" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn btn--primary flex-[2] py-4 rounded-2xl shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? <span className="btn-spinner"></span> : 'Request Access'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinSociety;
