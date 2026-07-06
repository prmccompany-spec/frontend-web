import { query } from '../config/database.js';

export const getStepsByServiceId = async (serviceId) => {
  return await query(
    `SELECT ws.*, ut.type_name
     FROM workflow_steps ws
     JOIN user_types ut ON ws.user_type_id = ut.id
     WHERE ws.service_id = ?
     ORDER BY ws.step_no ASC`,
    [serviceId]
  );
};

// Full ordered replace — step_no and is_final (last step) are always
// derived from array position so steps can never be configured out of
// order or with more than one final step.
export const replaceSteps = async (serviceId, steps) => {
  await query('DELETE FROM workflow_steps WHERE service_id = ?', [serviceId]);

  const total = steps.length;
  for (const [i, step] of steps.entries()) {
    const stepNo = i + 1;
    await query(
      `INSERT INTO workflow_steps (service_id, step_no, user_type_id, step_label, can_reject, is_final)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        serviceId,
        stepNo,
        step.user_type_id,
        step.step_label || null,
        step.can_reject !== false ? 1 : 0,
        stepNo === total ? 1 : 0,
      ]
    );
  }

  return await getStepsByServiceId(serviceId);
};

export const getStepByServiceAndStepNo = async (serviceId, stepNo) => {
  const rows = await query(
    'SELECT * FROM workflow_steps WHERE service_id = ? AND step_no = ?',
    [serviceId, stepNo]
  );
  return rows[0] || null;
};
