import api from './api';

export const getMembers = () => api.get('/members');

export const getMemberById = (id) => api.get(`/members/${id}`);

export const createMember = (memberData) => api.post('/members', memberData);

export const updateMember = (id, data) => api.put(`/members/${id}`, data);

export const createAddress = (addressData) => api.post('/addresses', addressData);

export const getMemberAddresses = (memberId) => api.get(`/addresses/member/${memberId}`);

export const updateAddress = (id, data) => api.put(`/addresses/${id}`, data);

export const uploadMemberPhoto = (id, formData) =>
  api.patch(`/members/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ── Pending payments ──────────────────────────────────────────────

export const getPendingPayments = (memberId, status) =>
  api.get('/pending-payments', { params: { member_id: memberId, status } });

export const createPendingPayment = (data) => api.post('/pending-payments', data);

export const updatePendingPayment = (id, data) => api.put(`/pending-payments/${id}`, data);

export const deletePendingPayment = (id) => api.delete(`/pending-payments/${id}`);
