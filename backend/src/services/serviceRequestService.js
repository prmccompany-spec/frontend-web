import { getServiceById } from '../models/serviceModel.js';
import { getDocumentsByServiceId } from '../models/serviceDocumentModel.js';
import { getStepsByServiceId, getStepByServiceAndStepNo } from '../models/workflowStepModel.js';
import {
  createServiceRequest,
  getRequestById,
  getRequestsByMember,
  getPendingForUserType,
  advanceRequest,
  completeRequest,
} from '../models/serviceRequestModel.js';
import { addRequestDocument, getDocumentsByRequestId } from '../models/requestDocumentModel.js';
import { addHistoryEntry, getHistoryByRequestId } from '../models/requestWorkflowHistoryModel.js';

const fail = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

const ACTIVE_STATUSES = ['SUBMITTED', 'IN_PROGRESS'];

export const submitRequest = async ({ memberId, serviceId, files, remarks }) => {
  const service = await getServiceById(serviceId);
  if (!service) fail('Service not found', 404);
  if (!service.is_published) fail('This service is not currently accepting requests', 400);

  const offlineFormFile = files?.offline_form?.[0];
  if (!offlineFormFile) fail('The filled offline form is required', 400);

  const requiredDocs = await getDocumentsByServiceId(serviceId);
  const missing = requiredDocs.filter((d) => d.mandatory && !files?.[`document_${d.id}`]?.[0]);
  if (missing.length > 0) {
    fail(`Missing mandatory documents: ${missing.map((d) => d.document_name).join(', ')}`, 400);
  }

  const steps = await getStepsByServiceId(serviceId);
  if (steps.length === 0) fail('This service has no configured approval workflow', 400);

  const { id: requestId, request_no } = await createServiceRequest({
    service_id: serviceId,
    member_id: memberId,
    remarks: remarks || null,
  });

  await addRequestDocument({
    request_id: requestId,
    service_document_id: null,
    document_type: 'OFFLINE_FORM',
    file_path: `uploads/service-requests/${offlineFormFile.filename}`,
    original_name: offlineFormFile.originalname,
  });

  for (const doc of requiredDocs) {
    const file = files?.[`document_${doc.id}`]?.[0];
    if (!file) continue;
    await addRequestDocument({
      request_id: requestId,
      service_document_id: doc.id,
      document_type: doc.document_name,
      file_path: `uploads/service-requests/${file.filename}`,
      original_name: file.originalname,
    });
  }

  await addHistoryEntry({
    request_id: requestId,
    workflow_step_id: steps[0].id,
    action_by: memberId,
    status: 'SUBMITTED',
    remarks: remarks || null,
  });

  return { id: requestId, request_no };
};

export const fetchMyRequests = async (memberId) => {
  return await getRequestsByMember(memberId);
};

export const fetchPendingApprovals = async (userTypeId) => {
  return await getPendingForUserType(userTypeId);
};

export const fetchRequestDetail = async (requestId, requester) => {
  const request = await getRequestById(requestId);
  if (!request) fail('Request not found', 404);

  const isOwner = requester.id === request.member_id;
  const isAdmin = requester.user_type_id === 1;
  let canView = isOwner || isAdmin;
  if (!canView) {
    const steps = await getStepsByServiceId(request.service_id);
    canView = steps.some((s) => s.user_type_id === requester.user_type_id);
  }
  if (!canView) fail('Not authorized to view this request', 403);

  const [documents, timeline] = await Promise.all([
    getDocumentsByRequestId(requestId),
    getHistoryByRequestId(requestId),
  ]);

  return { ...request, documents, timeline };
};

const requireCurrentStepApprover = async (request, approver) => {
  if (!ACTIVE_STATUSES.includes(request.status)) {
    fail('This request is no longer pending approval', 400);
  }
  const step = await getStepByServiceAndStepNo(request.service_id, request.current_step);
  if (!step || step.user_type_id !== approver.user_type_id) {
    fail('You are not the approver for the current step of this request', 403);
  }
  return step;
};

export const approveRequest = async (requestId, approver, remarks) => {
  const request = await getRequestById(requestId);
  if (!request) fail('Request not found', 404);
  const step = await requireCurrentStepApprover(request, approver);

  await addHistoryEntry({
    request_id: requestId,
    workflow_step_id: step.id,
    action_by: approver.id,
    status: 'APPROVED',
    remarks: remarks || null,
  });

  if (step.is_final) {
    await completeRequest(requestId, 'COMPLETED');
  } else {
    await advanceRequest(requestId, { current_step: request.current_step + 1, status: 'IN_PROGRESS' });
  }
};

export const rejectRequest = async (requestId, approver, remarks) => {
  if (!remarks || !remarks.trim()) fail('A reason is required to reject a request', 400);

  const request = await getRequestById(requestId);
  if (!request) fail('Request not found', 404);
  const step = await requireCurrentStepApprover(request, approver);
  if (!step.can_reject) fail('This step does not allow rejection', 400);

  await addHistoryEntry({
    request_id: requestId,
    workflow_step_id: step.id,
    action_by: approver.id,
    status: 'REJECTED',
    remarks,
  });

  await completeRequest(requestId, 'REJECTED');
};
