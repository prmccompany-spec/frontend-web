import express from 'express';
import { listGotras, createGotra, updateGotra } from '../controllers/gotraController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', listGotras);
router.post('/', createGotra);
router.put('/:id', updateGotra);

export default router;
