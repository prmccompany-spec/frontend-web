import { asyncHandler } from '../middleware/errorHandler.js';
import {
  fetchAllCategories,
  addCategory,
  modifyCategory,
  removeCategory,
  recordPayment,
  fetchPayments,
  fetchPaymentById,
  fetchSummary,
} from '../services/paymentService.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await fetchAllCategories();
  res.json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const id = await addCategory(req.body);
  res.status(201).json({ success: true, message: 'Category created', id });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid category ID' });
  }
  await modifyCategory(id, req.body);
  res.json({ success: true, message: 'Category updated' });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid category ID' });
  }
  await removeCategory(id);
  res.json({ success: true, message: 'Category deactivated' });
});

export const createPayment = asyncHandler(async (req, res) => {
  const result = await recordPayment(req.body);
  res.status(201).json({ success: true, message: 'Payment recorded', ...result });
});

export const listPayments = asyncHandler(async (req, res) => {
  const { member_id, category_id, date_from, date_to } = req.query;
  const filters = {};
  if (member_id) filters.member_id = Number(member_id);
  if (category_id) filters.category_id = Number(category_id);
  if (date_from) filters.date_from = date_from;
  if (date_to) filters.date_to = date_to;

  const payments = await fetchPayments(filters);
  res.json({ success: true, count: payments.length, data: payments });
});

export const getPayment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid payment ID' });
  }
  const payment = await fetchPaymentById(id);
  res.json({ success: true, data: payment });
});

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await fetchSummary();
  res.json({ success: true, data: summary });
});
