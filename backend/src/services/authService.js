import { findMemberByPhone, findMemberById } from '../models/authModel.js';
import { getMemberById, updateMemberPassword } from '../models/memberModel.js';
import {
  createSession,
  getActiveSessionByHash,
  revokeSessionByHash,
  revokeAllSessionsForMember,
} from '../models/sessionModel.js';
import { recordLogin } from '../models/loginHistoryModel.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
} from '../utils/tokenUtils.js';

const buildUserPayload = (member) => ({
  id: member.id,
  member_id: member.member_id,
  name: member.name,
  phone: member.phone,
  user_type_id: member.user_type_id,
  type_name: member.type_name,
});

// Issues a fresh access + refresh token pair and records the refresh token
// (hashed) in the sessions table so it can be looked up and revoked later.
const issueSession = async (member, userAgent) => {
  const user = buildUserPayload(member);
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await createSession({
    memberId: member.id,
    refreshTokenHash: hashToken(refreshToken),
    userAgent,
    expiresAt: refreshTokenExpiryDate(),
  });

  return { access_token: accessToken, refresh_token: refreshToken, user };
};

// Logging a login attempt must never break the actual login flow, so any
// failure here is swallowed rather than propagated.
const logAttempt = async ({ memberId = null, phone, status, reason = null, ip, userAgent }) => {
  try {
    await recordLogin({
      member_id: memberId,
      phone: phone || null,
      status,
      failure_reason: reason,
      ip_address: ip || null,
      user_agent: userAgent || null,
    });
  } catch {
    /* ignore */
  }
};

const requireActiveMember = async (phone) => {
  const member = await findMemberByPhone(phone);
  if (!member) {
    const err = new Error('Mobile number not registered');
    err.statusCode = 404;
    throw err;
  }

  const isActiveStatus = member.status_name
    ? member.status_name.toLowerCase() === 'active'
    : !!member.is_active;

  if (!member.is_active || !isActiveStatus) {
    const err = new Error('Your membership is not active. Please contact the committee.');
    err.statusCode = 403;
    throw err;
  }

  return member;
};

export const loginWithPassword = async (phone, password, { userAgent, ip } = {}) => {
  let member;
  try {
    member = await requireActiveMember(phone);
  } catch (err) {
    await logAttempt({ phone, status: 'failed', reason: err.message, ip, userAgent });
    throw err;
  }

  if (!member.password) {
    await logAttempt({ memberId: member.id, phone, status: 'failed', reason: 'Password not set', ip, userAgent });
    const err = new Error('Password not set. Please contact the committee.');
    err.statusCode = 403;
    throw err;
  }

  const matches = await comparePassword(password, member.password);
  if (!matches) {
    await logAttempt({ memberId: member.id, phone, status: 'failed', reason: 'Incorrect password', ip, userAgent });
    const err = new Error('Invalid phone number or password');
    err.statusCode = 401;
    throw err;
  }

  await logAttempt({ memberId: member.id, phone, status: 'success', ip, userAgent });
  return await issueSession(member, userAgent);
};

// Refresh tokens are single-use — each refresh revokes the old session and
// issues a new one (rotation), so a stolen refresh token only works once
// before the legitimate client's next refresh invalidates it.
export const refreshSession = async (refreshToken, userAgent) => {
  if (!refreshToken) {
    const err = new Error('Refresh token is required');
    err.statusCode = 400;
    throw err;
  }

  const hash = hashToken(refreshToken);
  const session = await getActiveSessionByHash(hash);
  if (!session) {
    const err = new Error('Session expired or already logged out. Please sign in again.');
    err.statusCode = 401;
    throw err;
  }

  const member = await findMemberById(session.member_id);
  if (!member || !member.is_active) {
    await revokeSessionByHash(hash);
    const err = new Error('Account is no longer active');
    err.statusCode = 401;
    throw err;
  }

  await revokeSessionByHash(hash);
  return await issueSession(member, userAgent);
};

export const logout = async (refreshToken) => {
  if (!refreshToken) return;
  await revokeSessionByHash(hashToken(refreshToken));
};

export const resetOwnPassword = async (memberId, oldPassword, newPassword) => {
  const member = await getMemberById(memberId);
  if (!member) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }

  if (!member.password) {
    const err = new Error('Password not set. Please contact the committee.');
    err.statusCode = 403;
    throw err;
  }

  const matches = await comparePassword(oldPassword, member.password);
  if (!matches) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 401;
    throw err;
  }

  if (!/^\d{6}$/.test(newPassword || '')) {
    const err = new Error('New password must be exactly 6 digits');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await hashPassword(newPassword);
  await updateMemberPassword(memberId, hashed);

  // A changed password should kill every other logged-in session immediately
  // — otherwise a stolen token would keep working right past the reason the
  // password was changed.
  await revokeAllSessionsForMember(memberId);
};
