import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Concurrent requests that all 401 at once must share a single refresh
// call — refresh tokens are single-use (rotated), so a second independent
// refresh attempt would find the first one's token already dead.
let refreshPromise = null;

const clearSessionAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/';
};

// Response interceptor - transparently refresh an expired access token once
// and retry, instead of immediately logging the user out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh');

    if (response?.status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { data } = await refreshPromise;
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        config.headers.Authorization = `Bearer ${data.access_token}`;
        return api(config);
      } catch {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }
    }

    if (response?.status === 401) {
      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default api;
