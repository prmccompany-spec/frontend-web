import { getLoginHistory } from '../models/loginHistoryModel.js';

export const fetchLoginHistory = async (filters) => {
  return await getLoginHistory(filters);
};

export const fetchMyLoginHistory = async (memberId, limit) => {
  return await getLoginHistory({ member_id: memberId, limit: limit || 20 });
};
