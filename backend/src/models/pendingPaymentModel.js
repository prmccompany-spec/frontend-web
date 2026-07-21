import { query } from '../config/database.js';

export const getPendingPaymentById = async (id) => {
  const results = await query('SELECT * FROM pending_payments WHERE id = ?', [id]);
  return results[0] || null;
};

export const getPendingPaymentsByMember = async (memberId, status = null) => {
  if (status) {
    return await query(
      'SELECT * FROM pending_payments WHERE member_id = ? AND status = ? ORDER BY created_at DESC',
      [memberId, status]
    );
  }
  return await query(
    'SELECT * FROM pending_payments WHERE member_id = ? ORDER BY created_at DESC',
    [memberId]
  );
};

export const getAllPendingPayments = async () => {
  return await query(
    `SELECT pp.*, m.name AS member_name, m.member_id AS member_code
     FROM pending_payments pp
     JOIN members m ON m.id = pp.member_id
     ORDER BY pp.created_at DESC`
  );
};

export const createPendingPayment = async ({ member_id, title, amount, due_date = null, notes = null }) => {
  const results = await query(
    `INSERT INTO pending_payments (member_id, title, amount, due_date, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [member_id, title, amount, due_date, notes]
  );
  return results.insertId;
};

export const updatePendingPayment = async (id, updates) => {
  const fields = [];
  const values = [];

  ['title', 'amount', 'due_date', 'notes', 'status'].forEach((key) => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (fields.length === 0) {
    return null;
  }

  fields.push('updated_at = NOW()');
  values.push(id);
  return await query(`UPDATE pending_payments SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deletePendingPayment = async (id) => {
  return await query('DELETE FROM pending_payments WHERE id = ?', [id]);
};
