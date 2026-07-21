import express from 'express';
import { listRentals, getRental, createRental, updateRentalStatus } from '../controllers/rentalController.js';

const router = express.Router();

router.get('/', listRentals);
router.post('/', createRental);
router.get('/:id', getRental);
router.patch('/:id/status', updateRentalStatus);

export default router;
