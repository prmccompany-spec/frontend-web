import { query } from '../config/database.js';

export const getAllRentalProducts = async ({ activeOnly = false } = {}) => {
  const where = activeOnly ? 'WHERE p.is_active = 1' : '';
  try {
    return await query(`
      SELECT p.*,
        COALESCE(p.total_quantity, 1) AS total_quantity,
        COALESCE(active_rentals.rented_quantity, 0) AS rented_quantity,
        GREATEST(0, COALESCE(p.total_quantity, 1) - COALESCE(active_rentals.rented_quantity, 0)) AS available_quantity
      FROM rental_products p
      LEFT JOIN (
        SELECT ri.product_id, SUM(ri.quantity) AS rented_quantity
        FROM rental_items ri
        JOIN rentals r ON ri.rental_id = r.id
        WHERE r.status = 'active'
        GROUP BY ri.product_id
      ) active_rentals ON p.id = active_rentals.product_id
      ${where}
      ORDER BY p.name
    `);
  } catch {
    return await query(`
      SELECT p.*,
        COALESCE(p.total_quantity, 1) AS total_quantity,
        0 AS rented_quantity,
        COALESCE(p.total_quantity, 1) AS available_quantity
      FROM rental_products p
      ${where}
      ORDER BY p.name
    `);
  }
};

export const getRentalProductById = async (id) => {
  try {
    const rows = await query(`
      SELECT p.*,
        COALESCE(p.total_quantity, 1) AS total_quantity,
        COALESCE(active_rentals.rented_quantity, 0) AS rented_quantity,
        GREATEST(0, COALESCE(p.total_quantity, 1) - COALESCE(active_rentals.rented_quantity, 0)) AS available_quantity
      FROM rental_products p
      LEFT JOIN (
        SELECT ri.product_id, SUM(ri.quantity) AS rented_quantity
        FROM rental_items ri
        JOIN rentals r ON ri.rental_id = r.id
        WHERE r.status = 'active'
        GROUP BY ri.product_id
      ) active_rentals ON p.id = active_rentals.product_id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  } catch {
    const rows = await query(`
      SELECT p.*,
        COALESCE(p.total_quantity, 1) AS total_quantity,
        0 AS rented_quantity,
        COALESCE(p.total_quantity, 1) AS available_quantity
      FROM rental_products p
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  }
};

export const createRentalProduct = async ({ name, description = null, total_quantity = 1, day_rate, month_rate = null, year_rate = null }) => {
  const result = await query(
    'INSERT INTO rental_products (name, description, total_quantity, day_rate, month_rate, year_rate) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, total_quantity, day_rate, month_rate, year_rate]
  );
  return result.insertId;
};

export const updateRentalProduct = async (id, { name, description, total_quantity = 1, day_rate, month_rate, year_rate }) => {
  return await query(
    'UPDATE rental_products SET name = ?, description = ?, total_quantity = ?, day_rate = ?, month_rate = ?, year_rate = ? WHERE id = ?',
    [name, description ?? null, total_quantity, day_rate, month_rate ?? null, year_rate ?? null, id]
  );
};

export const deactivateRentalProduct = async (id) => {
  return await query('UPDATE rental_products SET is_active = 0 WHERE id = ?', [id]);
};

