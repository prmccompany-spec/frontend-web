import api from './api';

export const getLoginHistory = (filters = {}) => api.get('/login-history', { params: filters });

export const getMyLoginHistory = (limit = 20) => api.get('/login-history/me', { params: { limit } });
