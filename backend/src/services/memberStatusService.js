import {
  getAllMemberStatuses,
  getMemberStatusById,
  getMemberStatusByName,
  createMemberStatus,
  updateMemberStatus,
} from '../models/memberStatusModel.js';

export const fetchAllMemberStatuses = async () => {
  return await getAllMemberStatuses();
};

export const addMemberStatus = async (statusName) => {
  const trimmed = statusName.trim();

  const existing = await getMemberStatusByName(trimmed);
  if (existing) {
    const error = new Error('Member status already exists');
    error.statusCode = 409;
    throw error;
  }

  return await createMemberStatus(trimmed);
};

export const editMemberStatus = async (id, statusName) => {
  const existing = await getMemberStatusById(id);
  if (!existing) {
    const error = new Error('Member status not found');
    error.statusCode = 404;
    throw error;
  }

  const trimmed = statusName.trim();

  const duplicate = await getMemberStatusByName(trimmed);
  if (duplicate && duplicate.id !== id) {
    const error = new Error('Member status name already in use');
    error.statusCode = 409;
    throw error;
  }

  return await updateMemberStatus(id, trimmed);
};
