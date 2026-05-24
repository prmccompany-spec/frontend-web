import { query } from '../config/database.js';

export const getAllRoutePermissions = async () => {
  return await query('SELECT * FROM route_permissions ORDER BY route_key');
};

export const createRoutePermission = async ({ route_key, route_label, description, require_login, allowed_type_ids }) => {
  const result = await query(
    'INSERT INTO route_permissions (route_key, route_label, description, require_login, allowed_type_ids) VALUES (?, ?, ?, ?, ?)',
    [route_key, route_label, description ?? null, require_login ? 1 : 0, JSON.stringify(allowed_type_ids ?? [])]
  );
  return result.insertId;
};

export const updateRoutePermission = async (id, { route_key, route_label, description, require_login, allowed_type_ids }) => {
  return await query(
    'UPDATE route_permissions SET route_key = ?, route_label = ?, description = ?, require_login = ?, allowed_type_ids = ?, updated_at = NOW() WHERE id = ?',
    [route_key, route_label, description ?? null, require_login ? 1 : 0, JSON.stringify(allowed_type_ids ?? []), id]
  );
};

export const deleteRoutePermission = async (id) => {
  return await query('DELETE FROM route_permissions WHERE id = ?', [id]);
};
