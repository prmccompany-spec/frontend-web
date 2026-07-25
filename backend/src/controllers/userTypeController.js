import { asyncHandler } from '../middleware/errorHandler.js';
import {
  fetchAllUserTypes,
  addUserType,
  editUserType,
} from '../services/userTypeService.js';

export const listUserTypes = asyncHandler(async (req, res) => {
  const types = await fetchAllUserTypes();
  res.json({ success: true, count: types.length, data: types });
});

export const createUserType = asyncHandler(async (req, res) => {
  const { type_name } = req.body;
  if (!type_name || !type_name.trim()) {
    return res.status(400).json({ success: false, message: 'type_name is required' });
  }

  const id = await addUserType(type_name);
  res.status(201).json({ success: true, message: 'User type created', id });
});

export const updateUserType = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user type ID' });
  }

  const { type_name } = req.body;
  if (!type_name || !type_name.trim()) {
    return res.status(400).json({ success: false, message: 'type_name is required' });
  }

  await editUserType(id, type_name);
  res.json({ success: true, message: 'User type updated' });
});
