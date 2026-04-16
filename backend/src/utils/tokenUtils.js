import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export const generateToken = (userId, userRole = 'user') => {
  return jwt.sign(
    { id: userId, role: userRole },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
