import { query } from '../config/database.js';

export const getUserById = async (userId) => {
  const results = await query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
  return results[0] || null;
};

export const getUserByEmail = async (email) => {
  const results = await query('SELECT * FROM users WHERE email = ?', [email]);
  return results[0] || null;
};

export const createUser = async (userData) => {
  const { name, email, hashedPassword, role = 'user' } = userData;
  const results = await query(
    'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
    [name, email, hashedPassword, role]
  );
  return results.insertId;
};

export const updateUser = async (userId, userData) => {
  const fields = [];
  const values = [];

  Object.entries(userData).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return null;

  values.push(userId);
  return await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteUser = async (userId) => {
  return await query('DELETE FROM users WHERE id = ?', [userId]);
};

export const getAllUsers = async (limit = 10, offset = 0) => {
  return await query(
    'SELECT id, name, email, role, created_at FROM users LIMIT ? OFFSET ?',
    [limit, offset]
  );
};
