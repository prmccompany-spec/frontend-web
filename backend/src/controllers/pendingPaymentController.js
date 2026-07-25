import { asyncHandler } from '../middleware/errorHandler.js';
import {
  addPendingPayment,
  fetchPendingPaymentsForMember,
  fetchAllPendingPayments,
  modifyPendingPayment,
  removePendingPayment,
} from '../services/pendingPaymentService.js';

export const listPendingPayments = asyncHandler(async (req, res) => {
  const { member_id, status } = req.query;

  if (member_id) {
    const memberId = Number(member_id);
    if (!memberId || Number.isNaN(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid member_id' });
    }
    const items = await fetchPendingPaymentsForMember(memberId, status || null);
    return res.json({ success: true, count: items.length, data: items });
  }

  const items = await fetchAllPendingPayments();
  res.json({ success: true, count: items.length, data: items });
});

export const createPendingPayment = asyncHandler(async (req, res) => {
  const id = await addPendingPayment(req.body);
  res.status(201).json({ success: true, message: 'Pending payment created successfully', id });
});

export const updatePendingPayment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid pending payment ID' });
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: 'No update data provided' });
  }

  await modifyPendingPayment(id, req.body);
  res.json({ success: true, message: 'Pending payment updated successfully' });
});

export const deletePendingPayment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid pending payment ID' });
  }

  await removePendingPayment(id);
  res.json({ success: true, message: 'Pending payment deleted successfully' });
});
