import { asyncHandler } from '../middleware/errorHandler.js';
import {
  fetchRentalProducts,
  fetchRentalProductDetail,
  addRentalProduct,
  modifyRentalProduct,
  removeRentalProduct,
} from '../services/rentalProductService.js';

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid rental product ID' });
    return null;
  }
  return id;
};

export const listRentalProducts = asyncHandler(async (req, res) => {
  const activeOnly = req.query.active === 'true';
  const products = await fetchRentalProducts({ activeOnly });
  res.json({ success: true, count: products.length, data: products });
});

export const getRentalProduct = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const product = await fetchRentalProductDetail(id);
  res.json({ success: true, data: product });
});

export const createRentalProduct = asyncHandler(async (req, res) => {
  const id = await addRentalProduct(req.body);
  res.status(201).json({ success: true, message: 'Rental product created', id });
});

export const updateRentalProduct = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  await modifyRentalProduct(id, req.body);
  res.json({ success: true, message: 'Rental product updated' });
});

export const deleteRentalProduct = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  await removeRentalProduct(id);
  res.json({ success: true, message: 'Rental product deactivated' });
});
