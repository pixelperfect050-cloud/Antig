import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState('email');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Load saved email from "remember me"
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loginMode === 'mobile') return; // OTP not wired yet
    setLoading(true);
    try {
      // Save/remove email for remember me
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }
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
            <p className="auth-subtitle">Smart Society Management</p>
          </div>

          <div className="auth-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <button type="button" onClick={() => setLoginMode('email')} style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: loginMode === 'email' ? '2px solid var(--primary)' : 'none', color: loginMode === 'email' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Email</button>
            <button type="button" onClick={() => setLoginMode('mobile')} style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: loginMode === 'mobile' ? '2px solid var(--primary)' : 'none', color: loginMode === 'mobile' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Mobile</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="form-title">{loginMode === 'email' ? 'Welcome Back' : 'OTP Login'}</h2>
            <p className="form-subtitle">{loginMode === 'email' ? 'Sign in to your account' : 'Enter mobile number for OTP'}</p>

            {error && <div className="alert alert--error">{error}</div>}

            {loginMode === 'email' ? (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      enterKeyHint="next"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      enterKeyHint="go"
                    />
                    <button 
                      type="button" 
                      className="password-toggle" 
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="remember-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number</label>
                <div className="input-wrapper">
                  <span className="input-icon">📱</span>
                  <input
                    type="tel"
                    id="mobile"
                    placeholder="Enter 10-digit mobile number"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="send"
                    pattern="[0-9]{10}"
                  />
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  A 6-digit OTP will be sent to this number
                </div>
              </div>
            )}

            <button type="submit" className="btn btn--primary btn--full" disabled={loading} id="login-btn" style={{ borderRadius: '25px', height: '50px' }}>
              {loading ? <span className="btn-spinner"></span> : (loginMode === 'email' ? 'Sign In' : 'Send OTP')}
            </button>

            <p className="auth-link">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>

            <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <hr style={{ flex: 1, opacity: 0.1 }} />
              <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>OR</span>
              <hr style={{ flex: 1, opacity: 0.1 }} />
            </div>

            <Link to="/join" className="btn btn--outline btn--full" style={{ borderRadius: '25px' }}>
              🏠 Join Existing Society
            </Link>
          </form>

          <div className="auth-demo-info">
            <p>🔑 Demo Credentials:</p>
            <p><strong>Admin:</strong> admin@society.com / admin123</p>
            <p><strong>Member:</strong> member1@society.com / member123</p>
          </div>

          <div style={{ 
            marginTop: '2rem', 
            textAlign: 'center', 
            fontSize: '0.8rem', 
            opacity: 0.5,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '1rem'
          }}>
            <p>Powered by <span style={{ fontWeight: 'bold' }}>Funkariya</span></p>
            <a href="mailto:funkariya.shop@gmail.com" style={{ color: 'inherit', textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}>
              funkariya.shop@gmail.com
            </a>
            <Link to="/privacy-policy" style={{ color: 'var(--primary)', fontSize: '0.75rem', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
