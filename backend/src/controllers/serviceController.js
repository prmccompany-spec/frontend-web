import { asyncHandler } from '../middleware/errorHandler.js';
import {
  fetchServices,
  fetchServiceDetail,
  addService,
  modifyService,
  saveServiceForm,
  togglePublish,
  removeService,
  fetchDocuments,
  saveDocuments,
  fetchWorkflow,
  saveWorkflow,
} from '../services/serviceService.js';

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid service ID' });
    return null;
  }
  return id;
};

export const listServices = asyncHandler(async (req, res) => {
  const publishedOnly = req.query.published === 'true';
  const services = await fetchServices({ publishedOnly });
  res.json({ success: true, count: services.length, data: services });
});

export const getService = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const service = await fetchServiceDetail(id);
  res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  const result = await addService({ ...req.body, created_by: req.user?.id ?? null });
  res.status(201).json({ success: true, message: 'Service created', ...result });
});

export const updateService = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  await modifyService(id, req.body);
  res.json({ success: true, message: 'Service updated' });
});

export const deleteService = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  await removeService(id);
  res.json({ success: true, message: 'Service deactivated' });
});

export const publishService = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const publish = !!req.body.publish;
  await togglePublish(id, publish);
  res.json({ success: true, message: publish ? 'Service published' : 'Service unpublished' });
});

export const uploadForm = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No form file provided' });
  }
  const offline_form_path = await saveServiceForm(id, req.file);
  res.json({ success: true, message: 'Offline form uploaded', offline_form_path });
});

export const listDocuments = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const documents = await fetchDocuments(id);
  res.json({ success: true, data: documents });
});

export const updateDocuments = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const documents = await saveDocuments(id, req.body.documents);
  res.json({ success: true, message: 'Documents saved', data: documents });
});

export const listWorkflow = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const workflow = await fetchWorkflow(id);
  res.json({ success: true, data: workflow });
});

export const updateWorkflow = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const workflow = await saveWorkflow(id, req.body.steps);
  res.json({ success: true, message: 'Workflow saved', data: workflow });
});
