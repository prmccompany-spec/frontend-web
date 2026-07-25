import { asyncHandler } from '../middleware/errorHandler.js';
import {
  fetchAllCategories,
  addCategory,
  modifyCategory,
  removeCategory,
  recordExpense,
  modifyExpense,
  fetchExpenses,
  fetchExpenseById,
  fetchSummary,
} from '../services/expenseService.js';

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

export const createExpense = asyncHandler(async (req, res) => {
  const id = await recordExpense({ ...req.body, created_by: req.user.id });
  res.status(201).json({ success: true, message: 'Expense recorded', id });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid expense ID' });
  }
  await modifyExpense(id, req.body);
  res.json({ success: true, message: 'Expense updated' });
});

export const listExpenses = asyncHandler(async (req, res) => {
  const { category_id, created_by, date_from, date_to } = req.query;
  const filters = {};
  if (category_id) filters.category_id = Number(category_id);
  if (created_by) filters.created_by = Number(created_by);
  if (date_from) filters.date_from = date_from;
  if (date_to) filters.date_to = date_to;

  const expenses = await fetchExpenses(filters);
  res.json({ success: true, count: expenses.length, data: expenses });
});

export const getExpense = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid expense ID' });
  }
  const expense = await fetchExpenseById(id);
  res.json({ success: true, data: expense });
});

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await fetchSummary();
  res.json({ success: true, data: summary });
});
