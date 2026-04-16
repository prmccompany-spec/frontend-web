import { query } from '../config/database.js';

export const getMemberById = async (memberId) => {
  const results = await query('SELECT * FROM members WHERE id = ?', [memberId]);
  return results[0] || null;
};

export const getMemberByMemberId = async (memberIdentifier) => {
  const results = await query('SELECT * FROM members WHERE member_id = ?', [memberIdentifier]);
  return results[0] || null;
};

export const createMember = async (memberData) => {
  const {
    member_id,
    user_type_id,
    gotra = null,
    family_name = null,
    name,
    father_name = null,
    address_id = null,
    outside_address_id = null,
    address_proof_id = null,
    phone = null,
    whatsapp = null,
    blood_group = null,
    dob = null,
    occupation = null,
    out_of_rajapalayam = false,
  } = memberData;

  const results = await query(
    `INSERT INTO members
      (member_id, user_type_id, gotra, family_name, name, father_name, phone, whatsapp, blood_group, dob, occupation, address_id, outside_address_id, address_proof_id, out_of_rajapalayam, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      member_id,
      user_type_id,
      gotra,
      family_name,
      name,
      father_name,
      phone,
      whatsapp,
      blood_group,
      dob,
      occupation,
      address_id,
      outside_address_id,
      address_proof_id,
      out_of_rajapalayam ? 1 : 0,
    ]
  );

  return results.insertId;
};

export const updateMember = async (memberId, updates) => {
  const fields = [];
  const values = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'out_of_rajapalayam') {
        fields.push(`${key} = ?`);
        values.push(value ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  });

  if (fields.length === 0) {
    return null;
  }

  values.push(memberId);
  return await query(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const deactivateMember = async (memberId) => {
  return await query('UPDATE members SET is_active = FALSE WHERE id = ?', [memberId]);
};

export const getMembersByActiveStatus = async (isActive = true) => {
  const results = await query('SELECT * FROM members WHERE is_active = ?', [isActive ? 1 : 0]);
  return results;
};

export const getMembersByRole = async (userTypeId) => {
  const results = await query('SELECT * FROM members WHERE user_type_id = ?', [userTypeId]);
  return results;
};

export const getMembersByActiveStatusAndRole = async (isActive = true, userTypeId) => {
  const results = await query(
    'SELECT * FROM members WHERE is_active = ? AND user_type_id = ?',
    [isActive ? 1 : 0, userTypeId]
  );
  return results;
};
