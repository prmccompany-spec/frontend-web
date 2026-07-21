import api from './api';

const authService = {
  login: async (phone) => {
    const response = await api.post('/auth/login', { phone });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  sendOtp: async (phone) => {
    const response = await api.post('/auth/otp/send', { phone });
    return response.data;
  },

  verifyOtp: async (phone, code) => {
    const response = await api.post('/auth/otp/verify', { phone, code });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('access_token'),

  isAuthenticated: () => !!localStorage.getItem('access_token'),
};

export default authService;
