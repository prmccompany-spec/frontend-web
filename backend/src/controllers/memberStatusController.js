import { asyncHandler } from '../middleware/errorHandler.js';
import {
  fetchAllMemberStatuses,
  addMemberStatus,
  editMemberStatus,
} from '../services/memberStatusService.js';

export const listMemberStatuses = asyncHandler(async (req, res) => {
  const statuses = await fetchAllMemberStatuses();
  res.json({ success: true, count: statuses.length, data: statuses });
});

export const createMemberStatus = asyncHandler(async (req, res) => {
  const { status_name } = req.body;
  if (!status_name || !status_name.trim()) {
    return res.status(400).json({ success: false, message: 'status_name is required' });
  }

  const id = await addMemberStatus(status_name);
  res.status(201).json({ success: true, message: 'Member status created', id });
});

export const updateMemberStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid member status ID' });
  }

  const { status_name } = req.body;
  if (!status_name || !status_name.trim()) {
    return res.status(400).json({ success: false, message: 'status_name is required' });
  }

  await editMemberStatus(id, status_name);
  res.json({ success: true, message: 'Member status updated' });
});
