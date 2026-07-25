import { query } from '../config/database.js';

export const getAllUserTypes = async () => {
  return await query('SELECT * FROM user_types ORDER BY id ASC');
};

export const getUserTypeById = async (id) => {
  const results = await query('SELECT * FROM user_types WHERE id = ?', [id]);
  return results[0] || null;
};

export const getUserTypeByName = async (typeName) => {
  const results = await query('SELECT * FROM user_types WHERE type_name = ?', [typeName]);
  return results[0] || null;
};

export const createUserType = async (typeName) => {
  const results = await query(
    'INSERT INTO user_types (type_name) VALUES (?)',
    [typeName]
  );
  return results.insertId;
};

export const updateUserType = async (id, typeName) => {
  return await query(
    'UPDATE user_types SET type_name = ? WHERE id = ?',
    [typeName, id]
  );
};
