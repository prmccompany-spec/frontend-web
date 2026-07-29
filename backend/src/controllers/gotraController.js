import { asyncHandler } from '../middleware/errorHandler.js';
import { fetchAllGotras, addGotra, editGotra } from '../services/gotraService.js';

export const listGotras = asyncHandler(async (req, res) => {
  const gotras = await fetchAllGotras();
  res.json({ success: true, count: gotras.length, data: gotras });
});

export const createGotra = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  const id = await addGotra(name);
  res.status(201).json({ success: true, message: 'Gotra created', id });
});

export const updateGotra = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid gotra ID' });
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  await editGotra(id, name);
  res.json({ success: true, message: 'Gotra updated' });
});
