import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // No insecure fallback — a guessable default secret means anyone who has
  // ever seen this source can forge a token for any user, including admin.
  throw new Error('JWT_SECRET environment variable is required');
}

const ACCESS_TOKEN_EXPIRE = process.env.JWT_ACCESS_EXPIRE || '1h';
const REFRESH_TOKEN_EXPIRE_DAYS = Number(process.env.JWT_REFRESH_EXPIRE_DAYS || 30);

// Access token — short-lived, stateless, verified by signature alone.
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRE });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// Refresh token — long-lived random opaque string, tracked in the sessions
// table by its hash (see sessionModel.js) so it can actually be revoked.
export const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const refreshTokenExpiryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_EXPIRE_DAYS);
  return d;
};
