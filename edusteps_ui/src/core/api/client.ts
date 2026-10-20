// src/core/api/client.ts
import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '@/core/env'
import { clearAuth } from '@/core/utils/storage'

// API URL Configuration
// Priority: 1. .env file (VITE_API_BASE_URL), 2. Default to localhost for dev
const getApiUrl = () => {
  // Check if VITE_API_BASE_URL is set in .env or Netlify
  if (env.VITE_API_BASE_URL) {
    return env.VITE_API_BASE_URL;
  }
  // Default to localhost for development
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getApiUrl();

export const getServerBaseUrl = () => {
  const trimmed = API_BASE_URL.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed.slice(0, -4);
  }
  return trimmed;
};

export const resolveApiAssetUrl = (path?: string | null) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = getServerBaseUrl();
  if (path.startsWith('/')) return `${baseUrl}${path}`;
  return `${baseUrl}/${path}`;
};

// Request queue for rate limiting
const requestQueue: Array<() => void> = [];
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;
const REQUEST_DELAY = 100; // ms between requests

function processQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) return;
  
  const next = requestQueue.shift();
  if (next) {
    activeRequests++;
    next();
    setTimeout(processQueue, REQUEST_DELAY);
  }
}

function enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        activeRequests--;
        processQueue();
      }
    });
    processQueue();
  });
}



/**
 * AXIOS INSTANCE (FINAL)
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Wrap axios methods with rate limiting
const originalGet = api.get.bind(api);
const originalPost = api.post.bind(api);
const originalPut = api.put.bind(api);
const originalDelete = api.delete.bind(api);

api.get = ((url: string, config?: any) => enqueueRequest(() => originalGet(url, config))) as any;
api.post = ((url: string, data?: any, config?: any) => enqueueRequest(() => originalPost(url, data, config))) as any;
api.put = ((url: string, data?: any, config?: any) => enqueueRequest(() => originalPut(url, data, config))) as any;
api.delete = ((url: string, config?: any) => enqueueRequest(() => originalDelete(url, config))) as any;

/**
 * ================= TOKEN HELPERS =================
 */
// Secure in-memory token store — never written to localStorage
let _memToken: string | null = null;

export function getToken(): string | null {
  return _memToken;
}

export function setToken(token: string) {
  _memToken = token;
  // Also persist to sessionStorage so page refresh works (cleared on tab close)
  try { sessionStorage.setItem('access_token', token); } catch { /* ignore */ }
}

export function removeToken() {
  _memToken = null;
  try { sessionStorage.removeItem('access_token'); } catch { /* ignore */ }
  try { localStorage.removeItem('access_token'); } catch { /* ignore */ } // clean up old key
}

// Restore token from sessionStorage on module load (handles page refresh)
_memToken = (() => {
  try {
    return sessionStorage.getItem('access_token') ?? localStorage.getItem('access_token');
  } catch { return null; }
})();

/**
 * ================= REQUEST INTERCEPTOR =================
 */
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = getToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * ================= RESPONSE INTERCEPTOR =================
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        timestamp: new Date().toISOString()
      };

      // Handle 429 Too Many Requests with retry
      if (error.response?.status === 429 && error.config) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '2', 10);
        await new Response(resolve => setTimeout(resolve, retryAfter * 1000)); // fixed timeout syntax
        return api.request(error.config);
      }

      // Only auto-logout on 401 for authenticated requests (not for /auth/login itself)
      if (error.response?.status === 401) {
        const url = error.config?.url ?? ''
        const isLoginRequest = url.includes('/auth/login') || url.includes('/auth/register')
        if (!isLoginRequest) {
          clearAuth()
          if (typeof window !== 'undefined') {
            window.location.assign('/login')
          }
        }
      }
      
      // Only log in development
      if (import.meta.env.DEV) {
        console.error('API Error:', errorDetails);
        if (error.response?.status === 500) {
          console.error('Server Error Details:', {
            ...errorDetails,
            requestData: error.config?.data,
            headers: error.config?.headers
          });
        }
      }
    } else if (import.meta.env.DEV) {
      console.error('Non-Axios Error:', error);
    }
    return Promise.reject(error);
  },
);

export default api;