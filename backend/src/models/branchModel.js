import { query } from '../config/database.js';

export const getAllBranches = async () => {
  return await query('SELECT * FROM branches ORDER BY name ASC');
};

export const getBranchById = async (id) => {
  const results = await query('SELECT * FROM branches WHERE id = ?', [id]);
  return results[0] || null;
};

export const getBranchByName = async (name) => {
  const results = await query('SELECT * FROM branches WHERE name = ?', [name]);
  return results[0] || null;
};

export const createBranch = async (name) => {
  const results = await query('INSERT INTO branches (name) VALUES (?)', [name]);
  return results.insertId;
};

export const updateBranch = async (id, name) => {
  return await query('UPDATE branches SET name = ? WHERE id = ?', [name, id]);
};
