import {
  getRentalById,
  getAllRentals,
  createRental,
  updateRentalStatus,
  settleRentalReturn,
} from '../models/rentalModel.js';
import { getRentalProductById } from '../models/rentalProductModel.js';
import { getMemberById } from '../models/memberModel.js';

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const RATE_TYPES = ['day', 'month', 'year'];
const PAYMENT_TYPES = ['cash', 'qr'];

const MS_PER_UNIT = {
  day: 1000 * 60 * 60 * 24,
  month: 1000 * 60 * 60 * 24 * 30,
  year: 1000 * 60 * 60 * 24 * 365,
};

// The day rate is always the floor — a month/year rental returned early (or
// any rental billed under a whole day) never charges below one day's rate.
const computeAmount = (rateType, rateAmount, dayRate, startDate, endDate) => {
  const ms = new Date(endDate) - new Date(startDate);
  const units = Math.max(Math.ceil(ms / MS_PER_UNIT[rateType]), 1);
  const computed = units * Number(rateAmount);
  return Math.max(computed, Number(dayRate));
};

export const bookRental = async (data) => {
  const {
    product_id, member_id, renter_name, rate_type, start_date, end_date,
    amount, advance_amount, advance_payment_type, collected_by, notes,
  } = data;

  if (!product_id || !rate_type || !start_date || !end_date) {
    fail('product_id, rate_type, start_date and end_date are required', 400);
  }
  if (!member_id && !(renter_name && renter_name.trim())) {
    fail('Select a member or enter a renter name', 400);
  }
  if (member_id && renter_name && renter_name.trim()) {
    fail('Provide either a member or a renter name, not both', 400);
  }
  if (!RATE_TYPES.includes(rate_type)) {
    fail(`rate_type must be one of: ${RATE_TYPES.join(', ')}`, 400);
  }
  if (new Date(end_date) <= new Date(start_date)) {
    fail('end_date must be after start_date', 400);
  }

  const advanceNum = advance_amount ? Number(advance_amount) : 0;
  if (Number.isNaN(advanceNum) || advanceNum < 0) fail('advance_amount cannot be negative', 400);
  if (advanceNum > 0 && (!advance_payment_type || !PAYMENT_TYPES.includes(advance_payment_type))) {
    fail('advance_payment_type (cash or qr) is required when an advance is collected', 400);
  }

  const [product, member, collector] = await Promise.all([
    getRentalProductById(product_id),
    member_id ? getMemberById(member_id) : Promise.resolve(null),
    collected_by ? getMemberById(collected_by) : Promise.resolve(null),
  ]);

  if (!product) fail('Rental product not found', 404);
  if (member_id && !member) fail('Member not found', 404);
  if (collected_by && !collector) fail('Collector (collected_by) member not found', 404);

  const rateAmount = product[`${rate_type}_rate`];
  if (!rateAmount) fail(`This product has no ${rate_type} rate configured`, 400);

  // Auto-computed with the day-rate floor by default, but the admin can
  // override it (e.g. a discount) — same pattern as the return settlement.
  let finalAmount = computeAmount(rate_type, rateAmount, product.day_rate, start_date, end_date);
  if (amount !== undefined && amount !== null && amount !== '') {
    finalAmount = Number(amount);
    if (Number.isNaN(finalAmount) || finalAmount <= 0) fail('amount must be a positive number', 400);
  }
  if (advanceNum > finalAmount) fail('advance_amount cannot exceed the amount', 400);

  return await createRental({
    product_id,
    member_id: member_id || null,
    renter_name: member_id ? null : renter_name.trim(),
    rate_type,
    rate_amount: rateAmount,
    start_date,
    end_date,
    amount: finalAmount,
    advance_amount: advanceNum,
    advance_payment_type: advanceNum > 0 ? advance_payment_type : null,
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
  if (!['active', 'cancelled'].includes(status)) {
    fail("status must be 'active' or 'cancelled' — use the return endpoint to mark a rental returned", 400);
  }
  const existing = await getRentalById(id);
  if (!existing) fail('Rental not found', 404);
  return await updateRentalStatus(id, status);
};

// Settles the balance (total − advance already collected) and marks the
// rental returned. The item may come back earlier or later than the
// originally booked end_date, so the admin supplies the actual return date
// (`end_date`, defaulting to now) and the amount is recalculated from the
// real start→end duration — not the original booking estimate. `amount`
// still lets the admin override the total outright (e.g. a discount); when
// given, it's used as-is and the recompute is skipped.
export const returnRental = async (id, { end_date, amount, settlement_payment_type }) => {
  const existing = await getRentalById(id);
  if (!existing) fail('Rental not found', 404);
  if (existing.status !== 'active') fail('Only active rentals can be returned', 400);

  const actualEndDate = end_date ? new Date(end_date) : new Date();
  if (Number.isNaN(actualEndDate.getTime())) fail('end_date is invalid', 400);
  if (actualEndDate <= new Date(existing.start_date)) fail('Return date must be after the start date', 400);

  let finalAmount;
  if (amount !== undefined && amount !== null && amount !== '') {
    finalAmount = Number(amount);
    if (Number.isNaN(finalAmount) || finalAmount <= 0) fail('amount must be a positive number', 400);
  } else {
    const product = await getRentalProductById(existing.product_id);
    finalAmount = computeAmount(existing.rate_type, existing.rate_amount, product.day_rate, existing.start_date, actualEndDate);
  }

  const balance = finalAmount - Number(existing.advance_amount);
  if (balance > 0 && (!settlement_payment_type || !PAYMENT_TYPES.includes(settlement_payment_type))) {
    fail('settlement_payment_type (cash or qr) is required to record the balance payment', 400);
  }

  return await settleRentalReturn(id, {
    end_date: actualEndDate,
    amount: finalAmount,
    settlement_payment_type: balance > 0 ? settlement_payment_type : null,
  });
};
