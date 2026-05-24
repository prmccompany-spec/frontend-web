import api from './api.js';

export const getCategories = async () => {
  const res = await api.get('/payments/categories');
  return res.data.data;
};

export const createCategory = async (data) => {
  const res = await api.post('/payments/categories', data);
  return res.data;
};

export const updateCategory = async (id, data) => {
  const res = await api.put(`/payments/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/payments/categories/${id}`);
  return res.data;
};

export const getPayments = async (filters = {}) => {
  const res = await api.get('/payments', { params: filters });
  return res.data;
};

export const createPayment = async (data) => {
  const res = await api.post('/payments', data);
  return res.data;
};

export const getPaymentById = async (id) => {
  const res = await api.get(`/payments/${id}`);
  return res.data.data;
};

export const getPaymentSummary = async () => {
  const res = await api.get('/payments/summary');
  return res.data.data;
};
