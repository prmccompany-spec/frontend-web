import express from 'express';
import { getAll, create, update, destroy } from '../controllers/routePermissionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAll);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, destroy);

export default router;
