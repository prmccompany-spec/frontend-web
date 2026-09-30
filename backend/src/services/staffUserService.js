import {
  createStaffUser,
  getStaffLoginByPhone,
  getStaffUserById,
  getStaffUserByPhone,
  getStaffUsers,
  updateStaffUser,
} from '../models/staffUserModel.js';
import { getUserTypeByName } from '../models/userTypeModel.js';
import { findMemberByPhone } from '../models/authModel.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { revokeAllSessionsForStaff } from '../models/sessionModel.js';

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const normalizePhone = (phone) => String(phone ?? '').trim();

export const listStaffUsers = () => getStaffUsers();
export const findStaffLoginsByPhone = (phone) => getStaffLoginByPhone(normalizePhone(phone));
export const findStaffById = (id) => getStaffUserById(id);

const adminTypeId = async () => {
  const type = await getUserTypeByName('admin');
  if (!type) fail('The admin user type is missing from user_types.', 500);
  return type.id;
};

export const addStaffUser = async (data) => {
  const name = String(data.name ?? '').trim();
  const phone = normalizePhone(data.phone);
  const password = String(data.password ?? '').trim();
  if (!name || !phone || !password) fail('Name, phone number, and password are required.');
  if (password.length < 8) fail('Staff passwords must be at least 8 characters.');
  if ((await getStaffUserByPhone(phone)).length) fail('A staff account already uses this phone number.', 409);
  if (await findMemberByPhone(phone)) fail('This phone number belongs to a member and cannot be used for a staff account.', 409);

  const hashedPassword = await hashPassword(password);
  return createStaffUser({
    name,
    phone,
    password: hashedPassword,
    user_type_id: await adminTypeId(),
    father_name: data.father_name || null,
    address: data.address || null,
    aadhar_card: data.aadhar_card || null,
    dob: data.dob || null,
  });
};

export const editStaffUser = async (id, data) => {
  const existing = await getStaffUserById(id);
  if (!existing) fail('Staff account not found.', 404);

  const updates = {};
  for (const field of ['name', 'phone', 'father_name', 'address', 'aadhar_card', 'dob']) {
    if (data[field] !== undefined) updates[field] = data[field] === '' ? null : String(data[field]).trim();
  }
  if (updates.name !== undefined && !updates.name) fail('Name is required.');
  if (updates.phone !== undefined && !updates.phone) fail('Phone number is required.');
  if (updates.phone && (await getStaffUserByPhone(updates.phone)).some((user) => user.id !== Number(id))) {
    fail('A staff account already uses this phone number.', 409);
  }
  if (updates.phone && await findMemberByPhone(updates.phone)) {
    fail('This phone number belongs to a member and cannot be used for a staff account.', 409);
  }
  if (data.password) {
    if (String(data.password).length < 8) fail('Staff passwords must be at least 8 characters.');
    updates.password = await hashPassword(String(data.password));
  }
  if (!Object.keys(updates).length) fail('No valid fields provided for update.');

  await updateStaffUser(id, updates);
  if (updates.password) await revokeAllSessionsForStaff(id);
  return getStaffUserById(id);
};

export const setStaffUserActive = async (id, isActive) => {
  const existing = await getStaffUserById(id);
  if (!existing) fail('Staff account not found.', 404);
  await updateStaffUser(id, { is_active: isActive ? 1 : 0 });
  if (!isActive) await revokeAllSessionsForStaff(id);
  return getStaffUserById(id);
};