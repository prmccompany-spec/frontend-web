import api from './api';

export const getMemberStatuses = () => api.get('/member-statuses');

export const createMemberStatus = (statusName) =>
  api.post('/member-statuses', { status_name: statusName });

export const updateMemberStatus = (id, statusName) =>
  api.put(`/member-statuses/${id}`, { status_name: statusName });
