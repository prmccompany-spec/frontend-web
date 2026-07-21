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
