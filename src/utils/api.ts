import axios from 'axios';
import { SweetAlert } from './SweetAlert';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if this is a danger zone auth request - don't auto-redirect for these
    const isDangerZoneAuth = error.config?.url?.includes('/auth/danger-zone-auth');
    
    if (error.response?.status === 401 && !isDangerZoneAuth) {
      SweetAlert.sessionExpired();
      localStorage.removeItem('token');
      localStorage.removeItem('doctor');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please slow down requests.');
      // Show user-friendly message for rate limiting
      SweetAlert.warning('Rate Limit Exceeded', 'You are making requests too quickly. Please wait a moment and try again.');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      SweetAlert.networkError();
    } else if (!error.response) {
      // Network error
      SweetAlert.networkError();
    }
    return Promise.reject(error);
  }
);

export default api;
