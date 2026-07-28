import api from './api';

export const getBranches = () => api.get('/branches');

export const createBranch = (name, gotraId) => api.post('/branches', { name, gotra_id: gotraId });

export const updateBranch = (id, name, gotraId) => api.put(`/branches/${id}`, { name, gotra_id: gotraId });
