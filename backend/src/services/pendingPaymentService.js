import {
  getPendingPaymentById,
  getPendingPaymentsByMember,
  getAllPendingPayments,
  createPendingPayment,
  updatePendingPayment,
  deletePendingPayment,
} from '../models/pendingPaymentModel.js';
import { getMemberById } from '../models/memberModel.js';

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

export const addPendingPayment = async (data) => {
  if (!data.member_id) fail('member_id is required', 400);
  if (!data.title) fail('title is required', 400);
  if (data.amount === undefined || data.amount === null || Number.isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    fail('amount must be a positive number', 400);
  }

  const member = await getMemberById(data.member_id);
  if (!member) fail('Member not found', 404);

  return await createPendingPayment({
    member_id: data.member_id,
    title: data.title,
    amount: Number(data.amount),
    due_date: data.due_date || null,
    notes: data.notes || null,
  });
};

export const fetchPendingPaymentsForMember = async (memberId, status = null) => {
  return await getPendingPaymentsByMember(memberId, status);
};

export const fetchAllPendingPayments = async () => {
  return await getAllPendingPayments();
};

export const modifyPendingPayment = async (id, updates) => {
  const existing = await getPendingPaymentById(id);
  if (!existing) fail('Pending payment not found', 404);

  if (updates.amount !== undefined && (Number.isNaN(Number(updates.amount)) || Number(updates.amount) <= 0)) {
    fail('amount must be a positive number', 400);
  }
  if (updates.status !== undefined && !['pending', 'paid'].includes(updates.status)) {
    fail("status must be 'pending' or 'paid'", 400);
  }

  const result = await updatePendingPayment(id, updates);
  if (!result) fail('No valid fields provided for update', 400);
  return result;
};

export const removePendingPayment = async (id) => {
  const existing = await getPendingPaymentById(id);
  if (!existing) fail('Pending payment not found', 404);
  return await deletePendingPayment(id);
};
