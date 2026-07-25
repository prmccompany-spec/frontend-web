import express from 'express';
import {
  listMemberStatuses,
  createMemberStatus,
  updateMemberStatus,
} from '../controllers/memberStatusController.js';

const router = express.Router();

router.get('/', listMemberStatuses);
router.post('/', createMemberStatus);
router.put('/:id', updateMemberStatus);

export default router;
