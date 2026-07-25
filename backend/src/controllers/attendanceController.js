import { asyncHandler } from '../middleware/errorHandler.js';
import { recordScan, fetchAttendance } from '../services/attendanceService.js';

export const scan = asyncHandler(async (req, res) => {
  const result = await recordScan(req.body);
  res.status(201).json({ success: true, ...result });
});

export const listAttendance = asyncHandler(async (req, res) => {
  const { member_id, date, from, to } = req.query;
  const filters = {};
  if (member_id) filters.member_id = Number(member_id);
  if (date) filters.date = date;
  if (from) filters.from = from;
  if (to) filters.to = to;

  const records = await fetchAttendance(filters);
  res.json({ success: true, count: records.length, data: records });
});
