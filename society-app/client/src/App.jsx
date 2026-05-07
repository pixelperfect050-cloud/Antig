import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import FlatGrid from './pages/FlatGrid';
import FlatDetail from './pages/FlatDetail';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import SetupSociety from './pages/SetupSociety';

import JoinSociety from './pages/JoinSociety';
import PendingApproval from './pages/PendingApproval';
import MemberRequests from './pages/MemberRequests';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  
  // If user is pending approval, only allow them on the pending page
  if (user.status === 'pending' && window.location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" />;
  }

  // If approved user tries to go to pending page, send to dashboard
  if (user.status === 'approved' && window.location.pathname === '/pending-approval') {
    return <Navigate to="/dashboard" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/join" element={<JoinSociety />} />
      <Route path="/join/:code" element={<JoinSociety />} />
      
      <Route path="/pending-approval" element={
        <ProtectedRoute>
          <PendingApproval />
        </ProtectedRoute>
      } />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="blocks" element={<Blocks />} />
        <Route path="blocks/:blockId/flats" element={<FlatGrid />} />
        <Route path="flats/:flatId" element={<FlatDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="setup" element={<SetupSociety />} />
        <Route path="requests" element={<ProtectedRoute adminOnly><MemberRequests /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
