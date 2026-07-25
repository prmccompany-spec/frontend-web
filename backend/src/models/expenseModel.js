import { query } from '../config/database.js';

// ─── Expense Categories ───────────────────────────────────────────

export const getAllCategories = async () => {
  return await query('SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY name');
};

export const getCategoryById = async (id) => {
  const rows = await query('SELECT * FROM expense_categories WHERE id = ?', [id]);
  return rows[0] || null;
};

export const createCategory = async ({ name, description = null }) => {
  const result = await query(
    'INSERT INTO expense_categories (name, description) VALUES (?, ?)',
    [name, description]
  );
  return result.insertId;
};

export const updateCategory = async (id, { name, description }) => {
  return await query(
    'UPDATE expense_categories SET name = ?, description = ? WHERE id = ?',
    [name, description ?? null, id]
  );
};

export const deactivateCategory = async (id) => {
  return await query('UPDATE expense_categories SET is_active = FALSE WHERE id = ?', [id]);
};

// ─── Expenses ──────────────────────────────────────────────────────

export const createExpense = async ({ category_id, amount, reason, created_by }) => {
  const result = await query(
    'INSERT INTO expenses (category_id, amount, reason, created_by) VALUES (?, ?, ?, ?)',
    [category_id, amount, reason, created_by]
  );
  return result.insertId;
};

export const updateExpense = async (id, { category_id, amount, reason }) => {
  return await query(
    'UPDATE expenses SET category_id = ?, amount = ?, reason = ?, updated_at = NOW() WHERE id = ?',
    [category_id, amount, reason, id]
  );
};

export const getExpenseById = async (id) => {
  const rows = await query(
    `SELECT e.*, c.name AS category_name, m.name AS created_by_name, m.member_id AS created_by_code
     FROM expenses e
     JOIN expense_categories c ON e.category_id = c.id
     JOIN members m ON e.created_by = m.id
     WHERE e.id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const getAllExpenses = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.category_id) {
    conditions.push('e.category_id = ?');
    values.push(filters.category_id);
  }
  if (filters.created_by) {
    conditions.push('e.created_by = ?');
    values.push(filters.created_by);
  }
  if (filters.date_from) {
    conditions.push('DATE(e.created_at) >= ?');
    values.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push('DATE(e.created_at) <= ?');
    values.push(filters.date_to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return await query(
    `SELECT e.*, c.name AS category_name, m.name AS created_by_name, m.member_id AS created_by_code
     FROM expenses e
     JOIN expense_categories c ON e.category_id = c.id
     JOIN members m ON e.created_by = m.id
     ${where}
     ORDER BY e.created_at DESC`,
    values
  );
};

export const getExpenseSummary = async () => {
  const [totals] = await query(
    `SELECT
       COUNT(*) AS total_transactions,
       COALESCE(SUM(amount), 0) AS total_spent,
       COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS this_month,
       COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) AS this_year
     FROM expenses`
  );
  return totals;
};
