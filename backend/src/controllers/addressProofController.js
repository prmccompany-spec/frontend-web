import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createAddressProof,
  getAddressProofById,
  getAddressProofsByMemberId,
  updateAddressProof,
  deleteAddressProof,
} from '../models/addressProofModel.js';

const validateProofPayload = (payload) => {
  if (!payload.member_id) {
    return 'member_id is required';
  }

  if (!payload.file_url) {
    return 'file_url is required';
  }

  return null;
};

export const createNewProof = asyncHandler(async (req, res) => {
  const validationError = validateProofPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const proofId = await createAddressProof(req.body);
  res.status(201).json({
    success: true,
    message: 'Address proof created successfully',
    proofId,
  });
});

export const getProof = asyncHandler(async (req, res) => {
  const proofId = Number(req.params.id);
  if (!proofId || Number.isNaN(proofId)) {
    return res.status(400).json({ success: false, message: 'Invalid proof ID' });
  }

  const proof = await getAddressProofById(proofId);
  if (!proof) {
    return res.status(404).json({ success: false, message: 'Address proof not found' });
  }

  res.json({
    success: true,
    data: proof,
  });
});

export const getMemberProofs = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.memberId);
  if (!memberId || Number.isNaN(memberId)) {
    return res.status(400).json({ success: false, message: 'Invalid member ID' });
  }

  const proofs = await getAddressProofsByMemberId(memberId);

  res.json({
    success: true,
    count: proofs.length,
    data: proofs,
  });
});

export const updateProofData = asyncHandler(async (req, res) => {
  const proofId = Number(req.params.id);
  if (!proofId || Number.isNaN(proofId)) {
    return res.status(400).json({ success: false, message: 'Invalid proof ID' });
  }

  if (!req.body.file_url) {
    return res.status(400).json({ success: false, message: 'file_url is required for update' });
  }

  const proof = await getAddressProofById(proofId);
  if (!proof) {
    return res.status(404).json({ success: false, message: 'Address proof not found' });
  }

  await updateAddressProof(proofId, req.body.file_url);

  res.json({
    success: true,
    message: 'Address proof updated successfully',
  });
});

export const deleteProofData = asyncHandler(async (req, res) => {
  const proofId = Number(req.params.id);
  if (!proofId || Number.isNaN(proofId)) {
    return res.status(400).json({ success: false, message: 'Invalid proof ID' });
  }

  const proof = await getAddressProofById(proofId);
  if (!proof) {
    return res.status(404).json({ success: false, message: 'Address proof not found' });
  }

  await deleteAddressProof(proofId);

  res.json({
    success: true,
    message: 'Address proof deleted successfully',
  });
});
