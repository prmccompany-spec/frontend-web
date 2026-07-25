import { query } from '../config/database.js';

export const addHistoryEntry = async ({ request_id, workflow_step_id, action_by = null, status, remarks = null }) => {
  const result = await query(
    `INSERT INTO request_workflow_history (request_id, workflow_step_id, action_by, status, remarks)
     VALUES (?, ?, ?, ?, ?)`,
    [request_id, workflow_step_id, action_by, status, remarks]
  );
  return result.insertId;
};

export const getHistoryByRequestId = async (requestId) => {
  return await query(
    `SELECT h.*, ws.step_no, ws.step_label, ut.type_name AS role_name, m.name AS action_by_name
     FROM request_workflow_history h
     JOIN workflow_steps ws ON h.workflow_step_id = ws.id
     JOIN user_types ut ON ws.user_type_id = ut.id
     LEFT JOIN members m ON h.action_by = m.id
     WHERE h.request_id = ?
     ORDER BY h.action_date ASC, h.id ASC`,
    [requestId]
  );
};
