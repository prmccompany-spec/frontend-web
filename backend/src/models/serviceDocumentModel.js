import { query } from '../config/database.js';

export const getDocumentsByServiceId = async (serviceId) => {
  return await query(
    'SELECT * FROM service_documents WHERE service_id = ? ORDER BY display_order ASC, id ASC',
    [serviceId]
  );
};

export const replaceDocuments = async (serviceId, documents) => {
  await query('DELETE FROM service_documents WHERE service_id = ?', [serviceId]);

  for (const [i, doc] of documents.entries()) {
    await query(
      `INSERT INTO service_documents (service_id, document_name, mandatory, allowed_extensions, max_file_size_mb, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        serviceId,
        doc.document_name.trim(),
        doc.mandatory !== false ? 1 : 0,
        doc.allowed_extensions || 'pdf,jpg,jpeg,png',
        doc.max_file_size_mb || 5,
        doc.display_order ?? i + 1,
      ]
    );
  }

  return await getDocumentsByServiceId(serviceId);
};
