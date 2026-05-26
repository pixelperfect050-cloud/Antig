import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TourGuide from './TourGuide';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/blocks', icon: '🏢', label: 'Blocks & Flats' },
    { path: '/payments', icon: '🏠', label: 'Maintenance' },
    { path: '/funds', icon: '💰', label: 'Society Funds' },
    { path: '/payment-verification', icon: '✅', label: 'Verify Payments', adminOnly: true },
    { path: '/requests', icon: '👥', label: 'Member Requests', adminOnly: true },
    { path: '/expenses', icon: '📋', label: 'Expenses', adminOnly: true },
    { path: '/reports', icon: '📈', label: 'Reports' },
    { path: '/admin-management', icon: '👑', label: 'Admin Management', adminOnly: true },
    { path: '/activity-log', icon: '📋', label: 'Activity Log', adminOnly: true },
    { path: '/demo-leads', icon: '📊', label: 'Demo Leads', adminOnly: true },
    { path: '/notifications', icon: '🔔', label: 'Notifications' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ].filter(item => !item.adminOnly || isAdmin);

  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const tourSeen = localStorage.getItem('tour_seen');
    if (!tourSeen && user) {
      // Small delay to ensure layout is rendered
      setTimeout(() => setRunTour(true), 1500);
    }
  }, [user]);

  const handleTourComplete = () => {
    setRunTour(false);
    localStorage.setItem('tour_seen', 'true');
  };

  // Expose tour trigger to window for Settings page access
  window.triggerTour = () => setRunTour(true);

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} id="menu-toggle">
          <span></span><span></span><span></span>
        </button>
        <div className="mobile-logo">
          <span className="logo-icon">🏘️</span>
          <span className="logo-text">SocietySync</span>
        </div>
        <button className="theme-toggle-mobile" onClick={toggleTheme} id="theme-toggle-mobile">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏘️</span>
            <span className="logo-text">SocietySync</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role === 'admin' ? '🛡️ Admin' : '👤 Member'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              id={`nav-${item.path.replace('/', '') || 'home'}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} id="theme-toggle">
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          <button className="logout-btn" onClick={handleLogout} id="logout-btn">
            🚪 Logout
          </button>
          
          <div className="branding-footer" style={{ 
            marginTop: 'auto', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            fontSize: '0.75rem',
            opacity: 0.6
          }}>
            <p>Powered by <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Funkariya</span></p>
            <a href="mailto:funkariya.shop@gmail.com" style={{ color: 'inherit', textDecoration: 'none', display: 'block', marginTop: '0.25rem' }}>
              📧 Contact Support
            </a>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        {menuItems.slice(0, 5).map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      <TourGuide run={runTour} onComplete={handleTourComplete} />
    </div>
  );
};

export default Layout;
