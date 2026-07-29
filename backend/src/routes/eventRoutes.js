import express from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  uploadEventImage,
  deleteEvent,
} from '../controllers/eventController.js';
import { uploadEventImage as uploadMiddleware } from '../middleware/upload.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET  /api/events              — list all (optional ?status=upcoming|ongoing|completed)
// GET  /api/events/:id          — single event
// POST /api/events              — create (multipart/form-data, image optional)
// PUT  /api/events/:id          — update (multipart/form-data, image optional)
// PATCH /api/events/:id/image   — upload/replace image only
// DELETE /api/events/:id        — soft-delete
//
// Reads are open — events are public marketing content, browsable without
// logging in. Writes need auth.

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', authMiddleware, uploadMiddleware.single('image'), createEvent);
router.put('/:id', authMiddleware, uploadMiddleware.single('image'), updateEvent);
router.patch('/:id/image', authMiddleware, uploadMiddleware.single('image'), uploadEventImage);
router.delete('/:id', authMiddleware, deleteEvent);

export default router;
