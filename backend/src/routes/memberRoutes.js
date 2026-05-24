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
  uploadMemberPhoto,
} from '../controllers/memberController.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = express.Router();

router.get('/', listMembers);
router.post('/', createMember);
router.get('/filter/status', getMembersByStatus);
router.get('/filter/role', getMembersByRole);
router.get('/filter/status-and-role', getMembersByStatusAndRole);
router.get('/:id', getMember);
router.put('/:id', updateMember);
router.patch('/:id/photo', uploadPhoto.single('photo'), uploadMemberPhoto);
router.delete('/:id', deleteMember);

export default router;
