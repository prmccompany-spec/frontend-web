import api from './api';

export const getEvents = (status) =>
  api.get('/events', { params: status ? { status } : {} });

export const getEventById = (id) => api.get(`/events/${id}`);

export const createEvent = (formData) =>
  api.post('/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateEvent = (id, formData) =>
  api.put(`/events/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const uploadEventImage = (id, formData) =>
  api.patch(`/events/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteEvent = (id) => api.delete(`/events/${id}`);
