import express from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createPayment,
  listPayments,
  getPayment,
  getSummary,
  collectDuesForMember,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/summary', getSummary);
router.get('/', listPayments);
router.post('/', createPayment);
router.post('/collect-dues', collectDuesForMember);
router.get('/:id', getPayment);

export default router;
