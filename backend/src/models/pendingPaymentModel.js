import { query } from '../config/database.js';

const PENDING_PAYMENT_SELECT = `
  SELECT pp.*, c.name AS category_name
  FROM pending_payments pp
  JOIN payment_categories c ON c.id = pp.category_id
`;

export const getPendingPaymentById = async (id) => {
  const results = await query(`${PENDING_PAYMENT_SELECT} WHERE pp.id = ?`, [id]);
  return results[0] || null;
};

export const getPendingPaymentsByMember = async (memberId, status = null) => {
  if (status) {
    return await query(
      `${PENDING_PAYMENT_SELECT} WHERE pp.member_id = ? AND pp.status = ? ORDER BY pp.created_at DESC`,
      [memberId, status]
    );
  }
  return await query(
    `${PENDING_PAYMENT_SELECT} WHERE pp.member_id = ? ORDER BY pp.created_at DESC`,
    [memberId]
  );
};

export const getAllPendingPayments = async () => {
  return await query(
    `SELECT pp.*, c.name AS category_name, m.name AS member_name, m.member_id AS member_code
     FROM pending_payments pp
     JOIN payment_categories c ON c.id = pp.category_id
     JOIN members m ON m.id = pp.member_id
     ORDER BY pp.created_at DESC`
  );
};

export const createPendingPayment = async ({ member_id, category_id, title, amount, due_date = null, notes = null }) => {
  const results = await query(
    `INSERT INTO pending_payments (member_id, category_id, title, amount, due_date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [member_id, category_id, title, amount, due_date, notes]
  );
  return results.insertId;
};

export const updatePendingPayment = async (id, updates) => {
  const fields = [];
  const values = [];

  // status is intentionally excluded — a due can only be marked paid by
  // clearing it through paymentService.collectDues, never a direct edit.
  ['category_id', 'title', 'amount', 'due_date', 'notes'].forEach((key) => {
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

export const markPendingPaymentPaidTx = async (connection, id) => {
  await connection.execute(
    "UPDATE pending_payments SET status = 'paid', updated_at = NOW() WHERE id = ?",
    [id]
  );
};

export const deletePendingPayment = async (id) => {
  return await query('DELETE FROM pending_payments WHERE id = ?', [id]);
};
