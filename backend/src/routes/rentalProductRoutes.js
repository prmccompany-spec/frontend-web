import express from 'express';
import {
  listRentalProducts,
  getRentalProduct,
  createRentalProduct,
  updateRentalProduct,
  deleteRentalProduct,
} from '../controllers/rentalProductController.js';

const router = express.Router();

router.get('/', listRentalProducts);
router.post('/', createRentalProduct);
router.get('/:id', getRentalProduct);
router.put('/:id', updateRentalProduct);
router.delete('/:id', deleteRentalProduct);

export default router;
