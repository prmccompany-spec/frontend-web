import api from './api';

export const getServices = async (params = {}) => {
  const res = await api.get('/services', { params });
  return res.data.data;
};

export const getServiceDetail = async (id) => {
  const res = await api.get(`/services/${id}`);
  return res.data.data;
};

export const createService = async (data) => {
  const res = await api.post('/services', data);
  return res.data;
};

export const updateService = async (id, data) => {
  const res = await api.put(`/services/${id}`, data);
  return res.data;
};

export const deleteService = async (id) => {
  const res = await api.delete(`/services/${id}`);
  return res.data;
};

export const togglePublish = async (id, publish) => {
  const res = await api.patch(`/services/${id}/publish`, { publish });
  return res.data;
};

export const uploadServiceForm = async (id, formData) => {
  const res = await api.post(`/services/${id}/form`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getServiceDocuments = async (id) => {
  const res = await api.get(`/services/${id}/documents`);
  return res.data.data;
};

export const saveServiceDocuments = async (id, documents) => {
  const res = await api.put(`/services/${id}/documents`, { documents });
  return res.data;
};

export const getWorkflowSteps = async (id) => {
  const res = await api.get(`/services/${id}/workflow`);
  return res.data.data;
};

export const saveWorkflowSteps = async (id, steps) => {
  const res = await api.put(`/services/${id}/workflow`, { steps });
  return res.data;
};
