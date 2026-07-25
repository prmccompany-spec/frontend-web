import { asyncHandler } from '../middleware/errorHandler.js';
import {
  getAllRoutePermissions,
  createRoutePermission,
  updateRoutePermission,
  deleteRoutePermission,
} from '../models/routePermissionModel.js';

export const getAll = asyncHandler(async (req, res) => {
  const perms = await getAllRoutePermissions();
  res.json({ success: true, data: perms });
});

export const create = asyncHandler(async (req, res) => {
  const { route_key, route_label, description, require_login, allowed_type_ids } = req.body;
  if (!route_key?.trim() || !route_label?.trim()) {
    return res.status(400).json({ success: false, message: 'route_key and route_label are required' });
  }
  const id = await createRoutePermission({ route_key: route_key.trim(), route_label: route_label.trim(), description, require_login, allowed_type_ids });
  res.status(201).json({ success: true, message: 'Route permission created', id });
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { route_key, route_label, description, require_login, allowed_type_ids } = req.body;
  if (!route_key?.trim() || !route_label?.trim()) {
    return res.status(400).json({ success: false, message: 'route_key and route_label are required' });
  }
  await updateRoutePermission(id, { route_key: route_key.trim(), route_label: route_label.trim(), description, require_login, allowed_type_ids });
  res.json({ success: true, message: 'Route permission updated' });
});

export const destroy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await deleteRoutePermission(id);
  res.json({ success: true, message: 'Route permission deleted' });
});
