import { query } from '../config/database.js';
import { generateMemberQR } from '../utils/qrUtils.js';
import { hashPassword } from '../utils/passwordUtils.js';

const MEMBER_SELECT = `
  SELECT m.*, ms.status_name
  FROM members m
  LEFT JOIN member_status ms ON ms.id = m.status_id
`;

export const getMemberById = async (memberId) => {
  const results = await query(`${MEMBER_SELECT} WHERE m.id = ?`, [memberId]);
  return results[0] || null;
};

export const getMemberByMemberId = async (memberIdentifier) => {
  const results = await query('SELECT * FROM members WHERE member_id = ?', [memberIdentifier]);
  return results[0] || null;
};

// member_id is a free-text VARCHAR, but in practice every row is a plain
// sequential number, so the "next" one is just the current max + 1. Non-
// numeric member_ids (none expected) CAST to 0 and are harmlessly ignored.
export const getNextMemberId = async () => {
  const results = await query('SELECT COALESCE(MAX(CAST(member_id AS UNSIGNED)), 0) AS max_id FROM members');
  return String(results[0].max_id + 1);
};

export const getMemberByTableId = async (tableId) => {
  const results = await query('SELECT * FROM members WHERE member_table_id = ?', [tableId]);
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
    email = null,
    aadhar_number = null,
    engagement_date = null,
    marriage_date = null,
    status_id = null,
    password = null,
  } = memberData;

  // A member always gets a password: whatever's explicitly passed, or their
  // member_id zero-padded to 6 digits as a default they can change later
  // (e.g. member_id 88 -> 000088).
  const rawPassword = password || (member_id ? String(member_id).padStart(6, '0') : null);
  const hashedPassword = rawPassword ? await hashPassword(rawPassword) : null;

  const results = await query(
    `INSERT INTO members
      (member_id, user_type_id, gotra, family_name, name, father_name, phone, password, whatsapp, blood_group, dob, occupation, address_id, outside_address_id, address_proof_id, out_of_rajapalayam, email, aadhar_number, engagement_date, marriage_date, status_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      member_id,
      user_type_id,
      gotra,
      family_name,
      name,
      father_name,
      phone,
      hashedPassword,
      whatsapp,
      blood_group,
      dob,
      occupation,
      address_id,
      outside_address_id,
      address_proof_id,
      out_of_rajapalayam ? 1 : 0,
      email,
      aadhar_number,
      engagement_date,
      marriage_date,
      status_id,
    ]
  );

  const newId = results.insertId;
  const memberTableId = newId + 1987;

  const qrPath = await generateMemberQR({
    memberTableId,
    memberId: member_id,
    name,
  });

  await query(
    'UPDATE members SET member_table_id = ?, qr_code = ? WHERE id = ?',
    [String(memberTableId), qrPath, newId]
  );

  return newId;
};

export const updateMember = async (memberId, updates) => {
  const fields = [];
  const values = [];

  // password is intentionally excluded — it can only be changed via
  // updateMemberPassword, which hashes it first.
  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'password') return;
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

export const getAllMembers = async () => {
  return await query(`${MEMBER_SELECT} ORDER BY m.created_at DESC`);
};

export const updateMemberPhoto = async (memberId, photoPath) => {
  return await query('UPDATE members SET photo = ? WHERE id = ?', [photoPath, memberId]);
};

export const updateMemberPassword = async (memberId, hashedPassword) => {
  return await query('UPDATE members SET password = ? WHERE id = ?', [hashedPassword, memberId]);
};
