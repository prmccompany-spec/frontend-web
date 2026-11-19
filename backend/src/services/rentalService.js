import {
  getRentalById,
  getAllRentals,
  createRental,
  updateRentalStatus,
  settleRentalReturn,
} from '../models/rentalModel.js';
import { getRentalProductById } from '../models/rentalProductModel.js';
import { getMemberById } from '../models/memberModel.js';
import { getStaffUserById } from '../models/staffUserModel.js';

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
const computeAmount = (rateType, rateAmount, dayRate, startDate, endDate, quantity = 1) => {
  const ms = new Date(endDate) - new Date(startDate);
  const units = Math.max(Math.ceil(ms / MS_PER_UNIT[rateType]), 1);
  const qty = Math.max(1, Number(quantity) || 1);
  const computed = units * Number(rateAmount) * qty;
  return Math.max(computed, Number(dayRate) * qty);
};

export const bookRental = async (data) => {
  const {
    items, product_id, quantity, rate_type, amount,
    member_id, renter_name, start_date, end_date,
    advance_amount, advance_payment_type, collected_by, collected_by_type = 'member', notes,
  } = data;

  if (!start_date || !end_date) {
    fail('start_date and end_date are required', 400);
  }
  if (!member_id && !(renter_name && renter_name.trim())) {
    fail('Select a member or enter a renter name', 400);
  }
  if (member_id && renter_name && renter_name.trim()) {
    fail('Provide either a member or a renter name, not both', 400);
  }
  if (!['member', 'staff'].includes(collected_by_type)) {
    fail('collected_by_type must be member or staff', 400);
  }
  if (new Date(end_date) <= new Date(start_date)) {
    fail('end_date must be after start_date', 400);
  }

  const [member, collector] = await Promise.all([
    member_id ? getMemberById(member_id) : Promise.resolve(null),
    collected_by
      ? collected_by_type === 'staff' ? getStaffUserById(collected_by) : getMemberById(collected_by)
      : Promise.resolve(null),
  ]);

  if (member_id && !member) fail('Member not found', 404);
  if (collected_by && (!collector || (collected_by_type === 'staff' && !collector.is_active))) {
    fail(`Collector (collected_by) ${collected_by_type} not found or inactive`, 404);
  }

  // Normalize items array: supports both multi-item bookings (data.items) and legacy single product
  const rawItems = Array.isArray(items) && items.length > 0
    ? items
    : [{ product_id, quantity: quantity || 1, rate_type, amount }];

  if (rawItems.length === 0 || !rawItems[0].product_id) {
    fail('At least one rental product must be selected', 400);
  }

  // Validate each item and check inventory availability
  const processedItems = [];
  for (const item of rawItems) {
    if (!item.product_id) fail('Product is required for each rental item', 400);
    const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const itemRateType = item.rate_type || 'day';

    if (!RATE_TYPES.includes(itemRateType)) {
      fail(`rate_type must be one of: ${RATE_TYPES.join(', ')}`, 400);
    }

    const product = await getRentalProductById(item.product_id);
    if (!product) fail(`Rental product ID ${item.product_id} not found`, 404);

    const available = Number(product.available_quantity !== undefined ? product.available_quantity : product.total_quantity || 1);
    if (itemQty > available) {
      fail(`Cannot rent ${itemQty} of "${product.name}". Only ${available} available.`, 400);
    }

    const rateAmount = product[`${itemRateType}_rate`];
    if (!rateAmount) fail(`"${product.name}" has no ${itemRateType} rate configured`, 400);

    let finalItemAmount = computeAmount(itemRateType, rateAmount, product.day_rate, start_date, end_date, itemQty);
    if (item.amount !== undefined && item.amount !== null && item.amount !== '') {
      finalItemAmount = Number(item.amount);
      if (Number.isNaN(finalItemAmount) || finalItemAmount <= 0) fail('amount must be a positive number', 400);
    }

    processedItems.push({
      product_id: item.product_id,
      product_name: product.name,
      quantity: itemQty,
      rate_type: itemRateType,
      rate_amount: rateAmount,
      amount: finalItemAmount,
    });
  }

  const totalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);

  const advanceNum = advance_amount ? Number(advance_amount) : 0;
  if (Number.isNaN(advanceNum) || advanceNum < 0) fail('advance_amount cannot be negative', 400);
  if (advanceNum > 0 && (!advance_payment_type || !PAYMENT_TYPES.includes(advance_payment_type))) {
    fail('advance_payment_type (cash or qr) is required when an advance is collected', 400);
  }
  if (advanceNum > totalAmount) fail('advance_amount cannot exceed the total amount', 400);

  // Create single rental booking header with all items attached
  const created = await createRental({
    items: processedItems,
    member_id: member_id || null,
    renter_name: member_id ? null : renter_name.trim(),
    start_date,
    end_date,
    amount: totalAmount,
    advance_amount: advanceNum,
    advance_payment_type: advanceNum > 0 ? advance_payment_type : null,
    collected_by: collected_by || null,
    collected_by_type,
    notes: notes || null,
  });

  return {
    id: created.id,
    rental_ref: created.rental_ref,
    total_amount: totalAmount,
    items: processedItems,
  };
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
    if (existing.items && existing.items.length > 0) {
      finalAmount = 0;
      for (const item of existing.items) {
        const prod = await getRentalProductById(item.product_id);
        const itemTotal = computeAmount(
          item.rate_type,
          item.rate_amount,
          prod ? prod.day_rate : 0,
          existing.start_date,
          actualEndDate,
          item.quantity || 1
        );
        finalAmount += itemTotal;
      }
    } else {
      const product = await getRentalProductById(existing.product_id);
      finalAmount = computeAmount(existing.rate_type, existing.rate_amount, product ? product.day_rate : 0, existing.start_date, actualEndDate, existing.quantity || 1);
    }
  }

  const balance = finalAmount - Number(existing.advance_amount);
  if (balance > 0 && (!settlement_payment_type || !PAYMENT_TYPES.includes(settlement_payment_type))) {
    fail('settlement_payment_type (cash or qr) is required to record the balance payment', 400);
  }

  return await settleRentalReturn(id, {
    end_date: actualEndDate,
    amount: finalAmount,
    settlement_payment_type: settlement_payment_type || (balance !== 0 ? 'cash' : null),
  });
};
