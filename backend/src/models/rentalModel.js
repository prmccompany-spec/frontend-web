import { query } from '../config/database.js';

const SELECT_BASE = `
  SELECT r.*,
    p.name AS product_name,
    m.name AS member_name, m.member_id AS member_code,
    cb.name AS collected_by_name
  FROM rentals r
  JOIN rental_products p ON r.product_id = p.id
  JOIN members m ON r.member_id = m.id
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
  product_id, member_id, rate_type, rate_amount, start_date, end_date,
  amount, payment_type = 'cash', collected_by = null, notes = null,
}) => {
  const result = await query(
    `INSERT INTO rentals
      (product_id, member_id, rate_type, rate_amount, start_date, end_date, amount, payment_type, collected_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [product_id, member_id, rate_type, rate_amount, start_date, end_date, amount, payment_type, collected_by, notes]
  );
  return result.insertId;
};

export const updateRentalStatus = async (id, status) => {
  const returned_at = status === 'returned' ? new Date() : null;
  return await query(
    'UPDATE rentals SET status = ?, returned_at = ?, updated_at = NOW() WHERE id = ?',
    [status, returned_at, id]
  );
};
