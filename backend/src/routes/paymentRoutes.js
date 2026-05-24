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
} from '../controllers/paymentController.js';

const router = express.Router();

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/summary', getSummary);
router.get('/', listPayments);
router.post('/', createPayment);
router.get('/:id', getPayment);

export default router;
