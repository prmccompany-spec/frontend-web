import { createCheckIn, getOpenSession, setCheckOut, getAttendance } from '../models/attendanceModel.js';
import { getMemberByTableId, getMemberByMemberId } from '../models/memberModel.js';

const CHECKOUT_THRESHOLD_MS = 60 * 1000;

const fail = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

// QR encodes member_table_id (numeric); manual entry is more likely the
// human-facing member_id (e.g. "PRMC10005") — try both.
const resolveMember = async (code) => {
  const trimmed = String(code).trim();
  if (!trimmed) return null;
  return (await getMemberByTableId(trimmed)) || (await getMemberByMemberId(trimmed));
};

export const recordScan = async ({ code, marked_by = null }) => {
  if (!code || !String(code).trim()) fail('Scan code is required', 400);

  const member = await resolveMember(code);
  if (!member) fail('No member found for this code', 404);

  const openSession = await getOpenSession(member.id);

  if (!openSession) {
    const id = await createCheckIn({ member_id: member.id, marked_by });
    return { action: 'checkin', member, attendanceId: id };
  }

  const elapsedMs = Date.now() - new Date(openSession.check_in_time).getTime();
  if (elapsedMs < CHECKOUT_THRESHOLD_MS) {
    return {
      action: 'ignored',
      member,
      message: `Checked in ${Math.round(elapsedMs / 1000)}s ago — scan again after 1 minute to check out`,
    };
  }

  await setCheckOut(openSession.id);
  return { action: 'checkout', member, attendanceId: openSession.id };
};

export const fetchAttendance = async (filters) => {
  return await getAttendance(filters);
};
