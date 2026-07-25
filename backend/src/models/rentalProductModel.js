import { query } from '../config/database.js';

export const getAllRentalProducts = async ({ activeOnly = false } = {}) => {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  return await query(`SELECT * FROM rental_products ${where} ORDER BY name`);
};

export const getRentalProductById = async (id) => {
  const rows = await query('SELECT * FROM rental_products WHERE id = ?', [id]);
  return rows[0] || null;
};

export const createRentalProduct = async ({ name, description = null, per_day_rate = null, per_hour_rate = null }) => {
  const result = await query(
    'INSERT INTO rental_products (name, description, per_day_rate, per_hour_rate) VALUES (?, ?, ?, ?)',
    [name, description, per_day_rate, per_hour_rate]
  );
  return result.insertId;
};

export const updateRentalProduct = async (id, { name, description, per_day_rate, per_hour_rate }) => {
  return await query(
    'UPDATE rental_products SET name = ?, description = ?, per_day_rate = ?, per_hour_rate = ? WHERE id = ?',
    [name, description ?? null, per_day_rate ?? null, per_hour_rate ?? null, id]
  );
};

export const deactivateRentalProduct = async (id) => {
  return await query('UPDATE rental_products SET is_active = 0 WHERE id = ?', [id]);
};
