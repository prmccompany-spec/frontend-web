import { query } from '../config/database.js';

export const getAllMemberStatuses = async () => {
  return await query('SELECT * FROM member_status ORDER BY id ASC');
};

export const getMemberStatusById = async (id) => {
  const results = await query('SELECT * FROM member_status WHERE id = ?', [id]);
  return results[0] || null;
};

export const getMemberStatusByName = async (statusName) => {
  const results = await query('SELECT * FROM member_status WHERE status_name = ?', [statusName]);
  return results[0] || null;
};

export const createMemberStatus = async (statusName) => {
  const results = await query(
    'INSERT INTO member_status (status_name) VALUES (?)',
    [statusName]
  );
  return results.insertId;
};

export const updateMemberStatus = async (id, statusName) => {
  return await query(
    'UPDATE member_status SET status_name = ? WHERE id = ?',
    [statusName, id]
  );
};
