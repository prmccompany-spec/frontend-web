import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findMemberByPhone, createOtpSession, validateAndConsumeOtp } from '../models/authModel.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const HARDCODED_OTP = '9707';

export const requestOtp = async (phone) => {
  const member = await findMemberByPhone(phone);
  if (!member) {
    const err = new Error('Mobile number not registered');
    err.statusCode = 404;
    throw err;
  }
  await createOtpSession(phone, HARDCODED_OTP);
  return { message: 'OTP sent successfully' };
};

export const verifyOtp = async (phone, otp) => {
  const member = await findMemberByPhone(phone);
  if (!member) {
    const err = new Error('Mobile number not registered');
    err.statusCode = 404;
    throw err;
  }

  const valid = await validateAndConsumeOtp(phone, otp);
  if (!valid) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 401;
    throw err;
  }

  const payload = {
    id: member.id,
    member_id: member.member_id,
    name: member.name,
    phone: member.phone,
    user_type_id: member.user_type_id,
    type_name: member.type_name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });

  return { access_token: token, user: payload };
};
