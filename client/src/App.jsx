import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateJob from './pages/CreateJob';
import Jobs from './pages/Jobs';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import DashboardLayout from './components/Layout/DashboardLayout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-surface-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? children : <Navigate to="/dashboard" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/jobs/create" element={<ProtectedRoute><DashboardLayout><CreateJob /></DashboardLayout></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><DashboardLayout><Jobs /></DashboardLayout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><DashboardLayout><Orders /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><DashboardLayout><Admin /></DashboardLayout></AdminRoute></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
