import express from 'express';
import { listBranches, createBranch, updateBranch } from '../controllers/branchController.js';

const router = express.Router();

router.get('/', listBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);

export default router;
