import api from './api';

export const getStaffUsers = () => api.get('/staff-users');
export const createStaffUser = (data) => api.post('/staff-users', data);
export const updateStaffUser = (id, data) => api.put(`/staff-users/${id}`, data);
export const setStaffUserActive = (id, isActive) => api.patch(`/staff-users/${id}/active`, { is_active: isActive });