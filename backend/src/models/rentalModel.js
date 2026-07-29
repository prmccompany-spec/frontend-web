import { query } from '../config/database.js';

// Mirrors paymentModel.js's generatePaymentRef — same shape, different
// prefix, so every income source in the app carries a consistent,
// human-shareable reference id for future lookup/reconciliation.
const generateRentalRef = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RENT-${date}-${rand}`;
};

const SELECT_BASE = `
  SELECT r.*,
    p.name AS product_name,
    m.name AS member_name, m.member_id AS member_code,
    cb.name AS collected_by_name
  FROM rentals r
  JOIN rental_products p ON r.product_id = p.id
  LEFT JOIN members m ON r.member_id = m.id
  LEFT JOIN members cb ON r.collected_by = cb.id
`;

export const getRentalById = async (id) => {
  const rows = await query(`${SELECT_BASE} WHERE r.id = ?`, [id]);
  return rows[0] || null;
};

export const getAllRentals = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.member_id) {
    conditions.push('r.member_id = ?');
    values.push(filters.member_id);
  }
  if (filters.product_id) {
    conditions.push('r.product_id = ?');
    values.push(filters.product_id);
  }
  if (filters.status) {
    conditions.push('r.status = ?');
    values.push(filters.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return await query(
    `${SELECT_BASE} ${where} ORDER BY r.created_at DESC`,
    values
  );
};

export const createRental = async ({
  product_id, member_id, renter_name, rate_type, rate_amount, start_date, end_date,
  amount, advance_amount = 0, advance_payment_type = null, collected_by = null, notes = null,
}) => {
  const rental_ref = generateRentalRef();
  const result = await query(
    `INSERT INTO rentals
      (rental_ref, product_id, member_id, renter_name, rate_type, rate_amount, start_date, end_date, amount, advance_amount, advance_payment_type, collected_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [rental_ref, product_id, member_id, renter_name, rate_type, rate_amount, start_date, end_date, amount, advance_amount, advance_payment_type, collected_by, notes]
  );
  return { id: result.insertId, rental_ref };
};

// Only for 'active' <-> 'cancelled' — returning a rental goes through
// settleRentalReturn instead, since it also records the final settlement.
export const updateRentalStatus = async (id, status) => {
  return await query(
    'UPDATE rentals SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id]
  );
};

export const settleRentalReturn = async (id, { end_date, amount, settlement_payment_type }) => {
  return await query(
    `UPDATE rentals
     SET status = 'returned', end_date = ?, amount = ?, settlement_payment_type = ?, returned_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [end_date, amount, settlement_payment_type, id]
  );
};
