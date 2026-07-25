import {
  createMember,
  updateMember,
  updateMemberPhoto,
  updateMemberPassword,
  deactivateMember,
  getMemberById,
  getMemberByMemberId,
  getMembersByActiveStatus,
  getMembersByRole,
  getMembersByActiveStatusAndRole,
  getAllMembers,
  getNextMemberId,
} from '../models/memberModel.js';
import { deleteByUrl } from '../utils/cloudinaryUtils.js';
import { hashPassword } from '../utils/passwordUtils.js';

// The password hash must never reach an API response — every member row
// handed back to the frontend goes through this first.
const omitPassword = (member) => {
  if (!member) return member;
  const { password, ...rest } = member;
  return rest;
};
const omitPasswordFromList = (members) => members.map(omitPassword);

export const fetchNextMemberId = async () => {
  return await getNextMemberId();
};

export const createNewMember = async (memberData) => {
  if (!memberData.member_id) {
    const error = new Error('member_id is required');
    error.statusCode = 400;
    throw error;
  }

  const existingMember = await getMemberByMemberId(memberData.member_id);
  if (existingMember) {
    const error = new Error('Member ID already exists');
    error.statusCode = 409;
    throw error;
  }

  return await createMember(memberData);
};

export const modifyMember = async (memberId, memberData) => {
  const existingMember = await getMemberById(memberId);
  if (!existingMember) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }

  if (memberData.member_id) {
    const duplicateMember = await getMemberByMemberId(memberData.member_id);
    if (duplicateMember && duplicateMember.id !== memberId) {
      const error = new Error('member_id is already in use by another member');
      error.statusCode = 409;
      throw error;
    }
  }

  const result = await updateMember(memberId, memberData);
  if (!result) {
    const error = new Error('No valid fields provided for update');
    error.statusCode = 400;
    throw error;
  }

  return result;
};

export const deactivateMemberById = async (memberId) => {
  const existingMember = await getMemberById(memberId);
  if (!existingMember) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }

  return await deactivateMember(memberId);
};

export const fetchMembersByStatus = async (isActive = true) => {
  return omitPasswordFromList(await getMembersByActiveStatus(isActive));
};

export const fetchMembersByRole = async (userTypeId) => {
  return omitPasswordFromList(await getMembersByRole(userTypeId));
};

export const fetchMembersByStatusAndRole = async (isActive = true, userTypeId) => {
  return omitPasswordFromList(await getMembersByActiveStatusAndRole(isActive, userTypeId));
};

export const fetchAllMembers = async () => {
  return omitPasswordFromList(await getAllMembers());
};

export const saveMemberPhoto = async (memberId, photoUrl) => {
  const member = await getMemberById(memberId);
  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }
  if (member.photo) await deleteByUrl(member.photo);
  return await updateMemberPhoto(memberId, photoUrl);
};

export const fetchMemberById = async (memberId) => {
  const member = await getMemberById(memberId);
  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }
  return omitPassword(member);
};

export const resetMemberPasswordByAdmin = async (memberId, newPassword) => {
  const member = await getMemberById(memberId);
  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }
  if (!/^\d{6}$/.test(newPassword || '')) {
    const error = new Error('Password must be exactly 6 digits');
    error.statusCode = 400;
    throw error;
  }

  const hashed = await hashPassword(newPassword);
  return await updateMemberPassword(memberId, hashed);
};
