import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('af_token'));
  const [loading, setLoading] = useState(true);

  // 🔄 Load user on refresh
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        }
      } catch (err) {
        localStorage.removeItem('af_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // 🔐 LOGIN
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    localStorage.setItem('af_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // 🆕 SIGNUP
  const signup = async (name, email, password, company, phone) => {
    const { data } = await api.post('/auth/signup', {
      name,
      email,
      password,
      company,
      phone,
    });

    localStorage.setItem('af_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem('af_token');
    delete api.defaults.headers.common['Authorization'];

    setToken(null);
    setUser(null);
  };

  // 🔄 REFRESH
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Failed to refresh user:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}