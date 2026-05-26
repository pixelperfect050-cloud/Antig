const rawApiBase = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://society-backend-b004.onrender.com');
const rawSocketUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://society-backend-b004.onrender.com');

export const API_BASE = rawApiBase.replace(/\/$/, '');
export const SOCKET_URL = rawSocketUrl.replace(/\/$/, '');
