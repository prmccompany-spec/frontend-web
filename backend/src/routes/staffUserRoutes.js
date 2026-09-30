import express from 'express';
import { create, list, setActive, update } from '../controllers/staffUserController.js';
import { authMiddleware, requireTypes } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware, requireTypes(1));
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/active', setActive);

export default router;