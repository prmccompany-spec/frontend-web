import api from './api';

export const getBranches = () => api.get('/branches');

export const createBranch = (name) => api.post('/branches', { name });

export const updateBranch = (id, name) => api.put(`/branches/${id}`, { name });
