import express from 'express';
import { authMiddleware, requireTypes } from '../middleware/authMiddleware.js';
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
const adminOnly = [authMiddleware, requireTypes(1)];

// Reads are open — members need to browse/inspect services before logging
// an application, and the config screens need to pre-fill from the same data.
router.get('/', listServices);
router.get('/:id', getService);
router.get('/:id/documents', listDocuments);
router.get('/:id/workflow', listWorkflow);

// Writes are admin-only.
router.post('/', adminOnly, createService);
router.put('/:id', adminOnly, updateService);
router.delete('/:id', adminOnly, deleteService);
router.patch('/:id/publish', adminOnly, publishService);
router.post('/:id/form', adminOnly, uploadServiceForm.single('form'), uploadForm);
router.put('/:id/documents', adminOnly, updateDocuments);
router.put('/:id/workflow', adminOnly, updateWorkflow);

export default router;
