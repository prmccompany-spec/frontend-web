import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deactivateCategory,
  createPayment,
  getPaymentById,
  getAllPayments,
  getPaymentSummary,
} from '../models/paymentModel.js';
import { getMemberById } from '../models/memberModel.js';

export const fetchAllCategories = async () => {
  return await getAllCategories();
};

export const addCategory = async (data) => {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Category name is required');
    err.statusCode = 400;
    throw err;
  }
  return await createCategory(data);
};

export const recordPayment = async (data) => {
  const { member_id, category_id, amount, payment_date, collected_by, notes } = data;

  if (!member_id || !category_id || !amount || !payment_date || !collected_by) {
    const err = new Error('member_id, category_id, amount, payment_date and collected_by are required');
    err.statusCode = 400;
    throw err;
  }

  if (Number(amount) <= 0) {
    const err = new Error('Amount must be greater than zero');
    err.statusCode = 400;
    throw err;
  }

  const [member, category, collector] = await Promise.all([
    getMemberById(member_id),
    getCategoryById(category_id),
    getMemberById(collected_by),
  ]);

  if (!member) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }
  if (!category) {
    const err = new Error('Payment category not found');
    err.statusCode = 404;
    throw err;
  }
  if (!collector) {
    const err = new Error('Collector (collected_by) member not found');
    err.statusCode = 404;
    throw err;
  }

  return await createPayment({ member_id, category_id, amount, payment_date, collected_by, notes });
};

export const fetchPayments = async (filters) => {
  return await getAllPayments(filters);
};

export const fetchPaymentById = async (id) => {
  const payment = await getPaymentById(id);
  if (!payment) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }
  return payment;
};

export const modifyCategory = async (id, data) => {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Category name is required');
    err.statusCode = 400;
    throw err;
  }
  const existing = await getCategoryById(id);
  if (!existing) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return await updateCategory(id, data);
};

export const removeCategory = async (id) => {
  const existing = await getCategoryById(id);
  if (!existing) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return await deactivateCategory(id);
};

export const fetchSummary = async () => {
  return await getPaymentSummary();
};
