import api from './api.js';

export const getCategories = async () => {
  const res = await api.get('/expenses/categories');
  return res.data.data;
};

export const createCategory = async (data) => {
  const res = await api.post('/expenses/categories', data);
  return res.data;
};

export const updateCategory = async (id, data) => {
  const res = await api.put(`/expenses/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/expenses/categories/${id}`);
  return res.data;
};

export const getExpenses = async (filters = {}) => {
  const res = await api.get('/expenses', { params: filters });
  return res.data;
};

export const createExpense = async (data) => {
  const res = await api.post('/expenses', data);
  return res.data;
};

export const updateExpense = async (id, data) => {
  const res = await api.put(`/expenses/${id}`, data);
  return res.data;
};

export const getExpenseSummary = async () => {
  const res = await api.get('/expenses/summary');
  return res.data.data;
};
