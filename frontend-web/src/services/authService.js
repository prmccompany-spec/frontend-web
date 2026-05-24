import api from './api';

const authService = {
  requestOtp: async (phone) => {
    const response = await api.post('/auth/request-otp', { phone });
    return response.data;
  },

  verifyOtp: async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
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
