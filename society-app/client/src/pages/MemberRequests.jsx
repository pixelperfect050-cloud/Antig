import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/api';

const MemberRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const data = await api.get(`/api/society/${user.societyId._id}/members?status=${filter}`);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, status) => {
    setProcessing(userId);
    try {
      await api.put(`/api/society/member/${userId}/status`, { status });
      setRequests(requests.filter(r => r._id !== userId));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setProcessing(userId);
    try {
      await api.delete(`/api/society/member/${userId}`);
      setRequests(requests.filter(r => r._id !== userId));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Member Requests</h1>
          <p className="page-subtitle">Manage resident approvals and access</p>
        </div>
        <div className="tab-group">
          <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
          <button className={`tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Approved</button>
          <button className={`tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected</button>
          <button className={`tab ${filter === 'suspended' ? 'active' : ''}`} onClick={() => setFilter('suspended')}>Suspended</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loader-container"><div className="spinner"></div></div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No {filter} requests</h3>
            <p>New residents joining using the invite code will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Contact</th>
                  <th>Flat</th>
                  <th>Type</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div className="member-info">
                        <div className="avatar">{req.name.charAt(0)}</div>
                        <div className="name-box">
                          <span className="name">{req.name}</span>
                          <span className="email">{req.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{req.phone}</td>
                    <td>
                      <span className="badge badge--outline">
                        Flat {req.flatId?.number || 'N/A'}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{req.residentType}</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group">
                        {filter === 'pending' && (
                          <>
                            <button 
                              className="btn btn--primary btn--sm" 
                              onClick={() => handleAction(req._id, 'approved')}
                              disabled={processing === req._id}
                            >
                              {processing === req._id ? '...' : 'Approve'}
                            </button>
                            <button 
                              className="btn btn--error btn--sm" 
                              onClick={() => handleAction(req._id, 'rejected')}
                              disabled={processing === req._id}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {filter === 'approved' && (
                          <button 
                            className="btn btn--warning btn--sm" 
                            onClick={() => handleAction(req._id, 'suspended')}
                            disabled={processing === req._id}
                          >
                            Suspend
                          </button>
                        )}
                        {(filter === 'rejected' || filter === 'suspended') && (
                          <>
                            <button 
                              className="btn btn--primary btn--sm" 
                              onClick={() => handleAction(req._id, 'approved')}
                              disabled={processing === req._id}
                            >
                              Re-Approve
                            </button>
                            <button 
                              className="btn btn--error btn--sm" 
                              onClick={() => handleDelete(req._id)}
                              disabled={processing === req._id}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberRequests;
