import api from './api';

export const getUserTypes = () => api.get('/user-types');

export const createUserType = (typeName) =>
  api.post('/user-types', { type_name: typeName });

export const updateUserType = (id, typeName) =>
  api.put(`/user-types/${id}`, { type_name: typeName });
