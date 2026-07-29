import express from 'express';
import {
  listUserTypes,
  createUserType,
  updateUserType,
} from '../controllers/userTypeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', listUserTypes);
router.post('/', createUserType);
router.put('/:id', updateUserType);

export default router;
