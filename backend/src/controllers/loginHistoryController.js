import { asyncHandler } from '../middleware/errorHandler.js';
import { fetchLoginHistory, fetchMyLoginHistory } from '../services/loginHistoryService.js';

export const listLoginHistory = asyncHandler(async (req, res) => {
  const { member_id, status, from, to, limit } = req.query;
  const history = await fetchLoginHistory({ member_id, status, from, to, limit });
  res.json({ success: true, count: history.length, data: history });
});

// Any logged-in user can see their own login history — scoped to req.user.id,
// so this needs no extra role check to be safe.
export const listMyLoginHistory = asyncHandler(async (req, res) => {
  const history = await fetchMyLoginHistory(req.user.id, Number(req.query.limit) || 20);
  res.json({ success: true, count: history.length, data: history });
});
