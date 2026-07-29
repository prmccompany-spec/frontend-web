import { query } from '../config/database.js';

const REVIEW_SELECT = `
  SELECT r.*, m.name AS reviewed_by_name
  FROM reviews r
  LEFT JOIN members m ON m.id = r.reviewed_by
`;

export const createReview = async ({ name, rating, message }) => {
  const result = await query(
    'INSERT INTO reviews (name, rating, message) VALUES (?, ?, ?)',
    [name, rating, message]
  );
  return result.insertId;
};

export const getReviewById = async (id) => {
  const results = await query(`${REVIEW_SELECT} WHERE r.id = ?`, [id]);
  return results[0] || null;
};

export const getAllReviews = async (status) => {
  if (status) {
    return await query(`${REVIEW_SELECT} WHERE r.status = ? ORDER BY r.created_at DESC`, [status]);
  }
  return await query(`${REVIEW_SELECT} ORDER BY r.created_at DESC`);
};

// Public home page only ever needs approved reviews, newest first.
export const getApprovedReviews = async () => {
  return await query(
    "SELECT id, name, rating, message, created_at FROM reviews WHERE status = 'approved' ORDER BY created_at DESC"
  );
};

export const updateReviewStatus = async (id, status, reviewedBy) => {
  return await query(
    'UPDATE reviews SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
    [status, reviewedBy, id]
  );
};

export const deleteReview = async (id) => {
  return await query('DELETE FROM reviews WHERE id = ?', [id]);
};
