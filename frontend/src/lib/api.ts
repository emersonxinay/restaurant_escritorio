import axios from 'axios';

const IS_TAURI = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || window.location.hostname === 'tauri.localhost' || window.location.protocol === 'tauri:');
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || (IS_TAURI ? 'http://127.0.0.1:14234/api' : `${window.location.origin}/api`);
console.log('API_BASE_URL configured as:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Disable cookies to avoid CORS issues
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
