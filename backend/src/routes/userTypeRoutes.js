import express from 'express';
import {
  listUserTypes,
  createUserType,
  updateUserType,
} from '../controllers/userTypeController.js';

const router = express.Router();

router.get('/', listUserTypes);
router.post('/', createUserType);
router.put('/:id', updateUserType);

export default router;
