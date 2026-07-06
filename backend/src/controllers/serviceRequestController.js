import { asyncHandler } from '../middleware/errorHandler.js';
import {
  submitRequest,
  fetchMyRequests,
  fetchPendingApprovals,
  fetchRequestDetail,
  approveRequest,
  rejectRequest,
} from '../services/serviceRequestService.js';

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid request ID' });
    return null;
  }
  return id;
};

export const createRequest = asyncHandler(async (req, res) => {
  const serviceId = Number(req.body.service_id);
  if (!serviceId) {
    return res.status(400).json({ success: false, message: 'service_id is required' });
  }

  const filesByField = {};
  for (const file of req.files || []) {
    (filesByField[file.fieldname] ||= []).push(file);
  }

  const result = await submitRequest({
    memberId: req.user.id,
    serviceId,
    files: filesByField,
    remarks: req.body.remarks,
  });
  res.status(201).json({ success: true, message: 'Request submitted', ...result });
});

export const listMine = asyncHandler(async (req, res) => {
  const requests = await fetchMyRequests(req.user.id);
  res.json({ success: true, count: requests.length, data: requests });
});

export const listPending = asyncHandler(async (req, res) => {
  const requests = await fetchPendingApprovals(req.user.user_type_id);
  res.json({ success: true, count: requests.length, data: requests });
});

export const getRequest = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const request = await fetchRequestDetail(id, req.user);
  res.json({ success: true, data: request });
});

export const approve = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  await approveRequest(id, req.user, req.body.remarks);
  res.json({ success: true, message: 'Request approved' });
});

export const reject = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  await rejectRequest(id, req.user, req.body.remarks);
  res.json({ success: true, message: 'Request rejected' });
});
