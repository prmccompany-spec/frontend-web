import {
  getAllBranches,
  getBranchById,
  getBranchByName,
  createBranch,
  updateBranch,
} from '../models/branchModel.js';

export const fetchAllBranches = async () => {
  return await getAllBranches();
};

export const addBranch = async (name) => {
  const trimmed = name.trim();

  const existing = await getBranchByName(trimmed);
  if (existing) {
    const error = new Error('Branch already exists');
    error.statusCode = 409;
    throw error;
  }

  return await createBranch(trimmed);
};

export const editBranch = async (id, name) => {
  const existing = await getBranchById(id);
  if (!existing) {
    const error = new Error('Branch not found');
    error.statusCode = 404;
    throw error;
  }

  const trimmed = name.trim();

  const duplicate = await getBranchByName(trimmed);
  if (duplicate && duplicate.id !== id) {
    const error = new Error('Branch name already in use');
    error.statusCode = 409;
    throw error;
  }

  return await updateBranch(id, trimmed);
};
