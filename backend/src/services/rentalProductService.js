import {
  getAllRentalProducts,
  getRentalProductById,
  createRentalProduct,
  updateRentalProduct,
  deactivateRentalProduct,
} from '../models/rentalProductModel.js';

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const validateRates = ({ per_day_rate, per_hour_rate }) => {
  if ((per_day_rate === undefined || per_day_rate === null || per_day_rate === '') &&
      (per_hour_rate === undefined || per_hour_rate === null || per_hour_rate === '')) {
    fail('Provide at least one of per_day_rate or per_hour_rate', 400);
  }
  if (per_day_rate !== undefined && per_day_rate !== null && per_day_rate !== '' && Number(per_day_rate) <= 0) {
    fail('per_day_rate must be a positive number', 400);
  }
  if (per_hour_rate !== undefined && per_hour_rate !== null && per_hour_rate !== '' && Number(per_hour_rate) <= 0) {
    fail('per_hour_rate must be a positive number', 400);
  }
};

export const fetchRentalProducts = async ({ activeOnly = false } = {}) => {
  return await getAllRentalProducts({ activeOnly });
};

export const fetchRentalProductDetail = async (id) => {
  const product = await getRentalProductById(id);
  if (!product) fail('Rental product not found', 404);
  return product;
};

export const addRentalProduct = async (data) => {
  if (!data.name || !data.name.trim()) fail('Product name is required', 400);
  validateRates(data);

  return await createRentalProduct({
    name: data.name.trim(),
    description: data.description || null,
    per_day_rate: data.per_day_rate || null,
    per_hour_rate: data.per_hour_rate || null,
  });
};

export const modifyRentalProduct = async (id, data) => {
  const existing = await getRentalProductById(id);
  if (!existing) fail('Rental product not found', 404);
  if (!data.name || !data.name.trim()) fail('Product name is required', 400);
  validateRates(data);

  return await updateRentalProduct(id, {
    name: data.name.trim(),
    description: data.description || null,
    per_day_rate: data.per_day_rate || null,
    per_hour_rate: data.per_hour_rate || null,
  });
};

export const removeRentalProduct = async (id) => {
  const existing = await getRentalProductById(id);
  if (!existing) fail('Rental product not found', 404);
  return await deactivateRentalProduct(id);
};
