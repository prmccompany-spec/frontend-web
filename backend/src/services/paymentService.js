import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deactivateCategory,
  createPayment,
  insertPaymentTx,
  updatePayment,
  getPaymentById,
  getAllPayments,
  getPaymentSummary,
} from '../models/paymentModel.js';
import { getMemberById } from '../models/memberModel.js';
import { getPendingPaymentById, markPendingPaymentPaidTx } from '../models/pendingPaymentModel.js';
import { withTransaction } from '../config/database.js';

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
  const { member_id, category_id, amount, payment_date, collected_by, payment_type = 'cash', notes } = data;

  if (!member_id || !category_id || !amount || !payment_date || !collected_by) {
    const err = new Error('member_id, category_id, amount, payment_date and collected_by are required');
    err.statusCode = 400;
    throw err;
  }

  if (!['cash', 'qr'].includes(payment_type)) {
    const err = new Error('payment_type must be cash or qr');
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

  return await createPayment({ member_id, category_id, amount, payment_date, collected_by, payment_type, notes });
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

export const modifyPayment = async (id, { category_id, amount, payment_date, payment_type, notes }) => {
  const existing = await getPaymentById(id);
  if (!existing) {
    const err = new Error('Payment not found');
    err.statusCode = 404;
    throw err;
  }

  if (existing.pending_payment_id) {
    const err = new Error('Payments used to clear dues cannot be edited');
    err.statusCode = 400;
    throw err;
  }

  if (!category_id || amount === undefined || amount === null || amount === '' || !payment_date) {
    const err = new Error('category_id, amount and payment_date are required');
    err.statusCode = 400;
    throw err;
  }
  if (!['cash', 'qr'].includes(payment_type)) {
    const err = new Error('payment_type must be cash or qr');
    err.statusCode = 400;
    throw err;
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const err = new Error('Amount must be greater than zero');
    err.statusCode = 400;
    throw err;
  }

  const category = await getCategoryById(category_id);
  if (!category) {
    const err = new Error('Payment category not found');
    err.statusCode = 404;
    throw err;
  }

  return await updatePayment(id, {
    category_id,
    amount: numericAmount,
    payment_date,
    payment_type,
    notes: notes?.trim() || null,
  });
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

// Clears one or more dues for a member in a single atomic operation. Each
// due becomes its own `payments` row (using the due's own category/amount,
// never client-supplied — dues are full-settle only) and is marked paid.
// Serves both "clear this one due" (1 id) and "Collect All Due" (all ids).
export const collectDues = async ({ member_id, pending_payment_ids, collected_by, payment_date, payment_type = 'cash', notes = null }) => {
  if (!member_id) {
    const err = new Error('member_id is required');
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(pending_payment_ids) || pending_payment_ids.length === 0) {
    const err = new Error('pending_payment_ids must be a non-empty array');
    err.statusCode = 400;
    throw err;
  }
  if (!payment_date || !collected_by) {
    const err = new Error('payment_date and collected_by are required');
    err.statusCode = 400;
    throw err;
  }
  if (!['cash', 'qr'].includes(payment_type)) {
    const err = new Error('payment_type must be cash or qr');
    err.statusCode = 400;
    throw err;
  }

  const [member, collector] = await Promise.all([
    getMemberById(member_id),
    getMemberById(collected_by),
  ]);
  if (!member) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }
  if (!collector) {
    const err = new Error('Collector (collected_by) member not found');
    err.statusCode = 404;
    throw err;
  }

  const dues = await Promise.all(pending_payment_ids.map((id) => getPendingPaymentById(id)));
  dues.forEach((due, i) => {
    if (!due) {
      const err = new Error(`Pending payment ${pending_payment_ids[i]} not found`);
      err.statusCode = 404;
      throw err;
    }
    if (Number(due.member_id) !== Number(member_id)) {
      const err = new Error(`Pending payment ${due.id} does not belong to this member`);
      err.statusCode = 400;
      throw err;
    }
    if (due.status !== 'pending') {
      const err = new Error(`Pending payment ${due.id} is already ${due.status}`);
      err.statusCode = 400;
      throw err;
    }
  });

  const payments = await withTransaction(async (connection) => {
    const created = [];
    for (const due of dues) {
      const payment = await insertPaymentTx(connection, {
        member_id,
        category_id: due.category_id,
        amount: due.amount,
        payment_date,
        collected_by,
        payment_type,
        notes,
        pending_payment_id: due.id,
      });
      await markPendingPaymentPaidTx(connection, due.id);
      created.push({ id: payment.id, payment_ref: payment.payment_ref, amount: due.amount });
    }
    return created;
  });

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return { payments, total };
};
