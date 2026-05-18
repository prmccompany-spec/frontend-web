import express from 'express';
import {
  listMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMembersByStatus,
  getMembersByRole,
  getMembersByStatusAndRole,
} from '../controllers/memberController.js';

const router = express.Router();

router.get('/', listMembers);
router.post('/', createMember);
router.get('/filter/status', getMembersByStatus);
router.get('/filter/role', getMembersByRole);
router.get('/filter/status-and-role', getMembersByStatusAndRole);
router.get('/:id', getMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
