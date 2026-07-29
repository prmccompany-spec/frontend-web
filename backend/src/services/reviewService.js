import {
  createReview,
  getReviewById,
  getAllReviews,
  getApprovedReviews,
  updateReviewStatus,
  deleteReview,
} from '../models/reviewModel.js';

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const STATUSES = ['pending', 'approved', 'rejected'];

// Reviews render as compact testimonial cards on the home page — kept in
// sync with the client-side limits in FeedbackModal.jsx. This is the
// authoritative check; the frontend's maxLength is just UX convenience.
const NAME_MAX_LENGTH = 60;
const MESSAGE_MAX_LENGTH = 300;

// Public submission — no login required, so no member_id to attach. Only
// name, a 1-5 star rating and the message itself are collected.
export const submitReview = async ({ name, rating, message }) => {
  if (!name || !name.trim()) fail('Please enter your name', 400);
  if (name.trim().length > NAME_MAX_LENGTH) fail(`Name must be ${NAME_MAX_LENGTH} characters or fewer`, 400);

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    fail('Rating must be a whole number between 1 and 5', 400);
  }

  if (!message || !message.trim()) fail('Please share a few words about your experience', 400);
  if (message.trim().length > MESSAGE_MAX_LENGTH) fail(`Review must be ${MESSAGE_MAX_LENGTH} characters or fewer`, 400);

  const id = await createReview({ name: name.trim(), rating: ratingNum, message: message.trim() });
  return { id };
};

export const fetchApprovedReviews = async () => {
  return await getApprovedReviews();
};

export const fetchReviews = async (status) => {
  if (status && !STATUSES.includes(status)) {
    fail(`status must be one of: ${STATUSES.join(', ')}`, 400);
  }
  return await getAllReviews(status || null);
};

export const moderateReview = async (id, status, reviewedBy) => {
  if (!STATUSES.includes(status)) {
    fail(`status must be one of: ${STATUSES.join(', ')}`, 400);
  }
  const existing = await getReviewById(id);
  if (!existing) fail('Review not found', 404);

  await updateReviewStatus(id, status, reviewedBy);
  return await getReviewById(id);
};

export const removeReview = async (id) => {
  const existing = await getReviewById(id);
  if (!existing) fail('Review not found', 404);
  return await deleteReview(id);
};
