import api from './api';

export const submitServiceRequest = async (formData) => {
  const res = await api.post('/service-requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getMyRequests = async () => {
  const res = await api.get('/service-requests/mine');
  return res.data.data;
};

export const getPendingApprovals = async () => {
  const res = await api.get('/service-requests/pending');
  return res.data.data;
};

export const getRequestDetail = async (id) => {
  const res = await api.get(`/service-requests/${id}`);
  return res.data.data;
};

export const approveRequest = async (id, remarks) => {
  const res = await api.post(`/service-requests/${id}/approve`, { remarks });
  return res.data;
};

export const rejectRequest = async (id, remarks) => {
  const res = await api.post(`/service-requests/${id}/reject`, { remarks });
  return res.data;
};
