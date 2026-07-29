import express from 'express';
import {
  listMembers,
  getMember,
  getNextMemberId,
  checkMemberId,
  createMember,
  updateMember,
  deleteMember,
  getMembersByStatus,
  getMembersByRole,
  getMembersByStatusAndRole,
  uploadMemberPhoto,
  uploadMemberQR,
  resetPassword,
} from '../controllers/memberController.js';
import { uploadPhoto, uploadQR } from '../middleware/upload.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', listMembers);
router.post('/', createMember);
router.get('/filter/status', getMembersByStatus);
router.get('/filter/role', getMembersByRole);
router.get('/filter/status-and-role', getMembersByStatusAndRole);
router.get('/next-id', getNextMemberId);
router.get('/check-id', checkMemberId);
router.get('/:id', getMember);
router.put('/:id', updateMember);
router.patch('/:id/photo', uploadPhoto.single('photo'), uploadMemberPhoto);
router.patch('/:id/qr', uploadQR.single('qr'), uploadMemberQR);
router.patch('/:id/reset-password', resetPassword);
router.delete('/:id', deleteMember);

export default router;
