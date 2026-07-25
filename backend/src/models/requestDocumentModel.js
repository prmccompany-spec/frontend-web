import { query } from '../config/database.js';

export const addRequestDocument = async ({ request_id, service_document_id = null, document_type, file_path, original_name }) => {
  const result = await query(
    `INSERT INTO request_documents (request_id, service_document_id, document_type, file_path, original_name)
     VALUES (?, ?, ?, ?, ?)`,
    [request_id, service_document_id, document_type, file_path, original_name]
  );
  return result.insertId;
};

export const getDocumentsByRequestId = async (requestId) => {
  return await query(
    `SELECT rd.*, sd.document_name
     FROM request_documents rd
     LEFT JOIN service_documents sd ON rd.service_document_id = sd.id
     WHERE rd.request_id = ?
     ORDER BY rd.id ASC`,
    [requestId]
  );
};
