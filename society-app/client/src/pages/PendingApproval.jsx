import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const PendingApproval = () => {
  const { user, logout, loadUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check periodically if approved
    const interval = setInterval(() => {
      loadUser();
    }, 10000);

    if (user?.status === 'approved') {
      navigate('/dashboard');
    }

    return () => clearInterval(interval);
  }, [user, navigate, loadUser]);

  return (
    <div className="page login-page">
      <div className="login-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div className="setup-header">
          <div className="setup-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
          <h1>Approval Pending</h1>
          <p>Your request to join <strong>{user?.societyId?.name || 'the society'}</strong> is waiting for admin approval.</p>
        </div>

        <div className="alert alert--info" style={{ marginTop: '2rem' }}>
          For security reasons, you cannot access society financial data, reports, or resident lists until an administrator verifies your account.
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <h4 style={{ margin: 0 }}>Registered Details</h4>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.7 }}>
            Flat {user?.flatId?.number || 'N/A'} | {user?.residentType === 'owner' ? 'Owner' : 'Tenant'}
          </p>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn--outline" onClick={logout}>Logout</button>
          <button className="btn btn--primary" onClick={loadUser}>Check Status</button>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.5 }}>
          If you believe this is taking too long, please contact your society office.
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
