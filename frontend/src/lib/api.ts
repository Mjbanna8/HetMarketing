import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { STORAGE_KEYS, API_ENDPOINTS } from '../config/constants';

/**
 * PRODUCTION-READY AXIOS INSTANCE
 * 
 * Security Justification:
 * - Refresh Token: Stored in httpOnly cookie (Backend setter) for XSS protection.
 * - Access Token: Stored in localStorage (short-lived) for Bearer auth headers.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Attach tokens
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Determine which token to use based on route
    const tokenKey = config.url?.includes('/admin') 
      ? STORAGE_KEYS.ADMIN_ACCESS_TOKEN 
      : STORAGE_KEYS.ACCESS_TOKEN;
    
    const token = localStorage.getItem(tokenKey);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 and Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log error with context for observability
    console.error(`[API ERROR] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        api.post(API_ENDPOINTS.REFRESH)
          .then(({ data }) => {
            const { accessToken } = data.data;
            const isAdminRoute = originalRequest.url?.includes('/admin');
            const tokenKey = isAdminRoute ? STORAGE_KEYS.ADMIN_ACCESS_TOKEN : STORAGE_KEYS.ACCESS_TOKEN;
            
            localStorage.setItem(tokenKey, accessToken);
            api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            processQueue(null, accessToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.ADMIN_ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_INFO);
            
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // Global error handler for non-401 failures
    if (error.response?.status !== 401) {
      const message = (error.response?.data as any)?.error || error.message || 'An unexpected error occurred';
      toast.error(message, { id: 'global-api-error' });
    }

    return Promise.reject(error);
  }
);

export default api;
