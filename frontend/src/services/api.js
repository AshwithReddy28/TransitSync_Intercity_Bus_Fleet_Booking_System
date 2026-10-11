import axios from 'axios';

const getDefaultBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    // If accessed from mobile or custom hostname on LAN
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.endsWith('vercel.app')) {
      return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
    }
  }
  // On localhost, use relative path so Vite proxy (or same-origin) routes to 8080
  return '/api/v1';
};

const api = axios.create({
  baseURL: getDefaultBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transitsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('transitsync_token');
        localStorage.removeItem('transitsync_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
