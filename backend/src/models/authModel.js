import { query } from '../config/database.js';

export const findMemberByPhone = async (phone) => {
  const rows = await query(
    `SELECT m.*, ut.type_name, ms.status_name
     FROM members m
     LEFT JOIN user_types ut ON m.user_type_id = ut.id
     LEFT JOIN member_status ms ON m.status_id = ms.id
     WHERE m.phone = ?`,
    [phone]
  );
  return rows[0] || null;
};

export const findMemberById = async (id) => {
  const rows = await query(
    `SELECT m.*, ut.type_name, ms.status_name
     FROM members m
     LEFT JOIN user_types ut ON m.user_type_id = ut.id
     LEFT JOIN member_status ms ON m.status_id = ms.id
     WHERE m.id = ?`,
    [id]
  );
  return rows[0] || null;
};
