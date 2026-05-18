import {
  createMember,
  updateMember,
  deactivateMember,
  getMemberById,
  getMemberByMemberId,
  getMembersByActiveStatus,
  getMembersByRole,
  getMembersByActiveStatusAndRole,
  getAllMembers,
} from '../models/memberModel.js';

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
  return await getMembersByActiveStatus(isActive);
};

export const fetchMembersByRole = async (userTypeId) => {
  return await getMembersByRole(userTypeId);
};

export const fetchMembersByStatusAndRole = async (isActive = true, userTypeId) => {
  return await getMembersByActiveStatusAndRole(isActive, userTypeId);
};

export const fetchAllMembers = async () => {
  return await getAllMembers();
};

export const fetchMemberById = async (memberId) => {
  const member = await getMemberById(memberId);
  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }
  return member;
};
