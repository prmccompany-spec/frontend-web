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

const router = express.Router();

// GET  /api/events              — list all (optional ?status=upcoming|ongoing|completed)
// GET  /api/events/:id          — single event
// POST /api/events              — create (multipart/form-data, image optional)
// PUT  /api/events/:id          — update (multipart/form-data, image optional)
// PATCH /api/events/:id/image   — upload/replace image only
// DELETE /api/events/:id        — soft-delete

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', uploadMiddleware.single('image'), createEvent);
router.put('/:id', uploadMiddleware.single('image'), updateEvent);
router.patch('/:id/image', uploadMiddleware.single('image'), uploadEventImage);
router.delete('/:id', deleteEvent);

export default router;
