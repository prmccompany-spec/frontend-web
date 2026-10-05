import { asyncHandler } from '../middleware/errorHandler.js';
import { addStaffUser, editStaffUser, listStaffUsers, setStaffUserActive } from '../services/staffUserService.js';

export const list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await listStaffUsers() });
});

export const create = asyncHandler(async (req, res) => {
  const id = await addStaffUser(req.body);
  res.status(201).json({ success: true, message: 'Staff account created.', id });
});

export const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'Invalid staff account ID.' });
  const user = await editStaffUser(id, req.body ?? {});
  res.json({ success: true, message: 'Staff account updated.', data: user });
});

export const setActive = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'Invalid staff account ID.' });
  const isActive = req.body?.is_active;
  if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'is_active must be true or false.' });
  const user = await setStaffUserActive(id, isActive);
  res.json({ success: true, data: user });
});