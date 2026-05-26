import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import supabase from '../lib/supabase';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePasswordUpdate = async () => {
      try {
        const { data, error: err } = await supabase.auth.getSession();
        if (err || !data.session) {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (err) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      } finally {
        setValidating(false);
      }
    };
    handlePasswordUpdate();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
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
              <div className="auth-logo">🔐</div>
              <h1 className="auth-title">SocietySync</h1>
            </div>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Validating reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="auth-logo">🔐</div>
            <h1 className="auth-title">SocietySync</h1>
            <p className="auth-subtitle">Set your new password</p>
          </div>

          {success ? (
            <div className="auth-form" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 className="form-title">Password Updated!</h2>
              <p className="form-subtitle" style={{ marginBottom: '1.5rem' }}>
                Your password has been successfully updated. Redirecting to login...
              </p>
              <Link to="/login" className="btn btn--primary btn--full" style={{ borderRadius: '25px', height: '50px' }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="auth-form">
              <h2 className="form-title">New Password</h2>
              <p className="form-subtitle">Enter your new password</p>

              {error && <div className="alert alert--error">{error}</div>}

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ borderRadius: '25px', height: '50px' }}>
                {loading ? <span className="btn-spinner"></span> : 'Update Password'}
              </button>

              <p className="auth-link">
                <Link to="/login">← Back to Login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;