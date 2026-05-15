import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const userData = await api.get('/api/auth/me');
      setUser(userData);
    } catch (err) {
      console.warn('Session load failed, clearing token:', err.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Listen for storage changes (multi-tab logout sync)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        setUser(null);
      } else if (e.key === 'token' && e.newValue) {
        loadUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Visibility-based session refresh (fixes mobile background tab issues)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('token');
        if (token && !user) {
          loadUser();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      setError('');
      const data = await api.post('/api/auth/login', { email, password });
      // Ensure token is persisted before setting user state
      localStorage.setItem('token', data.token);
      // Small delay to ensure localStorage writes are flushed on mobile
      await new Promise(r => setTimeout(r, 50));
      setUser(data.user);
      return data;
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      setError(message);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const data = await api.post('/api/auth/register', userData);
      localStorage.setItem('token', data.token);
      await new Promise(r => setTimeout(r, 50));
      setUser(data.user);
      return data;
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError('');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, login, register, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
