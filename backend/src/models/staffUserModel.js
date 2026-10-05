import { query } from '../config/database.js';

const STAFF_SELECT = `
  SELECT u.id, u.name, u.user_type_id, ut.type_name AS type_name, u.phone,
         u.father_name, u.address, u.aadhar_card, u.dob, u.is_active,
         u.created_at, u.updated_at
  FROM users u
  LEFT JOIN user_types ut ON ut.id = u.user_type_id
`;

export const getStaffUsers = async () => query(`${STAFF_SELECT} ORDER BY u.created_at DESC`);

export const getStaffUserById = async (id) => {
  const rows = await query(`${STAFF_SELECT} WHERE u.id = ?`, [id]);
  return rows[0] || null;
};

export const getStaffUserByPhone = async (phone) => {
  const rows = await query('SELECT * FROM users WHERE phone = ? ORDER BY id', [phone]);
  return rows;
};

export const createStaffUser = async (data) => {
  const result = await query(
    `INSERT INTO users (name, user_type_id, phone, password, father_name, address, aadhar_card, dob, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [data.name, data.user_type_id, data.phone, data.password, data.father_name, data.address, data.aadhar_card, data.dob]
  );
  return result.insertId;
};

export const updateStaffUser = async (id, data) => {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (!fields.length) return null;
  values.push(id);
  return query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const getStaffLoginByPhone = async (phone) => {
  const rows = await query(
    `SELECT u.*, ut.type_name
     FROM users u LEFT JOIN user_types ut ON ut.id = u.user_type_id
     WHERE u.phone = ? AND u.is_active = 1 ORDER BY u.id`,
    [phone]
  );
  return rows;
};

export const getStaffAccountByIdForAuth = async (id) => {
  const rows = await query(
    `SELECT u.*, ut.type_name
     FROM users u LEFT JOIN user_types ut ON ut.id = u.user_type_id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const getStaffAuthStatusById = async (id) => {
  const rows = await query(
    `SELECT u.id, u.user_type_id, u.is_active, ut.type_name
     FROM users u LEFT JOIN user_types ut ON ut.id = u.user_type_id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};