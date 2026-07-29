import express from 'express';
import { listRentals, getRental, createRental, updateRentalStatus, returnRental } from '../controllers/rentalController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', listRentals);
router.post('/', createRental);
router.get('/:id', getRental);
router.patch('/:id/status', updateRentalStatus);
router.patch('/:id/return', returnRental);

export default router;
