import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const getPasswordStrength = (pw) => {
  if (!pw) return { level: 0, text: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 20, text: 'Weak', color: '#ef4444' };
  if (score <= 2) return { level: 40, text: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { level: 60, text: 'Good', color: '#eab308' };
  if (score <= 4) return { level: 80, text: 'Strong', color: '#22c55e' };
  return { level: 100, text: 'Excellent', color: '#10b981' };
};

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const strength = getPasswordStrength(formData.password);

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

      <button className="auth-theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🏘️</div>
            <h1 className="auth-title">SocietySync</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Get started with SocietySync</p>

            {(error || formError) && <div className="alert alert--error">{formError || error}</div>}

            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input type="text" id="reg-name" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Enter your full name" required 
                  autoComplete="name" enterKeyHint="next" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input type="email" id="reg-email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="Enter your email" required 
                  autoComplete="email" inputMode="email" enterKeyHint="next" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Phone Number</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input type="tel" id="reg-phone" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="Enter your phone" required 
                  autoComplete="tel" inputMode="tel" enterKeyHint="next" pattern="[0-9]{10}" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type={showPassword ? 'text' : 'password'} id="reg-password" name="password" value={formData.password}
                  onChange={handleChange} placeholder="Min 6 chars" required 
                  autoComplete="new-password" enterKeyHint="next" />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {formData.password && (
                <>
                  <div className="password-strength">
                    <div className="password-strength__bar" style={{ width: `${strength.level}%`, background: strength.color }} />
                  </div>
                  <div className="password-strength__text" style={{ color: strength.color }}>{strength.text}</div>
                </>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input type={showConfirm ? 'text' : 'password'} id="reg-confirm" name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} placeholder="Confirm password" required 
                  autoComplete="new-password" enterKeyHint="go" />
                <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full" disabled={loading} id="register-btn" style={{ borderRadius: '25px', height: '50px' }}>
              {loading ? <span className="btn-spinner"></span> : 'Create Account'}
            </button>

            <p className="auth-link">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
