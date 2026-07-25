import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deactivateCategory,
  createExpense,
  updateExpense,
  getExpenseById,
  getAllExpenses,
  getExpenseSummary,
} from '../models/expenseModel.js';

const fail = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

// ─── Categories ────────────────────────────────────────────────────

export const fetchAllCategories = async () => {
  return await getAllCategories();
};

export const addCategory = async (data) => {
  if (!data.name || !data.name.trim()) fail('Category name is required', 400);
  return await createCategory(data);
};

export const modifyCategory = async (id, data) => {
  if (!data.name || !data.name.trim()) fail('Category name is required', 400);
  const existing = await getCategoryById(id);
  if (!existing) fail('Category not found', 404);
  return await updateCategory(id, data);
};

export const removeCategory = async (id) => {
  const existing = await getCategoryById(id);
  if (!existing) fail('Category not found', 404);
  return await deactivateCategory(id);
};

// ─── Expenses ──────────────────────────────────────────────────────

export const recordExpense = async ({ category_id, amount, reason, created_by }) => {
  if (!category_id || !amount || !reason || !reason.trim()) {
    fail('category_id, amount and reason are required', 400);
  }
  if (Number(amount) <= 0) fail('Amount must be greater than zero', 400);

  const category = await getCategoryById(category_id);
  if (!category) fail('Expense category not found', 404);

  return await createExpense({ category_id, amount, reason: reason.trim(), created_by });
};

export const modifyExpense = async (id, { category_id, amount, reason }) => {
  const existing = await getExpenseById(id);
  if (!existing) fail('Expense not found', 404);

  if (!category_id || !amount || !reason || !reason.trim()) {
    fail('category_id, amount and reason are required', 400);
  }
  if (Number(amount) <= 0) fail('Amount must be greater than zero', 400);

  const category = await getCategoryById(category_id);
  if (!category) fail('Expense category not found', 404);

  return await updateExpense(id, { category_id, amount, reason: reason.trim() });
};

export const fetchExpenses = async (filters) => {
  return await getAllExpenses(filters);
};

export const fetchExpenseById = async (id) => {
  const expense = await getExpenseById(id);
  if (!expense) fail('Expense not found', 404);
  return expense;
};

export const fetchSummary = async () => {
  return await getExpenseSummary();
};
