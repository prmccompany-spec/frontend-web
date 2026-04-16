import express from 'express';
import {
  createMember,
  updateMember,
  deleteMember,
  getMembersByStatus,
  getMembersByRole,
  getMembersByStatusAndRole,
} from '../controllers/memberController.js';

const router = express.Router();

router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);
router.get('/filter/status', getMembersByStatus);
router.get('/filter/role', getMembersByRole);
router.get('/filter/status-and-role', getMembersByStatusAndRole);

export default router;
