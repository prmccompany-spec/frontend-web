import express from 'express';
import {
  listMemberStatuses,
  createMemberStatus,
  updateMemberStatus,
} from '../controllers/memberStatusController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', listMemberStatuses);
router.post('/', createMemberStatus);
router.put('/:id', updateMemberStatus);

export default router;
