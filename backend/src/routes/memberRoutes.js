import express from 'express';
import {
  listMembers,
  getMember,
  getNextMemberId,
  createMember,
  updateMember,
  deleteMember,
  getMembersByStatus,
  getMembersByRole,
  getMembersByStatusAndRole,
  uploadMemberPhoto,
  resetPassword,
} from '../controllers/memberController.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = express.Router();

router.get('/', listMembers);
router.post('/', createMember);
router.get('/filter/status', getMembersByStatus);
router.get('/filter/role', getMembersByRole);
router.get('/filter/status-and-role', getMembersByStatusAndRole);
router.get('/next-id', getNextMemberId);
router.get('/:id', getMember);
router.put('/:id', updateMember);
router.patch('/:id/photo', uploadPhoto.single('photo'), uploadMemberPhoto);
router.patch('/:id/reset-password', resetPassword);
router.delete('/:id', deleteMember);

export default router;
