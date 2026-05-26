import { API_BASE } from '../lib/apiConfig';
import { captureError, addBreadcrumb } from './sentry';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (res) => {
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseErr) {
    if (res.ok) return {};
    captureError(parseErr, { status: res.status, url: res.url });
    throw new Error(`Server error (status ${res.status})`);
  }
  if (!res.ok) {
    const error = new Error(data.message || `Server error (status ${res.status})`);
    captureError(error, { data, status: res.status, url: res.url });
    throw error;
  }
  return data;
};

// Retry wrapper for mobile network resilience
const fetchWithRetry = async (url, options, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      addBreadcrumb(`API Request: ${options.method || 'GET'} ${url}`, 'http', {
        url,
        method: options.method || 'GET',
        retryCount: i
      });

      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      if (i === retries) {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection.');
        }
        throw new Error('Network error. Please check your internet connection.');
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

const api = {
  get: async (url) => {
    const res = await fetchWithRetry(`${API_BASE}${url}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  post: async (url, body) => {
    const res = await fetchWithRetry(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  put: async (url, body) => {
    const res = await fetchWithRetry(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  delete: async (url) => {
    const res = await fetchWithRetry(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  download: async (url, filename) => {
    const res = await fetch(`${API_BASE}${url}`, { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Download failed');
    }
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default api;
