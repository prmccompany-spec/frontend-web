import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findMemberByPhone } from '../models/authModel.js';
import { sendOtp, checkOtp } from './otpService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const issueTokenForMember = (member) => {
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

export const loginWithPhone = async (phone) => {
  const member = await findMemberByPhone(phone);
  if (!member) {
    const err = new Error('Mobile number not registered');
    err.statusCode = 404;
    throw err;
  }

  return issueTokenForMember(member);
};

export const requestLoginOtp = async (phone) => {
  const member = await findMemberByPhone(phone);
  if (!member) {
    const err = new Error('Mobile number not registered');
    err.statusCode = 404;
    throw err;
  }

  await sendOtp(phone);
};

export const verifyLoginOtp = async (phone, code) => {
  const approved = await checkOtp(phone, code);
  if (!approved) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 401;
    throw err;
  }

  const member = await findMemberByPhone(phone);
  if (!member) {
    const err = new Error('Mobile number not registered');
    err.statusCode = 404;
    throw err;
  }

  return issueTokenForMember(member);
};
