// API base URL — used for direct references outside of axios
export const API_URL = import.meta.env.VITE_API_URL || '/api';

const PROD_BACKEND = 'https://antig-backend-y4uy.onrender.com';

// Backend root URL (without /api) — used for uploads, socket, etc.
export const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_URL?.includes('http') ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : PROD_BACKEND);