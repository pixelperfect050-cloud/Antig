import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token attach
api.interceptors.request.use((req) => {
  const token = localStorage.getItem('af_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('af_token');
      delete api.defaults.headers.common['Authorization'];
      // Only redirect if not already on auth pages
      if (!window.location.pathname.match(/\/(login|signup|)$/)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;