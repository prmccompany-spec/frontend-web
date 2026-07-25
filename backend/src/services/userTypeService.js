import {
  getAllUserTypes,
  getUserTypeById,
  getUserTypeByName,
  createUserType,
  updateUserType,
} from '../models/userTypeModel.js';

export const fetchAllUserTypes = async () => {
  return await getAllUserTypes();
};

export const addUserType = async (typeName) => {
  const trimmed = typeName.trim().toLowerCase();

  const existing = await getUserTypeByName(trimmed);
  if (existing) {
    const error = new Error('User type already exists');
    error.statusCode = 409;
    throw error;
  }

  return await createUserType(trimmed);
};

export const editUserType = async (id, typeName) => {
  const existing = await getUserTypeById(id);
  if (!existing) {
    const error = new Error('User type not found');
    error.statusCode = 404;
    throw error;
  }

  const trimmed = typeName.trim().toLowerCase();

  const duplicate = await getUserTypeByName(trimmed);
  if (duplicate && duplicate.id !== id) {
    const error = new Error('User type name already in use');
    error.statusCode = 409;
    throw error;
  }

  return await updateUserType(id, trimmed);
};
