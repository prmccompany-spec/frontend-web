import {
  getAllGotras,
  getGotraById,
  getGotraByName,
  createGotra,
  updateGotra,
} from '../models/gotraModel.js';

export const fetchAllGotras = async () => {
  return await getAllGotras();
};

export const addGotra = async (name) => {
  const trimmed = name.trim();

  const existing = await getGotraByName(trimmed);
  if (existing) {
    const error = new Error('Gotra already exists');
    error.statusCode = 409;
    throw error;
  }

  return await createGotra(trimmed);
};

export const editGotra = async (id, name) => {
  const existing = await getGotraById(id);
  if (!existing) {
    const error = new Error('Gotra not found');
    error.statusCode = 404;
    throw error;
  }

  const trimmed = name.trim();

  const duplicate = await getGotraByName(trimmed);
  if (duplicate && duplicate.id !== id) {
    const error = new Error('Gotra name already in use');
    error.statusCode = 409;
    throw error;
  }

  return await updateGotra(id, trimmed);
};
