import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createAddress,
  getAddressById,
  getAddressesByMemberId,
  updateAddress,
  deleteAddress,
} from '../models/addressModel.js';

const validateAddressPayload = (payload) => {
  if (!payload.member_id) {
    return 'member_id is required';
  }

  if (!payload.type || !['local', 'outside'].includes(payload.type)) {
    return 'type is required and must be either "local" or "outside"';
  }

  return null;
};

export const createNewAddress = asyncHandler(async (req, res) => {
  const validationError = validateAddressPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const addressId = await createAddress(req.body);
  res.status(201).json({
    success: true,
    message: 'Address created successfully',
    addressId,
  });
});

export const getAddress = asyncHandler(async (req, res) => {
  const addressId = Number(req.params.id);
  if (!addressId || Number.isNaN(addressId)) {
    return res.status(400).json({ success: false, message: 'Invalid address ID' });
  }

  const address = await getAddressById(addressId);
  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  res.json({
    success: true,
    data: address,
  });
});

export const getMemberAddresses = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.memberId);
  if (!memberId || Number.isNaN(memberId)) {
    return res.status(400).json({ success: false, message: 'Invalid member ID' });
  }

  const { type } = req.query;
  const addresses = await getAddressesByMemberId(memberId, type || null);

  res.json({
    success: true,
    count: addresses.length,
    data: addresses,
  });
});

export const updateAddressData = asyncHandler(async (req, res) => {
  const addressId = Number(req.params.id);
  if (!addressId || Number.isNaN(addressId)) {
    return res.status(400).json({ success: false, message: 'Invalid address ID' });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: 'No update data provided' });
  }

  const address = await getAddressById(addressId);
  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  await updateAddress(addressId, req.body);

  res.json({
    success: true,
    message: 'Address updated successfully',
  });
});

export const deleteAddressData = asyncHandler(async (req, res) => {
  const addressId = Number(req.params.id);
  if (!addressId || Number.isNaN(addressId)) {
    return res.status(400).json({ success: false, message: 'Invalid address ID' });
  }

  const address = await getAddressById(addressId);
  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  await deleteAddress(addressId);

  res.json({
    success: true,
    message: 'Address deleted successfully',
  });
});
