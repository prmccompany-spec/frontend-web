import express from 'express';
import { handleLogin, handleSendOtp, handleVerifyOtp, profile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', handleLogin);
router.post('/otp/send', handleSendOtp);
router.post('/otp/verify', handleVerifyOtp);
router.get('/profile', authMiddleware, profile);

export default router;
