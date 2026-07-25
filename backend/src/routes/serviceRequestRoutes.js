import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadRequestDocuments } from '../middleware/upload.js';
import {
  createRequest,
  listMine,
  listPending,
  listAll,
  getRequest,
  approve,
  reject,
} from '../controllers/serviceRequestController.js';

const router = express.Router();

// Every action here needs to know who the acting member is (submitter or
// approver), so auth is required for the whole resource.
router.use(authMiddleware);

router.post('/', uploadRequestDocuments, createRequest);
router.get('/mine', listMine);
router.get('/pending', listPending);
router.get('/all', listAll);
router.get('/:id', getRequest);
router.post('/:id/approve', approve);
router.post('/:id/reject', reject);

export default router;
