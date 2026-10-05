import { findMemberByPhone, findMemberById } from '../models/authModel.js';
import { getMemberById, updateMemberPassword } from '../models/memberModel.js';
import { findStaffLoginsByPhone } from './staffUserService.js';
import { getStaffAccountByIdForAuth, updateStaffUser } from '../models/staffUserModel.js';
import {
  createSession,
  getActiveSessionByHash,
  revokeSessionByHash,
  revokeAllSessionsForMember,
  revokeAllSessionsForStaff,
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
  account_type: 'member',
  id: member.id,
  member_id: member.member_id,
  name: member.name,
  phone: member.phone,
  user_type_id: member.user_type_id,
  type_name: member.type_name,
});

// Issues a fresh access + refresh token pair and records the refresh token
// (hashed) in the sessions table so it can be looked up and revoked later.
const issueSession = async (account, accountType, userAgent) => {
  const user = accountType === 'staff'
    ? {
      account_type: 'staff',
      id: account.id,
      member_id: null,
      name: account.name,
      phone: account.phone,
      user_type_id: account.user_type_id,
      type_name: account.type_name,
    }
    : buildUserPayload(account);
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await createSession({
    memberId: accountType === 'member' ? account.id : null,
    userId: accountType === 'staff' ? account.id : null,
    accountType,
    refreshTokenHash: hashToken(refreshToken),
    userAgent,
    expiresAt: refreshTokenExpiryDate(),
  });

  return { access_token: accessToken, refresh_token: refreshToken, user };
};

// Logging a login attempt must never break the actual login flow, so any
// failure here is swallowed rather than propagated.
const logAttempt = async ({ memberId = null, userId = null, accountType = 'unknown', phone, status, reason = null, ip, userAgent }) => {
  try {
    await recordLogin({
      member_id: memberId,
      user_id: userId,
      account_type: accountType,
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

export const loginWithPassword = async (phone, password, { userAgent, ip } = {}) => {
  const [member, staffAccounts] = await Promise.all([
    findMemberByPhone(phone),
    findStaffLoginsByPhone(phone),
  ]);
  const memberIsActive = member?.is_active
    && (!member.status_name || member.status_name.toLowerCase() === 'active');
  const candidates = [];
  if (memberIsActive && member.password) candidates.push({ account: member, accountType: 'member' });
  for (const staff of staffAccounts) {
    if (staff.password) candidates.push({ account: staff, accountType: 'staff' });
  }

  if (memberIsActive && !member.password && !staffAccounts.length) {
    await logAttempt({ memberId: member.id, accountType: 'member', phone, status: 'failed', reason: 'Password not set', ip, userAgent });
    const err = new Error('Password not set. Please contact the committee.');
    err.statusCode = 403;
    throw err;
  }

  const matches = [];
  for (const candidate of candidates) {
    if (await comparePassword(password, candidate.account.password)) matches.push(candidate);
  }
  if (matches.length === 1) {
    const [candidate] = matches;
    const memberId = candidate.accountType === 'member' ? candidate.account.id : null;
    const userId = candidate.accountType === 'staff' ? candidate.account.id : null;
    await logAttempt({ memberId, userId, accountType: candidate.accountType, phone, status: 'success', ip, userAgent });
    return issueSession(candidate.account, candidate.accountType, userAgent);
  }
  if (matches.length > 1) {
    await logAttempt({ accountType: 'ambiguous', phone, status: 'failed', reason: 'Ambiguous account match', ip, userAgent });
    const err = new Error('This phone and password match more than one account. Please contact an administrator.');
    err.statusCode = 409;
    throw err;
  }

  const inactiveMember = member && !memberIsActive;
  const reason = inactiveMember ? 'Your membership is not active. Please contact the committee.' : 'Invalid phone number or password';
  const accountTypes = [
    ...(member ? ['member'] : []),
    ...(staffAccounts.length ? ['staff'] : []),
  ];
  const accountType = accountTypes.length === 1 ? accountTypes[0] : accountTypes.length ? 'ambiguous' : 'unknown';
  await logAttempt({
    memberId: accountType === 'member' ? member.id : null,
    userId: accountType === 'staff' ? staffAccounts[0].id : null,
    accountType,
    phone,
    status: 'failed',
    reason,
    ip,
    userAgent,
  });
  const err = new Error(reason);
  err.statusCode = inactiveMember ? 403 : 401;
  throw err;
};

export const identifyLoginAccount = async (phone) => {
  const [member, staffAccounts] = await Promise.all([
    findMemberByPhone(phone),
    findStaffLoginsByPhone(phone),
  ]);
  const memberIsActive = member?.is_active
    && (!member.status_name || member.status_name.toLowerCase() === 'active');
  const accountTypes = [
    ...(memberIsActive ? ['member'] : []),
    ...(staffAccounts.length ? ['staff'] : []),
  ];

  return {
    account_type: accountTypes.length === 1 ? accountTypes[0] : accountTypes.length ? 'ambiguous' : 'unknown',
  };
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

  const accountType = session.account_type || 'member';
  const account = accountType === 'staff'
    ? await getStaffAccountByIdForAuth(session.user_id)
    : await findMemberById(session.member_id);
  const isActive = accountType === 'staff'
    ? !!account?.is_active
    : !!account?.is_active && (!account.status_name || account.status_name.toLowerCase() === 'active');
  if (!account || !isActive) {
    await revokeSessionByHash(hash);
    const err = new Error('Account is no longer active');
    err.statusCode = 401;
    throw err;
  }

  await revokeSessionByHash(hash);
  return await issueSession(account, accountType, userAgent);
};

export const logout = async (refreshToken) => {
  if (!refreshToken) return;
  await revokeSessionByHash(hashToken(refreshToken));
};

export const resetOwnPassword = async (user, oldPassword, newPassword) => {
  if (user.account_type === 'staff') {
    const staff = await getStaffAccountByIdForAuth(user.id);
    if (!staff) {
      const err = new Error('Staff account not found');
      err.statusCode = 404;
      throw err;
    }
    if (!await comparePassword(oldPassword, staff.password)) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 401;
      throw err;
    }
    if (String(newPassword || '').length < 8) {
      const err = new Error('New staff password must be at least 8 characters');
      err.statusCode = 400;
      throw err;
    }
    await updateStaffUser(user.id, { password: await hashPassword(newPassword) });
    await revokeAllSessionsForStaff(user.id);
    return;
  }

  const memberId = user.id;
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
