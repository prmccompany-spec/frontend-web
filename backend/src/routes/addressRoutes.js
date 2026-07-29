import express from 'express';
import {
  createNewAddress,
  getAddress,
  getMemberAddresses,
  updateAddressData,
  deleteAddressData,
} from '../controllers/addressController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createNewAddress);
router.get('/:id', getAddress);
router.get('/member/:memberId', getMemberAddresses);
router.put('/:id', updateAddressData);
router.delete('/:id', deleteAddressData);

export default router;
