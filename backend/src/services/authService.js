import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findMemberByPhone } from '../models/authModel.js';
import { getMemberById, updateMemberPassword } from '../models/memberModel.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';

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

export const loginWithPassword = async (phone, password) => {
  const member = await requireActiveMember(phone);

  if (!member.password) {
    const err = new Error('Password not set. Please contact the committee.');
    err.statusCode = 403;
    throw err;
  }

  const matches = await comparePassword(password, member.password);
  if (!matches) {
    const err = new Error('Invalid phone number or password');
    err.statusCode = 401;
    throw err;
  }

  return issueTokenForMember(member);
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
};
