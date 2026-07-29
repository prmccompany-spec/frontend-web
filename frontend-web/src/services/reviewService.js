import api from './api';

// Public — no login required.
export const submitReview = (data) => api.post('/reviews', data);
export const getApprovedReviews = () => api.get('/reviews/approved');

// Admin — moderation queue.
export const getReviews = (status) =>
  api.get('/reviews', { params: status ? { status } : {} });
export const setReviewStatus = (id, status) => api.patch(`/reviews/${id}/status`, { status });
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
