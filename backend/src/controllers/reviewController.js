import { asyncHandler } from '../middleware/errorHandler.js';
import {
  submitReview,
  fetchApprovedReviews,
  fetchReviews,
  moderateReview,
  removeReview,
} from '../services/reviewService.js';

// Public — anyone visiting the home page can submit, logged in or not.
export const createReview = asyncHandler(async (req, res) => {
  const { name, rating, message } = req.body;
  const result = await submitReview({ name, rating, message });
  res.status(201).json({ success: true, message: 'Thank you for your feedback! It will appear once approved.', id: result.id });
});

// Public — the home page testimonials section.
export const listApprovedReviews = asyncHandler(async (req, res) => {
  const reviews = await fetchApprovedReviews();
  res.json({ success: true, count: reviews.length, data: reviews });
});

// Admin — the moderation queue, any status (or all).
export const listReviews = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const reviews = await fetchReviews(status);
  res.json({ success: true, count: reviews.length, data: reviews });
});

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid review ID' });
  }
  const { status } = req.body;
  const review = await moderateReview(id, status, req.user.id);
  res.json({ success: true, message: `Review ${status}`, data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid review ID' });
  }
  await removeReview(id);
  res.json({ success: true, message: 'Review deleted' });
});
