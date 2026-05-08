import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState('email');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // error is set in context
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

      <button className="auth-theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🏘️</div>
            <h1 className="auth-title">SocietySync</h1>
            <p className="auth-subtitle">Elevate Your Living Experience</p>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100/50 rounded-2xl mb-8">
            <button type="button" onClick={() => setLoginMode('email')} 
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginMode === 'email' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}>
              Email
            </button>
            <button type="button" onClick={() => setLoginMode('mobile')} 
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginMode === 'mobile' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}>
              Mobile
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-2">
              <h2 className="text-xl font-black text-slate-900">
                {loginMode === 'email' ? 'Welcome Back' : 'OTP Login'}
              </h2>
              <p className="text-xs text-secondary font-medium">
                {loginMode === 'email' ? 'Sign in to continue managing your home' : 'Secure access via mobile OTP'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {loginMode === 'email' ? (
              <div className="grid gap-4">
                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="form-group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Security Key</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 00000 00000"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium"
                />
                <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase">A 6-digit code will be sent</p>
              </div>
            )}

            <button type="submit" className="btn btn--primary w-full py-4 rounded-2xl shadow-lg shadow-primary/20 mt-4" disabled={loading}>
              {loading ? <span className="btn-spinner"></span> : (loginMode === 'email' ? 'Authorize' : 'Get OTP')}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white px-4 text-slate-300">or</span></div>
            </div>

            <Link to="/join" className="btn btn--secondary w-full py-4 rounded-2xl">
              🏠 Join a Society
            </Link>

            <p className="auth-link">
              New resident? <Link to="/register">Create Account</Link>
            </p>
          </form>

          <div className="auth-demo-info mt-8 border-t border-slate-100 pt-6">
            <p className="text-[10px] font-black text-slate-900 uppercase mb-2">🔑 Demo Access</p>
            <div className="grid gap-1">
              <p className="text-[10px] text-secondary font-bold">ADMIN: <span className="text-primary">admin@society.com</span> / admin123</p>
              <p className="text-[10px] text-secondary font-bold">MEMBER: <span className="text-primary">member1@society.com</span> / member123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
