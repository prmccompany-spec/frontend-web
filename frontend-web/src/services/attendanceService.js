import api from './api';

export const scanAttendance = async (data) => {
  const res = await api.post('/attendance/scan', data);
  return res.data;
};

export const getAttendance = async (filters = {}) => {
  const res = await api.get('/attendance', { params: filters });
  return res.data;
};
