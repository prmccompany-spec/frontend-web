import { getRentalById, getAllRentals, createRental, updateRentalStatus } from '../models/rentalModel.js';
import { getRentalProductById } from '../models/rentalProductModel.js';
import { getMemberById } from '../models/memberModel.js';

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

export const bookRental = async (data) => {
  const { product_id, member_id, rate_type, start_date, end_date, amount, payment_type = 'cash', collected_by, notes } = data;

  if (!product_id || !member_id || !rate_type || !start_date || !end_date) {
    fail('product_id, member_id, rate_type, start_date and end_date are required', 400);
  }
  if (!['day', 'hour'].includes(rate_type)) {
    fail("rate_type must be 'day' or 'hour'", 400);
  }
  if (!['cash', 'qr'].includes(payment_type)) {
    fail('payment_type must be cash or qr', 400);
  }
  if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    fail('amount must be a positive number', 400);
  }
  if (new Date(end_date) <= new Date(start_date)) {
    fail('end_date must be after start_date', 400);
  }

  const [product, member, collector] = await Promise.all([
    getRentalProductById(product_id),
    getMemberById(member_id),
    collected_by ? getMemberById(collected_by) : Promise.resolve(null),
  ]);

  if (!product) fail('Rental product not found', 404);
  if (!member) fail('Member not found', 404);
  if (collected_by && !collector) fail('Collector (collected_by) member not found', 404);

  const rate_amount = rate_type === 'day' ? product.per_day_rate : product.per_hour_rate;
  if (!rate_amount) fail(`This product has no per-${rate_type} rate configured`, 400);

  return await createRental({
    product_id,
    member_id,
    rate_type,
    rate_amount,
    start_date,
    end_date,
    amount: Number(amount),
    payment_type,
    collected_by: collected_by || null,
    notes: notes || null,
  });
};

export const fetchRentals = async (filters) => {
  return await getAllRentals(filters);
};

export const fetchRentalDetail = async (id) => {
  const rental = await getRentalById(id);
  if (!rental) fail('Rental not found', 404);
  return rental;
};

export const changeRentalStatus = async (id, status) => {
  if (!['active', 'returned', 'cancelled'].includes(status)) {
    fail("status must be 'active', 'returned' or 'cancelled'", 400);
  }
  const existing = await getRentalById(id);
  if (!existing) fail('Rental not found', 404);
  return await updateRentalStatus(id, status);
};
