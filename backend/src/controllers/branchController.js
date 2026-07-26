import { asyncHandler } from '../middleware/errorHandler.js';
import { fetchAllBranches, addBranch, editBranch } from '../services/branchService.js';

export const listBranches = asyncHandler(async (req, res) => {
  const branches = await fetchAllBranches();
  res.json({ success: true, count: branches.length, data: branches });
});

export const createBranch = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  const id = await addBranch(name);
  res.status(201).json({ success: true, message: 'Branch created', id });
});

export const updateBranch = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid branch ID' });
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  await editBranch(id, name);
  res.json({ success: true, message: 'Branch updated' });
});
