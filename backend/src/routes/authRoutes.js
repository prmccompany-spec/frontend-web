import express from 'express';
import { handleRequestOtp, handleVerifyOtp, profile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request-otp', handleRequestOtp);
router.post('/verify-otp', handleVerifyOtp);
router.get('/profile', authMiddleware, profile);

export default router;
