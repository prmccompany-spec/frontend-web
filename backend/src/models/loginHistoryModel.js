import { query } from '../config/database.js';

const SELECT_BASE = `
  SELECT lh.*, m.name AS member_name, m.member_id AS member_code
  FROM login_history lh
  LEFT JOIN members m ON m.id = lh.member_id
`;

export const recordLogin = async ({
  member_id = null, phone = null, status, failure_reason = null, ip_address = null, user_agent = null,
}) => {
  const result = await query(
    `INSERT INTO login_history (member_id, phone, status, failure_reason, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [member_id, phone, status, failure_reason, ip_address, user_agent]
  );
  return result.insertId;
};

export const getLoginHistory = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.member_id) {
    conditions.push('lh.member_id = ?');
    values.push(filters.member_id);
  }
  if (filters.status) {
    conditions.push('lh.status = ?');
    values.push(filters.status);
  }
  if (filters.from) {
    conditions.push('lh.created_at >= ?');
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push('lh.created_at <= ?');
    values.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return await query(
    `${SELECT_BASE} ${where} ORDER BY lh.created_at DESC LIMIT ${Number(filters.limit) || 500}`,
    values
  );
};
