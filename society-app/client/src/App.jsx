import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StatusBar } from '@capacitor/status-bar';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
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
import PaymentVerification from './pages/PaymentVerification';
import Funds from './pages/Funds';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ReceiptView from './pages/ReceiptView';
import FunkiAI from './components/FunkiAI';

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

  useEffect(() => {
    // Hide the status bar for a game-like full screen experience
    const hideStatusBar = async () => {
      try {
        await StatusBar.hide();
      } catch (e) {
        console.log('StatusBar not available');
      }
    };
    hideStatusBar();

    // Keep-alive ping to prevent Render backend from sleeping
    const pingBackend = () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://society-backend-b004.onrender.com';
      fetch(`${apiUrl}/api/health`)
        .then(() => console.log('Backend pinged to keep it awake 🚀'))
        .catch(err => console.error('Ping failed:', err));
    };

    // Ping immediately and then every 14 minutes
    pingBackend();
    const interval = setInterval(pingBackend, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  return (
    <Routes>
      {/* Landing page — show only when NOT logged in */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      
      {/* Auth pages */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
      <Route path="/join" element={<JoinSociety />} />
      <Route path="/join/:code" element={<JoinSociety />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      
      <Route path="/pending-approval" element={
        <ProtectedRoute>
          <PendingApproval />
        </ProtectedRoute>
      } />

      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
      </Route>

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
        <Route path="payment-verification" element={<ProtectedRoute adminOnly><PaymentVerification /></ProtectedRoute>} />
        <Route path="funds" element={<Funds />} />
        <Route path="receipt/:paymentId" element={<ReceiptView />} />
      </Route>
      {user && <FunkiAI />}
    </Routes>
  );
}

export default App;
