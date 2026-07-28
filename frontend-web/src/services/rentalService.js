import api from './api';

// ── Rental Products ────────────────────────────────────────────────

export const getRentalProducts = async (params = {}) => {
  const res = await api.get('/rental-products', { params });
  return res.data.data;
};

export const createRentalProduct = async (data) => {
  const res = await api.post('/rental-products', data);
  return res.data;
};

export const updateRentalProduct = async (id, data) => {
  const res = await api.put(`/rental-products/${id}`, data);
  return res.data;
};

export const deleteRentalProduct = async (id) => {
  const res = await api.delete(`/rental-products/${id}`);
  return res.data;
};

// ── Rentals ─────────────────────────────────────────────────────────

export const getRentals = async (filters = {}) => {
  const res = await api.get('/rentals', { params: filters });
  return res.data;
};

export const createRental = async (data) => {
  const res = await api.post('/rentals', data);
  return res.data;
};

export const updateRentalStatus = async (id, status) => {
  const res = await api.patch(`/rentals/${id}/status`, { status });
  return res.data;
};

export const returnRental = async (id, data) => {
  const res = await api.patch(`/rentals/${id}/return`, data);
  return res.data;
};
