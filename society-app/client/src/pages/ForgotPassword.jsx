import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // email | otp | success
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSendReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address'); return; }

    setLoading(true);
    // Simulate sending reset email (backend integration point)
    try {
      await new Promise(r => setTimeout(r, 1500));
      setStep('otp');
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 4) { setError('Please enter a valid OTP'); return; }
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setStep('success');
    } catch {
      setError('Invalid OTP. Please try again.');
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
            <div className="auth-logo">🔐</div>
            <h1 className="auth-title">SocietySync</h1>
            <p className="auth-subtitle">Reset your password</p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendReset} className="auth-form">
              <h2 className="form-title">Forgot Password?</h2>
              <p className="form-subtitle">Enter your email to receive a reset code</p>

              {error && <div className="alert alert--error">{error}</div>}

              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ borderRadius: '25px', height: '50px' }}>
                {loading ? <span className="btn-spinner"></span> : 'Send Reset Code'}
              </button>

              <p className="auth-link">
                Remember your password? <Link to="/login">Sign In</Link>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <h2 className="form-title">Enter Reset Code</h2>
              <p className="form-subtitle">We sent a code to {email}</p>

              {error && <div className="alert alert--error">{error}</div>}

              <div className="form-group">
                <label htmlFor="otp-code">Verification Code</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔢</span>
                  <input
                    type="text"
                    id="otp-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ borderRadius: '25px', height: '50px' }}>
                {loading ? <span className="btn-spinner"></span> : 'Reset Password'}
              </button>

              <p className="auth-link">
                <button type="button" onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  ← Back to email
                </button>
              </p>
            </form>
          )}

          {step === 'success' && (
            <div className="auth-form" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 className="form-title">Password Reset!</h2>
              <p className="form-subtitle" style={{ marginBottom: '1.5rem' }}>
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn btn--primary btn--full" style={{ borderRadius: '25px', height: '50px' }}>
                Sign In Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
