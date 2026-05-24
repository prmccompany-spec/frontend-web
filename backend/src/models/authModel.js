import { query } from '../config/database.js';

export const findMemberByPhone = async (phone) => {
  const rows = await query(
    `SELECT m.*, ut.type_name
     FROM members m
     LEFT JOIN user_types ut ON m.user_type_id = ut.id
     WHERE m.phone = ? AND m.is_active = 1`,
    [phone]
  );
  return rows[0] || null;
};

export const createOtpSession = async (phone, otp) => {
  await query('DELETE FROM otp_sessions WHERE phone = ?', [phone]);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    'INSERT INTO otp_sessions (phone, otp, expires_at) VALUES (?, ?, ?)',
    [phone, otp, expiresAt]
  );
};

export const validateAndConsumeOtp = async (phone, otp) => {
  const rows = await query(
    'SELECT * FROM otp_sessions WHERE phone = ? AND otp = ? AND is_used = 0 AND expires_at > NOW()',
    [phone, otp]
  );
  if (rows.length === 0) return false;
  await query('UPDATE otp_sessions SET is_used = 1 WHERE id = ?', [rows[0].id]);
  return true;
};
