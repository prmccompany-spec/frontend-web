import express from 'express';
import {
  createReview,
  listApprovedReviews,
  listReviews,
  updateReviewStatus,
  deleteReview,
} from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/reviews           — public submission from the home page feedback form
// GET  /api/reviews/approved  — public, home page testimonials section
// GET  /api/reviews           — admin moderation queue (?status=pending|approved|rejected)
// PATCH /api/reviews/:id/status — admin approve/reject
// DELETE /api/reviews/:id     — admin remove a review
//
// Submitting and reading approved reviews are public — anyone visiting the
// site can leave feedback without logging in. Moderating needs auth.

router.post('/', createReview);
router.get('/approved', listApprovedReviews);
router.get('/', authMiddleware, listReviews);
router.patch('/:id/status', authMiddleware, updateReviewStatus);
router.delete('/:id', authMiddleware, deleteReview);

export default router;
