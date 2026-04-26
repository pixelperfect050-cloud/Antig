import axios from 'axios';

// In development, Vite proxy handles /api → localhost:5000
// In production, use the deployed backend URL
const baseURL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'https://anti-g6oh.onrender.com/api')
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem('af_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('af_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;