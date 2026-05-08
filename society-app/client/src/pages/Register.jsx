import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/setup');
    } catch (err) {
      // error set in context
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

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-2">
              <h2 className="text-xl font-black text-slate-900">Create Account</h2>
              <p className="text-xs text-secondary font-medium">Step into a smarter way of living</p>
            </div>

            {(error || formError) && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span>⚠️</span> {formError || error}
              </div>
            )}

            <div className="grid gap-4">
              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 00000 00000" required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 chars" required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Confirm</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat" required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium" />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn--primary w-full py-4 rounded-2xl shadow-lg shadow-primary/20 mt-4" disabled={loading}>
              {loading ? <span className="btn-spinner"></span> : 'Secure Registration'}
            </button>

            <p className="auth-link">
              Member already? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
  );
};

export default Register;
