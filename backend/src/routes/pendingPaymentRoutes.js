import express from 'express';
import {
  listPendingPayments,
  createPendingPayment,
  updatePendingPayment,
  deletePendingPayment,
} from '../controllers/pendingPaymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// GET    /api/pending-payments?member_id=X&status=pending — list (all, or per member)
// POST   /api/pending-payments      — create { member_id, title, amount, due_date?, notes? }
// PUT    /api/pending-payments/:id  — update fields / mark paid { status: 'paid' }
// DELETE /api/pending-payments/:id  — remove

router.get('/', listPendingPayments);
router.post('/', createPendingPayment);
router.put('/:id', updatePendingPayment);
router.delete('/:id', deletePendingPayment);

export default router;
