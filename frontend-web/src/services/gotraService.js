import api from './api';

export const getGotras = () => api.get('/gotras');

export const createGotra = (name) => api.post('/gotras', { name });

export const updateGotra = (id, name) => api.put(`/gotras/${id}`, { name });
