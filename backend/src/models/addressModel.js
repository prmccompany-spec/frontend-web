import { query } from '../config/database.js';

export const createAddress = async (addressData) => {
  const {
    member_id,
    type,
    door_no = null,
    area = null,
    city = null,
    pincode = null,
    state = null,
  } = addressData;

  const results = await query(
    `INSERT INTO addresses (member_id, type, door_no, area, city, pincode, state, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [member_id, type, door_no, area, city, pincode, state]
  );

  return results.insertId;
};

export const getAddressById = async (addressId) => {
  const results = await query('SELECT * FROM addresses WHERE id = ?', [addressId]);
  return results[0] || null;
};

export const getAddressesByMemberId = async (memberId, type = null) => {
  if (type) {
    const results = await query('SELECT * FROM addresses WHERE member_id = ? AND type = ?', [memberId, type]);
    return results;
  }
  const results = await query('SELECT * FROM addresses WHERE member_id = ?', [memberId]);
  return results;
};

export const updateAddress = async (addressId, updates) => {
  const fields = [];
  const values = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return null;
  }

  values.push(addressId);
  return await query(`UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deleteAddress = async (addressId) => {
  return await query('DELETE FROM addresses WHERE id = ?', [addressId]);
};
