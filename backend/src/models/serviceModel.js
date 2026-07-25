import { query } from '../config/database.js';

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const generateUniqueSlug = async (name) => {
  const base = slugify(name);
  let slug = base;
  let i = 1;
  while (true) {
    const rows = await query('SELECT id FROM services WHERE slug = ?', [slug]);
    if (rows.length === 0) return slug;
    slug = `${base}-${i++}`;
  }
};

export const getAllServices = async ({ publishedOnly = false } = {}) => {
  const conditions = ['s.is_active = 1'];
  if (publishedOnly) conditions.push('s.is_published = 1');

  return await query(
    `SELECT s.*,
       (SELECT COUNT(*) FROM service_documents sd WHERE sd.service_id = s.id) AS document_count,
       (SELECT COUNT(*) FROM workflow_steps ws WHERE ws.service_id = s.id) AS step_count
     FROM services s
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.created_at DESC`
  );
};

export const getServiceById = async (id) => {
  const rows = await query('SELECT * FROM services WHERE id = ? AND is_active = 1', [id]);
  return rows[0] || null;
};

export const createService = async ({ name, slug, description = null, created_by = null }) => {
  const result = await query(
    'INSERT INTO services (name, slug, description, created_by) VALUES (?, ?, ?, ?)',
    [name, slug, description, created_by]
  );
  return result.insertId;
};

export const updateService = async (id, { name, description }) => {
  return await query(
    'UPDATE services SET name = ?, description = ? WHERE id = ?',
    [name, description ?? null, id]
  );
};

export const updateServiceForm = async (id, formPath, formName) => {
  return await query(
    'UPDATE services SET offline_form_path = ?, offline_form_name = ? WHERE id = ?',
    [formPath, formName, id]
  );
};

export const setPublished = async (id, isPublished) => {
  return await query('UPDATE services SET is_published = ? WHERE id = ?', [isPublished ? 1 : 0, id]);
};

export const deactivateService = async (id) => {
  return await query('UPDATE services SET is_active = 0, is_published = 0 WHERE id = ?', [id]);
};
