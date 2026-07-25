import { query } from '../config/database.js';

const generateRequestNo = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${date}-${rand}`;
};

export const createServiceRequest = async ({ service_id, member_id, remarks = null }) => {
  const request_no = generateRequestNo();
  const result = await query(
    'INSERT INTO service_requests (request_no, service_id, member_id, remarks) VALUES (?, ?, ?, ?)',
    [request_no, service_id, member_id, remarks]
  );
  return { id: result.insertId, request_no };
};

export const getRequestById = async (id) => {
  const rows = await query(
    `SELECT sr.*, s.name AS service_name, s.slug AS service_slug,
       m.name AS member_name, m.member_id AS member_code
     FROM service_requests sr
     JOIN services s ON sr.service_id = s.id
     JOIN members m ON sr.member_id = m.id
     WHERE sr.id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const getAllRequests = async () => {
  return await query(
    `SELECT sr.*, s.name AS service_name, s.slug AS service_slug,
       m.name AS member_name, m.member_id AS member_code,
       ws.step_label AS current_step_label, ut.type_name AS current_step_role
     FROM service_requests sr
     JOIN services s ON sr.service_id = s.id
     JOIN members m ON sr.member_id = m.id
     LEFT JOIN workflow_steps ws ON ws.service_id = sr.service_id AND ws.step_no = sr.current_step
     LEFT JOIN user_types ut ON ut.id = ws.user_type_id
     ORDER BY sr.submitted_at DESC`
  );
};

export const getRequestsByMember = async (memberId) => {
  return await query(
    `SELECT sr.*, s.name AS service_name, s.slug AS service_slug
     FROM service_requests sr
     JOIN services s ON sr.service_id = s.id
     WHERE sr.member_id = ?
     ORDER BY sr.submitted_at DESC`,
    [memberId]
  );
};

export const getPendingForUserType = async (userTypeId) => {
  return await query(
    `SELECT sr.*, s.name AS service_name, m.name AS member_name, m.member_id AS member_code,
       ws.id AS workflow_step_id, ws.step_label, ws.is_final, ws.can_reject
     FROM service_requests sr
     JOIN services s ON sr.service_id = s.id
     JOIN members m ON sr.member_id = m.id
     JOIN workflow_steps ws ON ws.service_id = sr.service_id AND ws.step_no = sr.current_step
     WHERE ws.user_type_id = ? AND sr.status IN ('SUBMITTED', 'IN_PROGRESS')
     ORDER BY sr.submitted_at ASC`,
    [userTypeId]
  );
};

export const advanceRequest = async (id, { current_step, status }) => {
  return await query(
    'UPDATE service_requests SET current_step = ?, status = ? WHERE id = ?',
    [current_step, status, id]
  );
};

export const completeRequest = async (id, status) => {
  return await query(
    'UPDATE service_requests SET status = ?, completed_at = NOW() WHERE id = ?',
    [status, id]
  );
};
