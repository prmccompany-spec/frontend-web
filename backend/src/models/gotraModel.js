import { query } from '../config/database.js';

export const getAllGotras = async () => {
  return await query('SELECT * FROM gotras ORDER BY name ASC');
};

export const getGotraById = async (id) => {
  const results = await query('SELECT * FROM gotras WHERE id = ?', [id]);
  return results[0] || null;
};

export const getGotraByName = async (name) => {
  const results = await query('SELECT * FROM gotras WHERE name = ?', [name]);
  return results[0] || null;
};

export const createGotra = async (name) => {
  const results = await query('INSERT INTO gotras (name) VALUES (?)', [name]);
  return results.insertId;
};

export const updateGotra = async (id, name) => {
  return await query('UPDATE gotras SET name = ? WHERE id = ?', [name, id]);
};
