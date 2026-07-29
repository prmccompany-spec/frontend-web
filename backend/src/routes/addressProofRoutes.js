import express from 'express';
import {
  createNewProof,
  getProof,
  getMemberProofs,
  updateProofData,
  deleteProofData,
} from '../controllers/addressProofController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createNewProof);
router.get('/:id', getProof);
router.get('/member/:memberId', getMemberProofs);
router.put('/:id', updateProofData);
router.delete('/:id', deleteProofData);

export default router;
