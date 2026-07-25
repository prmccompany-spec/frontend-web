import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  updateServiceForm,
  setPublished,
  deactivateService,
  generateUniqueSlug,
} from '../models/serviceModel.js';
import { getDocumentsByServiceId, replaceDocuments } from '../models/serviceDocumentModel.js';
import { getStepsByServiceId, replaceSteps } from '../models/workflowStepModel.js';
import { deleteByUrl } from '../utils/cloudinaryUtils.js';

const requireService = async (id) => {
  const service = await getServiceById(id);
  if (!service) {
    const err = new Error('Service not found');
    err.statusCode = 404;
    throw err;
  }
  return service;
};

export const fetchServices = async ({ publishedOnly }) => {
  return await getAllServices({ publishedOnly });
};

export const fetchServiceDetail = async (id) => {
  const service = await requireService(id);
  const [documents, workflow] = await Promise.all([
    getDocumentsByServiceId(id),
    getStepsByServiceId(id),
  ]);
  return { ...service, documents, workflow };
};

export const addService = async ({ name, description, created_by }) => {
  if (!name || !name.trim()) {
    const err = new Error('Service name is required');
    err.statusCode = 400;
    throw err;
  }
  const slug = await generateUniqueSlug(name);
  const id = await createService({ name: name.trim(), slug, description: description || null, created_by });
  return { id, slug };
};

export const modifyService = async (id, { name, description }) => {
  if (!name || !name.trim()) {
    const err = new Error('Service name is required');
    err.statusCode = 400;
    throw err;
  }
  await requireService(id);
  await updateService(id, { name: name.trim(), description: description || null });
};

export const saveServiceForm = async (id, formUrl, formName) => {
  const service = await requireService(id);
  if (!formUrl) {
    const err = new Error('No form file uploaded');
    err.statusCode = 400;
    throw err;
  }
  if (service.offline_form_path) await deleteByUrl(service.offline_form_path);
  await updateServiceForm(id, formUrl, formName);
  return formUrl;
};

export const togglePublish = async (id, publish) => {
  const service = await requireService(id);
  if (publish) {
    const workflow = await getStepsByServiceId(id);
    if (!service.offline_form_path) {
      const err = new Error('Upload the offline form before publishing');
      err.statusCode = 400;
      throw err;
    }
    if (workflow.length === 0) {
      const err = new Error('Configure at least one workflow step before publishing');
      err.statusCode = 400;
      throw err;
    }
  }
  await setPublished(id, publish);
};

export const removeService = async (id) => {
  await requireService(id);
  await deactivateService(id);
};

export const fetchDocuments = async (serviceId) => {
  await requireService(serviceId);
  return await getDocumentsByServiceId(serviceId);
};

export const saveDocuments = async (serviceId, documents) => {
  await requireService(serviceId);
  if (!Array.isArray(documents)) {
    const err = new Error('documents must be an array');
    err.statusCode = 400;
    throw err;
  }
  for (const doc of documents) {
    if (!doc.document_name || !doc.document_name.trim()) {
      const err = new Error('Each document requires a name');
      err.statusCode = 400;
      throw err;
    }
  }
  return await replaceDocuments(serviceId, documents);
};

export const fetchWorkflow = async (serviceId) => {
  await requireService(serviceId);
  return await getStepsByServiceId(serviceId);
};

export const saveWorkflow = async (serviceId, steps) => {
  await requireService(serviceId);
  if (!Array.isArray(steps) || steps.length === 0) {
    const err = new Error('At least one workflow step is required');
    err.statusCode = 400;
    throw err;
  }
  for (const step of steps) {
    if (!step.user_type_id) {
      const err = new Error('Each step requires an approver role');
      err.statusCode = 400;
      throw err;
    }
  }
  return await replaceSteps(serviceId, steps);
};
