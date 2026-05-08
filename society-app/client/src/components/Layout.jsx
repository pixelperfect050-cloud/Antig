import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/blocks', label: 'Flats', icon: '🏢' },
    { path: '/payments', label: 'Bills', icon: '💳' },
    { path: '/funds', label: 'Funds', icon: '💰' },
    { path: '/expenses', label: 'Costs', icon: '📉' },
    { path: '/reports', label: 'Stats', icon: '📊' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/requests', label: 'Access', icon: '🔑' });
    navItems.push({ path: '/settings', label: 'Setup', icon: '⚙️' });
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay - Mobile only */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="mobile-logo">
          <span className="logo-icon">🏘️</span>
          <span className="logo-text">SocietySync</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Sidebar / Navigation Drawer */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="mobile-logo">
            <span className="logo-icon">🏘️</span>
            <span className="logo-text">SocietySync</span>
          </div>
          <button className="sidebar-close" onClick={closeSidebar}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile only */}
      <nav className="bottom-nav">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
