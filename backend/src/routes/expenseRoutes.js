import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createExpense,
  updateExpense,
  listExpenses,
  getExpense,
  getSummary,
} from '../controllers/expenseController.js';

const router = express.Router();

// Every route here needs req.user (created_by is taken from the
// authenticated caller, never from the request body), so auth applies
// to the whole resource. Role gating is handled in the frontend nav.
router.use(authMiddleware);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/summary', getSummary);
router.get('/', listExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.get('/:id', getExpense);

export default router;
