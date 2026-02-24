import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
  paramsSerializer: {
    serialize: (params) => {
      const urlParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Serialize arrays as repeated parameters: key=val1&key=val2
          value.forEach(item => urlParams.append(key, item));
        } else if (value !== undefined && value !== null) {
          urlParams.append(key, value);
        }
      });

      return urlParams.toString();
    }
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user only if not on auth pages
        const authPages = ['/login', '/register', '/verify-2fa', '/forgot-password', '/reset-password', '/verify-email'];
        const isAuthPage = authPages.some(page => window.location.pathname.includes(page));

        if (!isAuthPage) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors (but don't show toast for auth pages as they handle their own errors)
    const authPages = ['/login', '/register', '/verify-2fa', '/forgot-password', '/reset-password', '/verify-email', '/setup-2fa'];
    const isAuthPage = authPages.some(page => window.location.pathname.includes(page));

    if (!isAuthPage) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
