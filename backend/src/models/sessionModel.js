import { query } from '../config/database.js';

export const createSession = async ({ memberId, refreshTokenHash, userAgent, expiresAt }) => {
  const result = await query(
    'INSERT INTO sessions (member_id, refresh_token_hash, user_agent, expires_at) VALUES (?, ?, ?, ?)',
    [memberId, refreshTokenHash, userAgent || null, expiresAt]
  );
  return result.insertId;
};

export const getActiveSessionByHash = async (refreshTokenHash) => {
  const rows = await query(
    'SELECT * FROM sessions WHERE refresh_token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()',
    [refreshTokenHash]
  );
  return rows[0] || null;
};

export const revokeSessionByHash = async (refreshTokenHash) => {
  return await query('UPDATE sessions SET revoked_at = NOW() WHERE refresh_token_hash = ?', [refreshTokenHash]);
};

// Used on password change so a stolen/leaked token stops working the moment
// the real owner reacts, without needing to track individual access tokens.
export const revokeAllSessionsForMember = async (memberId) => {
  return await query(
    'UPDATE sessions SET revoked_at = NOW() WHERE member_id = ? AND revoked_at IS NULL',
    [memberId]
  );
};
