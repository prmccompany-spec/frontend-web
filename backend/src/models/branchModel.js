import { query } from '../config/database.js';

const BRANCH_SELECT = `
  SELECT b.*, g.name AS gotra_name
  FROM branches b
  LEFT JOIN gotras g ON g.id = b.gotra_id
`;

export const getAllBranches = async () => {
  return await query(`${BRANCH_SELECT} ORDER BY b.name ASC`);
};

export const getBranchById = async (id) => {
  const results = await query(`${BRANCH_SELECT} WHERE b.id = ?`, [id]);
  return results[0] || null;
};

export const getBranchByName = async (name) => {
  const results = await query('SELECT * FROM branches WHERE name = ?', [name]);
  return results[0] || null;
};

export const createBranch = async (name, gotraId) => {
  const results = await query('INSERT INTO branches (name, gotra_id) VALUES (?, ?)', [name, gotraId]);
  return results.insertId;
};

export const updateBranch = async (id, name, gotraId) => {
  return await query('UPDATE branches SET name = ?, gotra_id = ? WHERE id = ?', [name, gotraId, id]);
};
