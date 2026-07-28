import api from './api';

const persistSession = (data) => {
  if (data.access_token) localStorage.setItem('access_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
};

const authService = {
  login: async (phone, password) => {
    const response = await api.post('/auth/login', { phone, password });
    persistSession(response.data);
    return response.data;
  },

  // Exchanges the refresh token for a new access+refresh pair. Also called
  // internally by api.js's response interceptor on a 401 — exposed here too
  // in case a caller wants to pre-emptively refresh.
  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    persistSession(response.data);
    return response.data;
  },

  resetPassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    if (refreshToken) {
      // Best-effort server-side revocation — the user is already logged out
      // client-side regardless of whether this call succeeds.
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      } catch {
        /* ignore */
      }
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('access_token'),

  isAuthenticated: () => !!localStorage.getItem('access_token'),
};

export default authService;
