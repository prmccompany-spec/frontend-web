import express from 'express';
import { listBranches, createBranch, updateBranch } from '../controllers/branchController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', listBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);

export default router;
