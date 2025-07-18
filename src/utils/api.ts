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
    if (error.response?.status === 401) {
      SweetAlert.sessionExpired();
      localStorage.removeItem('token');
      localStorage.removeItem('doctor');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please slow down requests.');
      // You could show a toast notification here
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
