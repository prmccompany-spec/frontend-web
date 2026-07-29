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

// day_rate is the floor for every rental regardless of tier chosen, so it's
// mandatory. month_rate/year_rate are optional — a product can be day-only.
const validateRates = ({ day_rate, month_rate, year_rate }) => {
  if (day_rate === undefined || day_rate === null || day_rate === '' || Number(day_rate) <= 0) {
    fail('day_rate is required and must be a positive number', 400);
  }
  if (month_rate !== undefined && month_rate !== null && month_rate !== '' && Number(month_rate) <= 0) {
    fail('month_rate must be a positive number', 400);
  }
  if (year_rate !== undefined && year_rate !== null && year_rate !== '' && Number(year_rate) <= 0) {
    fail('year_rate must be a positive number', 400);
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
    day_rate: Number(data.day_rate),
    month_rate: data.month_rate ? Number(data.month_rate) : null,
    year_rate: data.year_rate ? Number(data.year_rate) : null,
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
    day_rate: Number(data.day_rate),
    month_rate: data.month_rate ? Number(data.month_rate) : null,
    year_rate: data.year_rate ? Number(data.year_rate) : null,
  });
};

export const removeRentalProduct = async (id) => {
  const existing = await getRentalProductById(id);
  if (!existing) fail('Rental product not found', 404);
  return await deactivateRentalProduct(id);
};
