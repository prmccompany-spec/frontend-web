import express from 'express';
import {
  createNewAddress,
  getAddress,
  getMemberAddresses,
  updateAddressData,
  deleteAddressData,
} from '../controllers/addressController.js';

const router = express.Router();

router.post('/', createNewAddress);
router.get('/:id', getAddress);
router.get('/member/:memberId', getMemberAddresses);
router.put('/:id', updateAddressData);
router.delete('/:id', deleteAddressData);

export default router;
