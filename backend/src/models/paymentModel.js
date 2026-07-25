import { query } from '../config/database.js';

const generatePaymentRef = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${date}-${rand}`;
};

// ─── Payment Categories ───────────────────────────────────────────

export const getAllCategories = async () => {
  return await query('SELECT * FROM payment_categories WHERE is_active = 1 ORDER BY name');
};

export const getCategoryById = async (id) => {
  const rows = await query('SELECT * FROM payment_categories WHERE id = ?', [id]);
  return rows[0] || null;
};

export const createCategory = async ({ name, description = null, default_amount = null }) => {
  const result = await query(
    'INSERT INTO payment_categories (name, description, default_amount) VALUES (?, ?, ?)',
    [name, description, default_amount]
  );
  return result.insertId;
};

export const updateCategory = async (id, { name, description, default_amount }) => {
  return await query(
    'UPDATE payment_categories SET name = ?, description = ?, default_amount = ? WHERE id = ?',
    [name, description ?? null, default_amount ?? null, id]
  );
};

export const deactivateCategory = async (id) => {
  return await query('UPDATE payment_categories SET is_active = FALSE WHERE id = ?', [id]);
};

// ─── Payments ────────────────────────────────────────────────────

export const createPayment = async ({ member_id, category_id, amount, payment_date, collected_by, payment_type = 'cash', notes = null, pending_payment_id = null }) => {
  const payment_ref = generatePaymentRef();
  const result = await query(
    `INSERT INTO payments (payment_ref, member_id, pending_payment_id, category_id, amount, payment_date, collected_by, payment_type, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [payment_ref, member_id, pending_payment_id, category_id, amount, payment_date, collected_by, payment_type, notes]
  );
  return { id: result.insertId, payment_ref };
};

// Runs on a caller-supplied transaction connection — used by
// paymentService.collectDues so that inserting the payment row and
// marking its due 'paid' commit or roll back together.
export const insertPaymentTx = async (connection, { member_id, category_id, amount, payment_date, collected_by, payment_type = 'cash', notes = null, pending_payment_id = null }) => {
  const payment_ref = generatePaymentRef();
  const [result] = await connection.execute(
    `INSERT INTO payments (payment_ref, member_id, pending_payment_id, category_id, amount, payment_date, collected_by, payment_type, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [payment_ref, member_id, pending_payment_id, category_id, amount, payment_date, collected_by, payment_type, notes]
  );
  return { id: result.insertId, payment_ref };
};

export const updatePayment = async (id, { category_id, amount, payment_date, payment_type, notes }) => {
  return await query(
    `UPDATE payments SET category_id = ?, amount = ?, payment_date = ?, payment_type = ?, notes = ?, updated_at = NOW()
     WHERE id = ?`,
    [category_id, amount, payment_date, payment_type, notes ?? null, id]
  );
};

export const getPaymentById = async (id) => {
  const rows = await query(
    `SELECT p.*,
       m.name AS member_name, m.member_id AS member_code,
       c.name AS category_name,
       cb.name AS collected_by_name
     FROM payments p
     JOIN members m ON p.member_id = m.id
     JOIN payment_categories c ON p.category_id = c.id
     JOIN members cb ON p.collected_by = cb.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const getAllPayments = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.member_id) {
    conditions.push('p.member_id = ?');
    values.push(filters.member_id);
  }
  if (filters.category_id) {
    conditions.push('p.category_id = ?');
    values.push(filters.category_id);
  }
  if (filters.date_from) {
    conditions.push('p.payment_date >= ?');
    values.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push('p.payment_date <= ?');
    values.push(filters.date_to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return await query(
    `SELECT p.*,
       m.name AS member_name, m.member_id AS member_code,
       c.name AS category_name,
       cb.name AS collected_by_name
     FROM payments p
     JOIN members m ON p.member_id = m.id
     JOIN payment_categories c ON p.category_id = c.id
     JOIN members cb ON p.collected_by = cb.id
     ${where}
     ORDER BY p.payment_date DESC, p.created_at DESC`,
    values
  );
};

export const getPaymentSummary = async () => {
  const [totals] = await query(
    `SELECT
       COUNT(*) AS total_transactions,
       COALESCE(SUM(amount), 0) AS total_collected,
       COALESCE(SUM(CASE WHEN MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS this_month,
       COALESCE(SUM(CASE WHEN YEAR(payment_date) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS this_year
     FROM payments`
  );

  const byCategory = await query(
    `SELECT c.name AS category, COUNT(*) AS count, COALESCE(SUM(p.amount), 0) AS total
     FROM payments p
     JOIN payment_categories c ON p.category_id = c.id
     GROUP BY p.category_id, c.name
     ORDER BY total DESC`
  );

  const byPaymentType = await query(
    `SELECT payment_type, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
     FROM payments
     GROUP BY payment_type`
  );

  const byCollector = await query(
    `SELECT m.name, m.member_id AS member_code, COUNT(*) AS count, COALESCE(SUM(p.amount), 0) AS total_collected
     FROM payments p
     JOIN members m ON p.collected_by = m.id
     GROUP BY p.collected_by, m.name, m.member_id
     ORDER BY total_collected DESC`
  );

  const topPayers = await query(
    `SELECT m.name, m.member_id AS member_code, COUNT(*) AS count, SUM(p.amount) AS total_paid
     FROM payments p
     JOIN members m ON p.member_id = m.id
     GROUP BY p.member_id, m.name, m.member_id
     ORDER BY total_paid DESC
     LIMIT 10`
  );

  const monthly = await query(
    `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month, COUNT(*) AS count, SUM(amount) AS total
     FROM payments
     GROUP BY month
     ORDER BY month DESC
     LIMIT 12`
  );

  return { totals, byCategory, byPaymentType, byCollector, topPayers, monthly };
};
