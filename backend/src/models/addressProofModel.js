import { query } from '../config/database.js';

export const createAddressProof = async (proofData) => {
  const { member_id, file_url } = proofData;

  const results = await query(
    'INSERT INTO address_proofs (member_id, file_url, created_at) VALUES (?, ?, NOW())',
    [member_id, file_url]
  );

  return results.insertId;
};

export const getAddressProofById = async (proofId) => {
  const results = await query('SELECT * FROM address_proofs WHERE id = ?', [proofId]);
  return results[0] || null;
};

export const getAddressProofsByMemberId = async (memberId) => {
  const results = await query('SELECT * FROM address_proofs WHERE member_id = ?', [memberId]);
  return results;
};

export const updateAddressProof = async (proofId, fileUrl) => {
  return await query('UPDATE address_proofs SET file_url = ? WHERE id = ?', [fileUrl, proofId]);
};

export const deleteAddressProof = async (proofId) => {
  return await query('DELETE FROM address_proofs WHERE id = ?', [proofId]);
};
