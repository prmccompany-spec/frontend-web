import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createNewMember,
  modifyMember,
  deactivateMemberById,
  fetchMembersByStatus,
  fetchMembersByRole,
  fetchMembersByStatusAndRole,
  fetchAllMembers,
  fetchMemberById,
} from '../services/memberService.js';

const validateMemberPayload = (payload) => {
  if (!payload.member_id) {
    return 'member_id is required';
  }

  if (payload.user_type_id === undefined || payload.user_type_id === null) {
    return 'user_type_id is required';
  }

  if (!payload.name) {
    return 'name is required';
  }

  return null;
};

export const createMember = asyncHandler(async (req, res) => {
  const validationError = validateMemberPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const memberId = await createNewMember(req.body);
  res.status(201).json({
    success: true,
    message: 'Member created successfully',
    memberId,
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.id);
  if (!memberId || Number.isNaN(memberId)) {
    return res.status(400).json({ success: false, message: 'Invalid member ID' });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: 'No update data provided' });
  }

  await modifyMember(memberId, req.body);

  res.json({
    success: true,
    message: 'Member updated successfully',
  });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.id);
  if (!memberId || Number.isNaN(memberId)) {
    return res.status(400).json({ success: false, message: 'Invalid member ID' });
  }

  await deactivateMemberById(memberId);

  res.json({
    success: true,
    message: 'Member marked inactive successfully',
  });
});

export const getMembersByStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.query;

  if (isActive === undefined) {
    return res.status(400).json({
      success: false,
      message: 'isActive query parameter is required (true or false)',
    });
  }

  const statusValue = isActive === 'true';
  const members = await fetchMembersByStatus(statusValue);

  res.json({
    success: true,
    count: members.length,
    data: members,
  });
});

export const getMembersByRole = asyncHandler(async (req, res) => {
  const { roleId } = req.query;

  if (!roleId || Number.isNaN(Number(roleId))) {
    return res.status(400).json({
      success: false,
      message: 'roleId query parameter is required and must be a number',
    });
  }

  const members = await fetchMembersByRole(Number(roleId));

  res.json({
    success: true,
    count: members.length,
    data: members,
  });
});

export const listMembers = asyncHandler(async (req, res) => {
  const members = await fetchAllMembers();
  res.json({ success: true, count: members.length, data: members });
});

export const getMember = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.id);
  if (!memberId || Number.isNaN(memberId)) {
    return res.status(400).json({ success: false, message: 'Invalid member ID' });
  }
  const member = await fetchMemberById(memberId);
  res.json({ success: true, data: member });
});

export const getMembersByStatusAndRole = asyncHandler(async (req, res) => {
  const { isActive, roleId } = req.query;

  if (isActive === undefined) {
    return res.status(400).json({
      success: false,
      message: 'isActive query parameter is required (true or false)',
    });
  }

  if (!roleId || Number.isNaN(Number(roleId))) {
    return res.status(400).json({
      success: false,
      message: 'roleId query parameter is required and must be a number',
    });
  }

  const statusValue = isActive === 'true';
  const members = await fetchMembersByStatusAndRole(statusValue, Number(roleId));

  res.json({
    success: true,
    count: members.length,
    data: members,
  });
});
