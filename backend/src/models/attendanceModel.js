import { query } from '../config/database.js';

// CURDATE()/NOW() are computed by MySQL, not JS — keeps "today" consistent
// with the DB server's own clock/timezone instead of the app server's.

export const createCheckIn = async ({ member_id, marked_by = null }) => {
  const result = await query(
    `INSERT INTO attendance (member_id, attendance_date, check_in_time, marked_by)
     VALUES (?, CURDATE(), NOW(), ?)`,
    [member_id, marked_by]
  );
  return result.insertId;
};

export const getOpenSession = async (memberId) => {
  const rows = await query(
    `SELECT * FROM attendance
     WHERE member_id = ? AND attendance_date = CURDATE() AND check_out_time IS NULL
     ORDER BY check_in_time DESC
     LIMIT 1`,
    [memberId]
  );
  return rows[0] || null;
};

export const setCheckOut = async (id) => {
  return await query(
    'UPDATE attendance SET check_out_time = NOW(), updated_at = NOW() WHERE id = ?',
    [id]
  );
};

export const getAttendanceById = async (id) => {
  const rows = await query('SELECT * FROM attendance WHERE id = ?', [id]);
  return rows[0] || null;
};

export const getAttendance = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.member_id) {
    conditions.push('a.member_id = ?');
    values.push(filters.member_id);
  }
  if (filters.date) {
    conditions.push('a.attendance_date = ?');
    values.push(filters.date);
  }
  if (filters.from) {
    conditions.push('a.attendance_date >= ?');
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push('a.attendance_date <= ?');
    values.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return await query(
    `SELECT a.*, m.name AS member_name, m.member_id AS member_code
     FROM attendance a
     JOIN members m ON m.id = a.member_id
     ${where}
     ORDER BY a.check_in_time DESC`,
    values
  );
};
