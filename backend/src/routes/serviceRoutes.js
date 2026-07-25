import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadServiceForm } from '../middleware/upload.js';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  publishService,
  uploadForm,
  listDocuments,
  updateDocuments,
  listWorkflow,
  updateWorkflow,
} from '../controllers/serviceController.js';

const router = express.Router();

// Reads are open — members need to browse/inspect services before logging
// an application, and the config screens need to pre-fill from the same data.
router.get('/', listServices);
router.get('/:id', getService);
router.get('/:id/documents', listDocuments);
router.get('/:id/workflow', listWorkflow);

// Writes need req.user (created_by on the service record). Role gating is
// handled in the frontend nav, not enforced here.
router.post('/', authMiddleware, createService);
router.put('/:id', authMiddleware, updateService);
router.delete('/:id', authMiddleware, deleteService);
router.patch('/:id/publish', authMiddleware, publishService);
router.post('/:id/form', authMiddleware, uploadServiceForm.single('form'), uploadForm);
router.put('/:id/documents', authMiddleware, updateDocuments);
router.put('/:id/workflow', authMiddleware, updateWorkflow);

export default router;
